# 可学习参考的地方（12-）

## 12. 字幕转语音的核心处理

在 `srt2speech.go` 中核心处理函数 srtFileToSpeech 的主要流程如下：

1. 检查是否启用TTS功能
2. 解析SRT字幕文件，获取文本内容和时间信息
3. 处理音色选择（支持默认音色或克隆音色）
4. 逐条处理字幕，生成对应的语音片段
5. 调整每个语音片段的时长，确保与字幕时间轴对齐
6. 最后将所有音频片段合并成完整的语音文件

```go
// srtFileToSpeech 将SRT字幕文件转换为语音文件
// @param ctx - 上下文信息
// @param stepParam - 字幕任务的参数信息，包含任务配置和路径信息
// @return error - 处理过程中的错误信息
func (s Service) srtFileToSpeech(ctx context.Context, stepParam *types.SubtitleTaskStepParam) error {
	if !stepParam.EnableTts {
		return nil
	}
	// Step 1: 解析字幕文件，获取字幕内容和时间信息
	subtitles, err := parseSRT(stepParam.TtsSourceFilePath)
	if err != nil {
		return fmt.Errorf("srtFileToSpeech parseSRT error: %w", err)
	}

	var audioFiles []string
	var currentTime time.Time

	// 创建文件记录音频的时间轴信息，用于调试和验证
	durationDetailFile, err := os.Create(filepath.Join(stepParam.TaskBasePath, types.TtsAudioDurationDetailsFileName))
	if err != nil {
		return fmt.Errorf("srtFileToSpeech create durationDetailFile error: %w", err)
	}
	defer durationDetailFile.Close()

	// Step 2: 处理音色选择
	// 支持默认音色或自定义克隆音色
	voiceCode := stepParam.TtsVoiceCode
	if stepParam.VoiceCloneAudioUrl != "" {
		var code string
		code, err = s.VoiceCloneClient.CosyVoiceClone("krillinai", stepParam.VoiceCloneAudioUrl)
		if err != nil {
			return fmt.Errorf("srtFileToSpeech CosyVoiceClone error: %w", err)
		}
		voiceCode = code
	}

	for i, sub := range subtitles {
		outputFile := filepath.Join(stepParam.TaskBasePath, fmt.Sprintf("subtitle_%d.wav", i+1))
		err = s.TtsClient.Text2Speech(sub.Text, voiceCode, outputFile)
		if err != nil {
			return fmt.Errorf("srtFileToSpeech Text2Speech error: %w", err)
		}

		// Step 3: 调整音频时长
		startTime, err := time.Parse("15:04:05,000", sub.Start)
		if err != nil {
			return fmt.Errorf("srtFileToSpeech parse time error: %w", err)
		}
		endTime, err := time.Parse("15:04:05,000", sub.End)
		if err != nil {
			return fmt.Errorf("srtFileToSpeech audioToSubtitle.time.Parse error: %w", err)
		}
		if i == 0 {
			// 如果第一条字幕不是从00:00开始，增加静音帧
			if startTime.Second() > 0 {
				silenceDurationMs := startTime.Sub(time.Date(0, 1, 1, 0, 0, 0, 0, time.UTC)).Milliseconds()
				silenceFilePath := filepath.Join(stepParam.TaskBasePath, "silence_0.wav")
				err := newGenerateSilence(silenceFilePath, float64(silenceDurationMs)/1000)
				if err != nil {
					return fmt.Errorf("srtFileToSpeech newGenerateSilence error: %w", err)
				}
				audioFiles = append(audioFiles, silenceFilePath)

				// 计算静音帧的结束时间
				silenceEndTime := currentTime.Add(time.Duration(silenceDurationMs) * time.Millisecond)
				durationDetailFile.WriteString(fmt.Sprintf("Silence: start=%s, end=%s\n", currentTime.Format("15:04:05,000"), silenceEndTime.Format("15:04:05,000")))
				currentTime = silenceEndTime
			}
		}

		duration := endTime.Sub(startTime).Seconds()
		if i < len(subtitles)-1 {
			// 如果不是最后一条字幕，增加静音帧时长
			nextStartTime, err := time.Parse("15:04:05,000", subtitles[i+1].Start)
			if err != nil {
				return fmt.Errorf("srtFileToSpeech parse time error: %w", err)
			}
			if endTime.Before(nextStartTime) {
				duration = nextStartTime.Sub(startTime).Seconds()
			}
		}

		adjustedFile := filepath.Join(stepParam.TaskBasePath, fmt.Sprintf("adjusted_%d.wav", i+1))
		err = adjustAudioDuration(outputFile, adjustedFile, stepParam.TaskBasePath, duration)
		if err != nil {
			return fmt.Errorf("srtFileToSpeech adjustAudioDuration error: %w", err)
		}

		audioFiles = append(audioFiles, adjustedFile)

		// 计算音频的实际时长
		audioDuration, err := util.GetAudioDuration(adjustedFile)
		if err != nil {
			return fmt.Errorf("srtFileToSpeech GetAudioDuration error: %w", err)
		}

		// 计算音频的结束时间
		audioEndTime := currentTime.Add(time.Duration(audioDuration*1000) * time.Millisecond)
		// 写入文件
		durationDetailFile.WriteString(fmt.Sprintf("Audio %d: start=%s, end=%s\n", i+1, currentTime.Format("15:04:05,000"), audioEndTime.Format("15:04:05,000")))
		currentTime = audioEndTime
	}

	// Step 6: 拼接所有音频文件
	finalOutput := filepath.Join(stepParam.TaskBasePath, types.TtsResultAudioFileName)
	err = concatenateAudioFiles(audioFiles, finalOutput, stepParam.TaskBasePath)
	if err != nil {
		return fmt.Errorf("srtFileToSpeech concatenateAudioFiles error: %w", err)
	}
	stepParam.TtsResultFilePath = finalOutput
	// 更新字幕任务信息
	storage.SubtitleTasks[stepParam.TaskId].ProcessPct = 98
	return nil
}
```

### 解析字幕文件

- 使用正则表达式解析SRT格式
- 时间格式：00:00:00,000 --> 00:00:00,000
- 提取开始时间、结束时间和文本内容

```go
// parseSRT 解析SRT字幕文件
// @param filePath - SRT文件路径
// @return []types.SrtSentenceWithStrTime - 解析后的字幕数组
// @return error - 解析过程中的错误信息
func parseSRT(filePath string) ([]types.SrtSentenceWithStrTime, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("parseSRT read file error: %w", err)
	}

	var subtitles []types.SrtSentenceWithStrTime
	// 使用正则表达式匹配SRT格式：时间码 --> 时间码 + 文本内容
	re := regexp.MustCompile(`(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\s+(.+?)\n`)
	matches := re.FindAllStringSubmatch(string(data), -1)

	for _, match := range matches {
		subtitles = append(subtitles, types.SrtSentenceWithStrTime{
			Start: match[1],
			End:   match[2],
			Text:  strings.Replace(match[3], "\n", " ", -1), // 去除换行符，确保文本格式统一
		})
	}

	return subtitles, nil
}
```

### 阿里云音色克隆服务

- 阿里云 TTS 功能除了支持默认音色，也支持自定义克隆的音色，生成对应的音色编码

```go
// CosyVoiceClone 调用阿里云智能语音服务的音色克隆功能
// 该服务可以基于上传的音频样本，克隆出对应的声音特征，生成专属音色
//
// @param voicePrefix - 音色标识前缀，用于区分不同的音色克隆任务
// @param audioURL - 待克隆的音频样本URL地址
// @return string - 返回生成的音色ID（VoiceName）
// @return error - 处理过程中的错误信息
func (c *VoiceCloneClient) CosyVoiceClone(voicePrefix, audioURL string) (string, error) {
	// 构建阿里云API请求参数
	// 参数说明：
	// - AccessKeyId: 访问密钥ID
	// - Action: API动作名称
	// - Format: 返回数据格式
	// - RegionId: 地域ID，目前音色克隆服务在上海地域
	// - SignatureMethod: 签名方法，使用HMAC-SHA1
	// - SignatureNonce: 唯一随机数，用于防止网络重放攻击
	// - SignatureVersion: 签名算法版本
	// - Timestamp: 请求时间戳（UTC格式）
	// - Version: API版本号
	// - VoicePrefix: 音色标识前缀
	// - Url: 音频样本的URL地址
	parameters := map[string]string{
		"AccessKeyId":      c.accessKeyID,
		"Action":           "CosyVoiceClone",
		"Format":           "JSON",
		"RegionId":         "cn-shanghai",
		"SignatureMethod":  "HMAC-SHA1",
		"SignatureNonce":   uuid.New().String(),
		"SignatureVersion": "1.0",
		"Timestamp":        time.Now().UTC().Format("2006-01-02T15:04:05Z"),
		"Version":          "2019-08-19",
		"VoicePrefix":      voicePrefix,
		"Url":              audioURL,
	}

	// 生成规范化的请求字符串
	queryString := _encodeDict(parameters)

	// 构造待签名字符串
	// 格式：HTTPMethod + "&" + 编码后的斜杠 + "&" + 编码后的参数字符串
	stringToSign := "POST" + "&" + _encodeText("/") + "&" + _encodeText(queryString)

	// 使用AccessKeySecret生成请求签名
	signature := GenerateSignature(c.accessKeySecret, stringToSign)

	// 构建完整的请求URL
	// 阿里云智能语音服务的API端点：nls-slp.cn-shanghai.aliyuncs.com
	fullURL := fmt.Sprintf("https://nls-slp.cn-shanghai.aliyuncs.com/?Signature=%s&%s", signature, queryString)

	// 构建POST请求的表单数据
	values := url.Values{}
	for key, value := range parameters {
		values.Add(key, value)
	}

	// 发送HTTP请求并解析响应
	var res VoiceCloneResp
	resp, err := c.restyClient.R().SetResult(&res).Post(fullURL)
	if err != nil {
		return "", fmt.Errorf("CosyVoiceClone post error: %w: ", err)
	}


	// 检查响应状态
	// 只有返回 "SUCCESS" 时才表示克隆成功
	if res.Message != "SUCCESS" {
		return "", fmt.Errorf("CosyVoiceClone res message is not success, message: %s", res.Message)
	}

	// 返回生成的音色ID
	return res.VoiceName, nil
}


// _encodeText 对文本进行URL编码，并按照阿里云API签名规范处理特殊字符
// 规范要求：
// 1. 对字符进行UTF-8编码
// 2. 将空格编码为%20，而不是+
// 3. 将星号(*)编码为%2A
// 4. 不对波浪线(~)进行编码
//
// @param text - 需要编码的原始文本
// @return string - 编码后的文本
func _encodeText(text string) string {
	encoded := url.QueryEscape(text)
	// 根据阿里云API签名规范替换特殊字符
	return strings.ReplaceAll(
		strings.ReplaceAll(
			strings.ReplaceAll(encoded, "+", "%20"),
			"*", "%2A"),
		"%7E", "~")
}

// _encodeDict 将参数字典转换为规范化的查询字符串
// 处理步骤：
// 1. 对参数名进行字典排序
// 2. 对参数名和参数值分别进行URL编码
// 3. 使用等号(=)连接编码后的参数名和参数值
// 4. 使用与号(&)连接所有参数对
//
// @param dic - 包含请求参数的字典
// @return string - 规范化的查询字符串
func _encodeDict(dic map[string]string) string {
	// 提取所有键并按字典序排序
	var keys []string
	for key := range dic {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	// 构建规范化的参数对
	values := url.Values{}
	for _, k := range keys {
		values.Add(k, dic[k])
	}

	// 对整个查询字符串进行编码，并按规范处理特殊字符
	encodedText := values.Encode()
	return strings.ReplaceAll(
		strings.ReplaceAll(
			strings.ReplaceAll(encodedText, "+", "%20"),
			"*", "%2A"),
		"%7E", "~")
}

// GenerateSignature 生成阿里云API请求的签名
// 签名算法：
// 1. 使用请求参数构造规范化的字符串
// 2. 使用HMAC-SHA1算法对字符串进行加密
// 3. 将加密结果进行Base64编码
// 4. 对Base64编码结果进行URL编码
//
// @param secret - 访问密钥Secret（AccessKeySecret）
// @param stringToSign - 待签名的字符串，格式：HTTPMethod + "&" + 编码后的斜杠 + "&" + 编码后的参数字符串
// @return string - URL编码后的签名字符串
func GenerateSignature(secret, stringToSign string) string {
	// 在密钥末尾添加符号&
	key := []byte(secret + "&")
	data := []byte(stringToSign)

	// 使用HMAC-SHA1算法计算签名
	hash := hmac.New(sha1.New, key)
	hash.Write(data)

	// 对签名进行Base64编码
	signature := base64.StdEncoding.EncodeToString(hash.Sum(nil))

	// 对签名进行URL编码，确保可以安全传输
	return _encodeText(signature)
}
```

### 阿里云文字转语音服务

- 使用阿里云语音合成(Text-to-Speech)功能，通过WebSocket通信将文本转换为语音

```go
// Text2Speech 将文本转换为语音并保存到文件
// text: 需要合成的文本内容
// voice: 发音人声音
// outputFile: 输出音频文件路径
func (c *TtsClient) Text2Speech(text, voice, outputFile string) error {
	// 创建输出文件
	file, err := os.OpenFile(outputFile, os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	// 建立WebSocket连接
	var conn *websocket.Conn
	token, _ := CreateToken(c.AccessKeyID, c.AccessKeySecret) // 生成认证Token
	fullURL := "wss://nls-gateway-cn-beijing.aliyuncs.com/ws/v1?token=" + token
	dialer := websocket.DefaultDialer
	dialer.HandshakeTimeout = 10 * time.Second
	conn, _, err = dialer.Dial(fullURL, nil)
	if err != nil {
		return err
	}
	_ = conn.SetReadDeadline(time.Now().Add(time.Second * 60)) // 设置读取超时
	defer c.Close(conn)

	// 处理文本消息的回调函数
	onTextMessage := func(message string) {
		log.GetLogger().Info("Received text message", zap.String("Message", message))
	}

	// 处理二进制消息（音频数据）的回调函数
	onBinaryMessage := func(data []byte) {
		if _, err := file.Write(data); err != nil {
			log.GetLogger().Error("Failed to write data to file", zap.Error(err))
		}
	}

	// 用于同步的通道
	var (
		synthesisStarted  = make(chan struct{}) // 合成开始信号
		synthesisComplete = make(chan struct{}) // 合成完成信号
	)

	// 配置语音合成参数
	startPayload := StartSynthesisPayload{
		Voice:      voice,
		Format:     "wav",
		SampleRate: 44100,
		Volume:     50,
		SpeechRate: 0,
		PitchRate:  0,
	}

	// 启动消息接收协程
	go c.receiveMessages(conn, onTextMessage, onBinaryMessage, synthesisStarted, synthesisComplete)

	// 生成任务ID并开始语音合成
	taskId := util.GenerateID()
	if err := c.StartSynthesis(conn, taskId, startPayload, synthesisStarted); err != nil {
		return fmt.Errorf("failed to start synthesis: %w", err)
	}

	// 发送要合成的文本
	if err := c.RunSynthesis(conn, taskId, text); err != nil {
		return fmt.Errorf("failed to run synthesis: %w", err)
	}

	// 停止合成并等待完成
	if err := c.StopSynthesis(conn, taskId, synthesisComplete); err != nil {
		return fmt.Errorf("failed to stop synthesis: %w", err)
	}

	return nil
}

// sendMessage 发送WebSocket消息
// conn: WebSocket连接
// taskId: 任务ID
// name: 消息名称
// payload: 消息负载
func (c *TtsClient) sendMessage(conn *websocket.Conn, taskId, name string, payload interface{}) error {
	message := Message{
		Header: TtsHeader{
			Appkey:    c.Appkey,
			MessageID: util.GenerateID(),
			TaskID:    taskId,
			Namespace: "FlowingSpeechSynthesizer",
			Name:      name,
		},
		Payload: payload,
	}
	jsonData, _ := json.Marshal(message)
	return conn.WriteJSON(message)
}

// StartSynthesis 开始语音合成
// conn: WebSocket连接
// taskId: 任务ID
// payload: 开始合成的参数
// synthesisStarted: 合成开始信号通道
func (c *TtsClient) StartSynthesis(conn *websocket.Conn, taskId string, payload StartSynthesisPayload, synthesisStarted chan struct{}) error {
	err := c.sendMessage(conn, taskId, "StartSynthesis", payload)
	if err != nil {
		return err
	}

	// 阻塞等待 SynthesisStarted 事件
	<-synthesisStarted

	return nil
}

// RunSynthesis 发送要合成的文本
// conn: WebSocket连接
// taskId: 任务ID
// text: 要合成的文本内容
func (c *TtsClient) RunSynthesis(conn *websocket.Conn, taskId, text string) error {
	return c.sendMessage(conn, taskId, "RunSynthesis", RunSynthesisPayload{Text: text})
}

// StopSynthesis 停止语音合成
// conn: WebSocket连接
// taskId: 任务ID
// synthesisComplete: 合成完成信号通道
func (c *TtsClient) StopSynthesis(conn *websocket.Conn, taskId string, synthesisComplete chan struct{}) error {
	err := c.sendMessage(conn, taskId, "StopSynthesis", nil)
	if err != nil {
		return err
	}

	// 阻塞等待 SynthesisCompleted 事件
	<-synthesisComplete

	return nil
}

// Close 关闭WebSocket连接
func (c *TtsClient) Close(conn *websocket.Conn) error {
	err := conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	if err != nil {
		return err
	}
	return conn.Close()
}

// receiveMessages 接收并处理WebSocket消息
// conn: WebSocket连接
// onTextMessage: 处理文本消息的回调函数
// onBinaryMessage: 处理二进制消息的回调函数
// synthesisStarted: 合成开始信号通道
// synthesisComplete: 合成完成信号通道
func (c *TtsClient) receiveMessages(conn *websocket.Conn, onTextMessage func(string), onBinaryMessage func([]byte), synthesisStarted, synthesisComplete chan struct{}) {
	defer close(synthesisComplete)
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure) {
				return
			}
			return
		}
		if messageType == websocket.TextMessage {
			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				return
			}
			if msg.Header.Name == "SynthesisCompleted" {
				// 收到结束消息退出
				break
			} else if msg.Header.Name == "SynthesisStarted" {
				close(synthesisStarted)
			} else {
				onTextMessage(string(message))
			}
		} else if messageType == websocket.BinaryMessage {
			onBinaryMessage(message)
		}
	}
}
```

### 静音帧的处理

- 在视频中，字幕通常不是从视频一开始就出现的，可能会有一段时间的空白
- 所以为了让生成的语音与原视频的时间轴完全匹配，需要在开头添加一段相应长度的静音

```go
		if i == 0 {
			// 处理第一条字幕的情况
			// 如果第一条字幕不是从00:00开始，需要在开头增加静音帧
			// 这样做是为了保持生成的语音文件与原视频的时间轴同步
			if startTime.Second() > 0 {
				// 计算需要添加的静音时长（毫秒）
				// 从00:00:00到字幕开始时间的差值
				silenceDurationMs := startTime.Sub(time.Date(0, 1, 1, 0, 0, 0, 0, time.UTC)).Milliseconds()
				// 生成静音音频文件路径
				silenceFilePath := filepath.Join(stepParam.TaskBasePath, "silence_0.wav")
				// 调用函数生成指定时长的静音音频文件
				// 将毫秒转换为秒作为参数传入
				err := newGenerateSilence(silenceFilePath, float64(silenceDurationMs)/1000)
				if err != nil {
					log.GetLogger().Error("srtFileToSpeech newGenerateSilence error", zap.Any("stepParam", stepParam), zap.Error(err))
					return fmt.Errorf("srtFileToSpeech newGenerateSilence error: %w", err)
				}
				// 将生成的静音文件添加到待合并的音频文件列表中
				audioFiles = append(audioFiles, silenceFilePath)

				// 计算静音帧的结束时间，用于记录详细的时间信息
				silenceEndTime := currentTime.Add(time.Duration(silenceDurationMs) * time.Millisecond)
				// 将静音帧的时间信息写入详细记录文件
				durationDetailFile.WriteString(fmt.Sprintf("Silence: start=%s, end=%s\n", currentTime.Format("15:04:05,000"), silenceEndTime.Format("15:04:05,000")))
				// 更新当前时间指针为静音结束时间，为后续的音频片段计时做准备
				currentTime = silenceEndTime
			}
		}

// newGenerateSilence 生成指定时长的静音音频文件
// @param outputAudio - 输出音频文件路径
// @param duration - 静音时长（秒）
// @return error - 生成过程中的错误信息
func newGenerateSilence(outputAudio string, duration float64) error {
	// 使用FFmpeg生成PCM格式的静音文件
	// 参数说明：
	// -f lavfi: 使用lavfi输入格式
	// anullsrc: 生成静音音频源
	// channel_layout=mono: 单声道
	// sample_rate=44100: 采样率44.1kHz
	cmd := exec.Command(storage.FfmpegPath, "-y", "-f", "lavfi", "-i", "anullsrc=channel_layout=mono:sample_rate=44100", "-t",
		fmt.Sprintf("%.3f", duration), "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", outputAudio)
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("newGenerateSilence failed to generate PCM silence: %w", err)
	}

	return nil
}
```


## 13. 嵌入字幕到视频的核心处理
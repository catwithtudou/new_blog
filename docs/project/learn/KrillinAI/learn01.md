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

### 静音帧和合并音频文件的处理

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

- 这部分也包含在后续调整音频时长的时候，如果音频时长的时间小于字幕文件的时间，也需要为原有的音频时长增加一段静音音频来对齐时间轴
- 这里也包含使用 FFmpeg 的 Concat 方式合并多个音频文件成一个音频文件

```go
// 计算需要补充的静音时长
// subtitleDuration: 字幕要求的时长
// audioDuration: 实际生成的语音时长
// silenceDuration: 需要补充的静音时长
silenceDuration := subtitleDuration - audioDuration

// 生成静音文件的完整路径
silenceFile := filepath.Join(taskBasePath, "silence.wav")

// 调用newGenerateSilence生成指定时长的静音WAV文件
// 使用FFmpeg的anullsrc滤镜生成静音音频
err := newGenerateSilence(silenceFile, silenceDuration)
if err != nil {
    return fmt.Errorf("error generating silence: %v", err)
}

// 获取生成的静音文件的实际时长，用于日志记录和验证
silenceAudioDuration, _ := util.GetAudioDuration(silenceFile)

// 创建FFmpeg拼接配置文件
// 这个文件用于告诉FFmpeg如何拼接音频文件
concatFile := filepath.Join(taskBasePath, "concat.txt")
f, err := os.Create(concatFile)
if err != nil {
    return fmt.Errorf("adjustAudioDuration create concat file error: %w", err)
}
// 确保临时文件在使用后被删除
defer os.Remove(concatFile)

// 写入FFmpeg拼接配置
// 格式要求：
// 1. 每行必须以'file'开头
// 2. 文件路径需要用单引号包裹
// 3. 每个文件占一行
// 4. 文件按顺序拼接，先播放第一个文件，再播放第二个文件
_, err = f.WriteString(fmt.Sprintf("file '%s'\nfile '%s'\n",
    filepath.Base(inputFile),  // 原始语音文件
    filepath.Base(silenceFile))) // 静音文件
if err != nil {
    return fmt.Errorf("adjustAudioDuration write to concat file error: %v", err)
}
// 关闭文件，确保内容被写入
f.Close()

// 执行FFmpeg拼接命令
// 参数说明：
// -y: 覆盖已存在的输出文件
// -f concat: 使用concat格式进行拼接
// -safe 0: 允许使用绝对路径
// -i concatFile: 指定拼接配置文件
// -c copy: 直接复制音频流，不重新编码，保持原始质量
cmd := exec.Command(storage.FfmpegPath, "-y", "-f", "concat", "-safe", "0", "-i", concatFile, "-c", "copy", outputFile)


// 将FFmpeg的错误输出重定向到标准错误
cmd.Stderr = os.Stderr

// 执行FFmpeg命令
err = cmd.Run()
if err != nil {
    return fmt.Errorf("adjustAudioDuration concat audio and silence error: %v", err)
}

// 获取拼接后文件的时长，用于验证
concatFileDuration, _ := util.GetAudioDuration(outputFile)
return nil
```

## 13. 嵌入字幕到视频的核心处理

对字幕嵌入处理的主要理解如下：

**1. 字幕嵌入主流程**

- 支持横屏、竖屏或同时处理两种格式
- 根据原始视频的分辨率判断是横屏还是竖屏
- 横屏可以生成竖屏版本，但竖屏不能生成横屏版本

**2. 字幕文本处理**

- 针对不同语言（东亚语言和西方语言）采用不同的分割逻辑
- 长文本会智能拆分为多行，保证视觉平衡
- 双语字幕处理，支持原语言和目标语言同时显示

**3. 格式转换**

- 将SRT格式转换为功能更强大的ASS格式
- ASS格式支持更丰富的样式和位置控制
- 横竖屏模式使用不同的ASS模板

**4. 视频处理**

- 使用FFmpeg进行视频处理和字幕嵌入
- 横屏转竖屏时调整视频布局并添加标题
- 根据不同操作系统选择适合的字体


```go
// embedSubtitles 处理字幕嵌入到视频的主函数
// 根据指定的类型（横屏、竖屏或两者都有）将字幕嵌入到视频中
// ctx: 上下文信息
// stepParam: 字幕任务参数，包含输入视频路径、字幕文件路径等信息
func (s Service) embedSubtitles(ctx context.Context, stepParam *types.SubtitleTaskStepParam) error {
	// 用于记录处理过程中的错误
	var err error
	// 根据指定的嵌入类型进行处理（横屏、竖屏或全部）
	if stepParam.EmbedSubtitleVideoType == "horizontal" || stepParam.EmbedSubtitleVideoType == "vertical" || stepParam.EmbedSubtitleVideoType == "all" {
		// 获取输入视频的分辨率信息
		var width, height int
		width, height, err = getResolution(stepParam.InputVideoPath)
		// 横屏可以合成竖屏的，但竖屏暂时不支持合成横屏的
		if stepParam.EmbedSubtitleVideoType == "horizontal" || stepParam.EmbedSubtitleVideoType == "all" {
			// 检查输入视频是否为横屏（宽>高）
			if width < height {
				log.GetLogger().Info("检测到输入视频是竖屏，无法合成横屏视频，跳过")
				return nil
			}
			log.GetLogger().Info("合成字幕嵌入视频：横屏")
			// 调用embedSubtitles函数处理横屏视频（参数true表示横屏模式）
			err = embedSubtitles(stepParam, true)
			if err != nil {
				return fmt.Errorf("embedSubtitles embedSubtitles error: %w", err)
			}
		}
		if stepParam.EmbedSubtitleVideoType == "vertical" || stepParam.EmbedSubtitleVideoType == "all" {
			if width > height {
				// 如果原视频是横屏，需要先转换为竖屏视频
				// 定义转换后的竖屏视频存储路径
				transferredVerticalVideoPath := filepath.Join(stepParam.TaskBasePath, types.SubtitleTaskTransferredVerticalVideoFileName)
				// 调用convertToVertical函数将横屏视频转换为竖屏格式
				// 该函数会处理视频的布局调整，并添加主标题和副标题
				err = convertToVertical(stepParam.InputVideoPath, transferredVerticalVideoPath, stepParam.VerticalVideoMajorTitle, stepParam.VerticalVideoMinorTitle)
				if err != nil {
					return fmt.Errorf("embedSubtitles convertToVertical error: %w", err)
				}
				// 更新输入视频路径为转换后的竖屏视频
				stepParam.InputVideoPath = transferredVerticalVideoPath
			}
			log.GetLogger().Info("合成字幕嵌入视频：竖屏")
			// 调用embedSubtitles函数处理竖屏视频（参数false表示竖屏模式）
			err = embedSubtitles(stepParam, false)
			if err != nil {
				return fmt.Errorf("embedSubtitles embedSubtitles error: %w", err)
			}
		}
		log.GetLogger().Info("字幕嵌入视频成功")
		return nil
	}
	// 如果不是以上三种模式，则不进行字幕嵌入处理
	return nil
}
```

### 获取视频分辨率

- 利用 FFprobe 工具解析视频文件，提取宽度和高度信息

```go
// getResolution 获取视频的分辨率
// 使用FFprobe工具解析视频文件，提取宽度和高度信息
// 返回视频的宽度、高度和可能的错误
func getResolution(inputVideo string) (int, int, error) {
	// 获取视频信息
	cmdArgs := []string{
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=width,height",
		"-of", "csv=s=x:p=0",
		inputVideo,
	}
	cmd := exec.Command(storage.FfprobePath, cmdArgs...)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	if err := cmd.Run(); err != nil {
		return 0, 0, err
	}

	output := strings.TrimSpace(out.String())
	dimensions := strings.Split(output, "x")
	if len(dimensions) != 2 {
		return 0, 0, fmt.Errorf("invalid resolution format: %s", output)
	}

	width, _ := strconv.Atoi(dimensions[0])
	height, _ := strconv.Atoi(dimensions[1])
	return width, height, nil
}
```


###  将字幕嵌入到视频的主要流程

- 处理SRT字幕文件转换为ASS格式，并使用 FFmpeg 将字幕嵌入到视频中
- 根据横竖屏模式不同，生成不同的输出文件名和使用不同的字幕样式

```go
// embedSubtitles 将字幕嵌入到视频中的核心函数
//
// 参数:
//   - stepParam: 字幕任务参数，包含输入视频路径、字幕文件路径等信息
//   - isHorizontal: 是否为横屏模式，决定生成文件名和字幕样式
//
// 处理流程:
//  1. 根据是否横屏确定输出文件名（横屏或竖屏）
//  2. 调用srtToAss函数将SRT字幕转换为ASS字幕
//  3. 使用FFmpeg将ASS字幕嵌入视频，保留原始音频
//  4. 输出处理后的视频文件到指定路径
//
// 注意:
//   - 使用'-vf ass'参数让FFmpeg直接支持ASS字幕
//   - 路径中的反斜杠需要替换为正斜杠，以兼容不同操作系统
func embedSubtitles(stepParam *types.SubtitleTaskStepParam, isHorizontal bool) error {
	outputFileName := types.SubtitleTaskVerticalEmbedVideoFileName
	if isHorizontal {
		outputFileName = types.SubtitleTaskHorizontalEmbedVideoFileName
	}
	assPath := filepath.Join(stepParam.TaskBasePath, "formatted_subtitles.ass")

	if err := srtToAss(stepParam.BilingualSrtFilePath, assPath, isHorizontal, stepParam); err != nil {
		return fmt.Errorf("embedSubtitles srtToAss error: %w", err)
	}

	cmd := exec.Command(storage.FfmpegPath, "-y", "-i", stepParam.InputVideoPath, "-vf", fmt.Sprintf("ass=%s", strings.ReplaceAll(assPath, "\\", "/")), "-c:a", "aac", "-b:a", "192k", filepath.Join(stepParam.TaskBasePath, fmt.Sprintf("/output/%s", outputFileName)))
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("embedSubtitles embed subtitle into video ffmpeg error: %w", err)
	}
	return nil
}
```

#### ASS 字幕

ASS (Advanced SubStation Alpha) 字幕是一种高级字幕格式，与 SRT (SubRip Text) 相比具有以下优势：

1. **更丰富的样式控制**：
   - ASS 支持自定义字体、大小、颜色、描边、阴影等样式
   - 可以精确控制字幕的位置和显示区域
   - 支持动画效果和渐变

2. **布局灵活性**：
   - 可以同时在屏幕不同位置显示多行字幕
   - 适合处理双语字幕的上下布局
   - 可以调整字幕相对于视频的位置（顶部、底部、居中等）

3. **与 FFmpeg 良好兼容**：
   - FFmpeg 通过 `-vf ass` 参数可以直接渲染 ASS 字幕
   - 渲染质量更高，效果更好

4. **字幕特效支持**：
   - 支持卡拉OK效果
   - 支持文字动画和转场效果
   - 可以添加样式模板

在代码中，转换流程是：

1. 首先将原始的 SRT 格式字幕（通常只包含文本和时间信息）转换为 ASS 格式
2. 在转换过程中，可以根据横屏或竖屏模式应用不同的样式模板（types.AssHeaderHorizontal 或 types.AssHeaderVertical）
3. 对于横屏，将主要文本和次要文本分别格式化
4. 对于竖屏，会对长文本进行特殊处理，如中文按字符数分割
5. 最后使用 FFmpeg 通过 `-vf ass` 参数将字幕永久嵌入到视频中

这种转换是必要的，因为 SRT 格式过于简单，无法满足复杂的字幕布局需求，特别是在处理双语字幕和适应不同屏幕方向时，ASS 格式提供了更好的控制能力。


#### SRT转换ASS的处理

- 项目中支持了横屏和竖屏模式下的转换处理，这里按横屏的代码来举例说明

```go

// srtToAss 将SRT格式的字幕文件转换为ASS格式
// ASS格式支持更丰富的样式和位置控制，便于嵌入到视频中
// 参数:
//   - inputSRT: 输入的SRT格式字幕文件路径
//   - outputASS: 输出的ASS格式字幕文件路径
//   - isHorizontal: 是否为横屏模式，影响字幕的布局和样式
//   - stepParam: 包含字幕处理的相关参数
//
// 横屏模式下:
//   - 使用专门的横屏ASS模板
//   - 主要文本会根据语言特性进行智能分割
//   - 设置双语字幕，上方为主要语言，下方为次要语言
//
// 竖屏模式下:
//   - 使用专门的竖屏ASS模板
//   - 中文字幕会进行按字符数分割处理，确保每行不超过限定字符数
//   - 英文字幕保持原样显示
//   - 根据字幕内容计算时间比例，确保长字幕有足够的显示时间
func srtToAss(inputSRT, outputASS string, isHorizontal bool, stepParam *types.SubtitleTaskStepParam) error {
	// 打开SRT文件进行读取
	file, err := os.Open(inputSRT)
	if err != nil {
		return fmt.Errorf("srtToAss Open input srt error: %w", err)
	}
	defer file.Close()

	// 创建ASS文件准备写入
	assFile, err := os.Create(outputASS)
	if err != nil {
		return fmt.Errorf("srtToAss Create output ass error: %w", err)
	}
	defer assFile.Close()
	scanner := bufio.NewScanner(file)

	// 横屏模式处理逻辑
	if isHorizontal {
		// 写入横屏ASS头部模板，包含样式定义、字体设置等
		_, _ = assFile.WriteString(types.AssHeaderHorizontal)

		// 逐行扫描SRT文件
		for scanner.Scan() {
			line := scanner.Text()
			if line == "" {
				continue // 跳过空行
			}

			// 读取时间戳行（如：00:01:23,456 --> 00:01:25,789）
			if !scanner.Scan() {
				break // 文件结束
			}
			timestampLine := scanner.Text()
			parts := strings.Split(timestampLine, " --> ")
			if len(parts) != 2 {
				continue // 无效时间戳格式，跳过此字幕块
			}

			// 解析起始和结束时间
			startTimeStr := strings.TrimSpace(parts[0])
			endTimeStr := strings.TrimSpace(parts[1])
			startTime, err := parseSrtTime(startTimeStr)
			if err != nil {
				return fmt.Errorf("srtToAss parseSrtTime error: %w", err)
			}
			endTime, err := parseSrtTime(endTimeStr)
			if err != nil {
				return fmt.Errorf("srtToAss parseSrtTime error: %w", err)
			}

			// 读取字幕文本内容（可能有多行）
			var subtitleLines []string
			for scanner.Scan() {
				textLine := scanner.Text()
				if textLine == "" {
					break // 空行表示当前字幕块结束
				}
				subtitleLines = append(subtitleLines, textLine)
			}

			// 确保至少有两行文本（双语字幕需要）
			if len(subtitleLines) < 2 {
				continue // 如果不足两行，跳过此字幕
			}

			// 根据字幕类型确定主要语言
			var majorTextLanguage types.StandardLanguageName
			if stepParam.SubtitleResultType == types.SubtitleResultTypeBilingualTranslationOnTop {
				// 若翻译在上方模式，则目标语言为主要语言
				majorTextLanguage = stepParam.TargetLanguage
			} else {
				// 否则原始语言为主要语言
				majorTextLanguage = stepParam.OriginLanguage
			}

			// 处理主要文本行：根据语言特性分割文本，并用\N连接（ASS中的换行符）
			// 同时在分段之间添加空格以美化显示
			majorLine := strings.Join(splitMajorTextInHorizontal(subtitleLines[0], majorTextLanguage, stepParam.MaxWordOneLine), "      \\N")
			// 处理次要文本行：清理标点符号
			minorLine := util.CleanPunction(subtitleLines[1])

			// 格式化时间戳为ASS格式
			startFormatted := formatTimestamp(startTime)
			endFormatted := formatTimestamp(endTime)

			// 构建ASS对话行
			// \an2表示居中对齐，\rMajor和\rMinor引用预定义的样式
			combinedText := fmt.Sprintf("{\\an2}{\\rMajor}%s\\N{\\rMinor}%s", majorLine, minorLine)
			// 写入ASS文件，格式为：Dialogue: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
			_, _ = assFile.WriteString(fmt.Sprintf("Dialogue: 0,%s,%s,Major,,0,0,0,,%s\n", startFormatted, endFormatted, combinedText))
		}
	} else {
		// 竖屏模式处理逻辑......
	}
	return nil
}
```


### 将横屏视频转换为竖屏格式


- 横屏视频转换为竖屏格式，适合在移动设备上播放
- 调整视频尺寸，添加黑色边框，并在上方添加主标题和副标题

```go
// convertToVertical 将横屏视频转换为竖屏格式
// 参数:
//   - inputVideo: 输入视频路径
//   - outputVideo: 输出视频路径
//   - majorTitle: 主标题文本
//   - minorTitle: 副标题文本
//
// 处理流程:
//  1. 检查输出视频是否已存在，存在则跳过处理
//  2. 根据当前操作系统获取适合的字体路径
//  3. 使用FFmpeg进行以下处理:
//     - 将视频缩放至720x1280，保持原始宽高比
//     - 在视频顶部添加黑色区域用于放置标题
//     - 在顶部绘制主标题（使用粗体字体）和副标题（使用常规字体）
//     - 设置视频比特率、帧率等参数
//  4. 输出处理后的竖屏视频
//
// 视频处理参数说明:
//   - scale=720:1280:force_original_aspect_ratio=decrease: 缩放视频同时保持原始比例
//   - pad=720:1280:(ow-iw)/2:(oh-ih)*2/5: 对视频进行填充，确保视频在竖屏中居中显示
//   - drawbox: 绘制黑色背景区域用于放置标题
//   - drawtext: 绘制标题文本，设置位置、字体大小、颜色等
func convertToVertical(inputVideo, outputVideo, majorTitle, minorTitle string) error {
	if _, err := os.Stat(outputVideo); err == nil {
		log.GetLogger().Info("竖屏视频已存在", zap.String("outputVideo", outputVideo))
		return nil
	}

	fontBold, fontRegular, err := getFontPaths()
	if err != nil {
		log.GetLogger().Error("获取字体路径失败", zap.Error(err))
		return err
	}

	cmdArgs := []string{
		"-i", inputVideo,
		"-vf", fmt.Sprintf("scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)*2/5,drawbox=y=0:h=100:c=black@1:t=fill,drawtext=text='%s':x=(w-text_w)/2:y=210:fontsize=55:fontcolor=yellow:box=1:boxcolor=black@0.5:fontfile='%s',drawtext=text='%s':x=(w-text_w)/2:y=280:fontsize=40:fontcolor=yellow:box=1:boxcolor=black@0.5:fontfile='%s'",
			majorTitle, fontBold, minorTitle, fontRegular),
		"-r", "30",
		"-b:v", "7587k",
		"-c:a", "aac",
		"-b:a", "192k",
		"-c:v", "libx264",
		"-preset", "fast",
		"-y",
		outputVideo,
	}
	cmd := exec.Command(storage.FfmpegPath, cmdArgs...)
	var output []byte
	output, err = cmd.CombinedOutput()
	if err != nil {
		log.GetLogger().Error("视频转竖屏失败", zap.String("output", string(output)), zap.Error(err))
		return err
	}

	fmt.Printf("竖屏视频已保存到: %s\n", outputVideo)
	return nil
}
```

## 14. 字幕上传的核心处理

- 字幕文件的上传实际上就是与本服务中的静态文件接口，下载链接的格式是 /api/file/ + 文件路径
- 这种设计允许服务控制文件访问权限，可以防止直接访问服务器文件系统


```go

// uploadSubtitles 处理字幕上传的核心函数
// 该函数负责：
// 1. 处理字幕文件的替换操作（如果需要）
// 2. 生成字幕下载链接
// 3. 更新字幕任务状态
// 4. 处理配音文件的下载链接
//
// 参数：
//   - ctx: 上下文信息
//   - stepParam: 字幕任务步骤参数，包含任务ID、字幕信息、替换词映射等
//
// 返回：
//   - error: 处理过程中的错误信息
func (s Service) uploadSubtitles(ctx context.Context, stepParam *types.SubtitleTaskStepParam) error {
	// 初始化字幕信息切片
	subtitleInfos := make([]types.SubtitleInfo, 0)
	var err error

	// 遍历所有字幕信息进行处理
	for _, info := range stepParam.SubtitleInfos {
		resultPath := info.Path
		// 检查是否需要替换字幕内容
		if len(stepParam.ReplaceWordsMap) > 0 {
			// 生成替换后的文件路径
			replacedSrcFile := util.AddSuffixToFileName(resultPath, "_replaced")
			// 执行文件内容替换
			err = util.ReplaceFileContent(resultPath, replacedSrcFile, stepParam.ReplaceWordsMap)
			if err != nil {
				return fmt.Errorf("uploadSubtitles ReplaceFileContent err: %w", err)
			}
			// 更新结果文件路径为替换后的文件
			resultPath = replacedSrcFile
		}

		// 构建字幕信息并添加到结果列表
		subtitleInfos = append(subtitleInfos, types.SubtitleInfo{
			TaskId:      stepParam.TaskId,
			Name:        info.Name,
			DownloadUrl: "/api/file/" + resultPath,
		})
	}

	// 更新字幕任务状态信息
	storage.SubtitleTasks[stepParam.TaskId].SubtitleInfos = subtitleInfos
	storage.SubtitleTasks[stepParam.TaskId].Status = types.SubtitleTaskStatusSuccess
	storage.SubtitleTasks[stepParam.TaskId].ProcessPct = 100

	// 如果存在配音文件，更新配音文件的下载链接
	if stepParam.TtsResultFilePath != "" {
		storage.SubtitleTasks[stepParam.TaskId].SpeechDownloadUrl = "/api/file/" + stepParam.TtsResultFilePath
	}
	return nil
}
```
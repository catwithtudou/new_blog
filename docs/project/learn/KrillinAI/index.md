# KrillinAI

> https://github.com/catwithtudou/KrillinAI

## 代码逻辑注释

- 注释 repo 分支：[learn/add_code_details](https://github.com/catwithtudou/KrillinAI/tree/learn/add_code_details)


## 可参考的地方


### 1. 日志处理


### 2. 加载配置处理


### 3. 检查并准备运行环境依赖


#### 检查依赖的应用和模型


#### 下载（进度条）和解压依赖应用


### 4. 项目层级架构依赖


目前项目主要的层级架构如下：

```text
项目结构
├── internal/           # 内部核心代码
│   ├── handler/       # HTTP 处理层
│   ├── service/       # 业务逻辑层
│   ├── storage/       # 数据存储层
│   ├── router/        # 路由层
│   ├── deps/         # 依赖注入
│   ├── types/        # 内部类型定义
│   ├── dto/          # 数据传输对象
│   └── response/     # 响应封装
├── pkg/               # 可重用的包
│   ├── util/         # 通用工具
│   ├── whisper/      # Whisper相关
│   ├── openai/       # OpenAI集成
│   └── aliyun/       # 阿里云集成
├── config/           # 配置文件
└── static/           # 静态资源
```

依赖关系从上到下为：

```text
Handler Layer → Service Layer → Storage Layer
    ↓
Router Layer (用于组织 Handler)
    ↓
Types/DTO (贯穿所有层的数据结构定义)
```

### 5. 静态文件服务处理

使用 Gin 框架自带的静态文件路由处理：

```go
// SetupRouter 配置并初始化Gin路由引擎
// 该函数负责设置所有的HTTP路由规则，包括API接口和静态文件服务
func SetupRouter(r *gin.Engine) {
	// 根路径重定向到静态文件目录
	// 当访问根路径/时，自动重定向到/static目录
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/static")
	})

	// 设置静态文件服务
	// 使用embed包嵌入的静态文件，提供前端界面访问
	// 所有/static/*的请求都会从嵌入的文件系统中获取对应的静态资源
	r.StaticFS("/static", http.FS(static.EmbeddedFiles))
}
```


### 6. 提取Bilibili和YouTube的视频标识

### 7. 生成指定长度的随机字符串

提前指定好对应的字符集合，然后遍历过程中进行选择：

```go
// strWithUpperLowerNum 定义了一个包含所有可能字符的切片
// 包含：
// - 小写字母 (a-z)
// - 大写字母 (A-Z)
// - 数字 (0-9)
// 使用rune类型存储，以支持Unicode字符
var strWithUpperLowerNum = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789")

// GenerateRandStringWithUpperLowerNum 生成指定长度的随机字符串
// 参数：
//   - n: 需要生成的字符串长度
//
// 返回值：
//   - string: 生成的随机字符串
//
// 使用示例：
//   - 生成8位随机字符串：GenerateRandStringWithUpperLowerNum(8)
//   - 生成16位随机字符串：GenerateRandStringWithUpperLowerNum(16)
//
// 实现原理：
// 1. 创建一个长度为n的rune切片
// 2. 对每个位置，从strWithUpperLowerNum中随机选择一个字符
// 3. 将rune切片转换为字符串
func GenerateRandStringWithUpperLowerNum(n int) string {
	// 创建一个长度为n的rune切片，用于存储随机字符
	b := make([]rune, n)

	// 遍历切片的每个位置
	for i := range b {
		// 从strWithUpperLowerNum中随机选择一个字符
		// rand.Intn(len(strWithUpperLowerNum))生成[0, len-1]范围内的随机数
		b[i] = strWithUpperLowerNum[rand.Intn(len(strWithUpperLowerNum))]
	}

	// 将rune切片转换为字符串并返回
	return string(b)
}
```

### 8. 上传声音克隆源（阿里 OSS）

项目中使用的是阿里的 OSS 存储服务，包含了对阿里客户端使用的封装：

```go
// Package aliyun 提供阿里云相关服务的客户端实现
package aliyun

import (
	"context"
	"fmt"
	"os"

	"github.com/aliyun/alibabacloud-oss-go-sdk-v2/oss"
	"github.com/aliyun/alibabacloud-oss-go-sdk-v2/oss/credentials"
)

// OssClient 封装了阿里云 OSS 客户端的基本操作
// 内嵌了 oss.Client 以复用其方法
type OssClient struct {
	*oss.Client
	Bucket string // 默认的存储桶名称
}

// NewOssClient 创建一个新的 OSS 客户端实例
// 参数:
//   - accessKeyID: 阿里云访问密钥 ID
//   - accessKeySecret: 阿里云访问密钥密码
//   - bucket: 默认的存储桶名称
//
// 返回:
//   - *OssClient: OSS 客户端实例
func NewOssClient(accessKeyID, accessKeySecret, bucket string) *OssClient {
	// 创建静态凭证提供器
	credProvider := credentials.NewStaticCredentialsProvider(accessKeyID, accessKeySecret)

	// 配置 OSS 客户端
	// 1. 加载默认配置
	// 2. 设置凭证提供器
	// 3. 设置区域为上海
	cfg := oss.LoadDefaultConfig().
		WithCredentialsProvider(credProvider).
		WithRegion("cn-shanghai")

	// 创建 OSS 客户端实例
	client := oss.NewClient(cfg)

	return &OssClient{client, bucket}
}

// UploadFile 上传文件到 OSS 存储桶
// 参数:
//   - ctx: 上下文，用于控制请求的生命周期
//   - objectKey: 对象键（文件在 OSS 中的路径）
//   - filePath: 要上传的本地文件路径
//   - bucket: 目标存储桶名称
//
// 返回:
//   - error: 如果上传过程中发生错误，返回相应的错误信息
func (o *OssClient) UploadFile(ctx context.Context, objectKey, filePath, bucket string) error {
	// 打开本地文件
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close() // 确保文件最终被关闭

	// 执行文件上传操作
	// PutObject 方法将文件内容上传到指定的存储桶和对象键位置
	_, err = o.PutObject(ctx, &oss.PutObjectRequest{
		Bucket: &bucket,
		Key:    &objectKey,
		Body:   file,
	})
	if err != nil {
		return fmt.Errorf("failed to upload file to OSS: %v", err)
	}

	return nil
}
```

### 9. 异步任务的设计


项目中针对字幕生成的任务分别设计了一个触发异步执行的接口和一个状态查询的接口，主要交互如下：

```text
[客户端] -> [接口层] -> [异步任务处理] -> [状态查询]
   |            |            |               |
   +--- 发起请求  |            |               |
   |            +--- 返回任务ID |               |
   |                          +--- 处理任务     |
   +------------------------------------------ 轮询状态
```

该设计的好处主要有两点：

1. 用户体验优化

- 避免了长时间的同步等待，提高了接口响应速度
- 通过任务状态查询机制，让用户能够实时了解处理进度
- 符合大文件处理的最佳实践，特别适合视频处理这类耗时操作

2. 系统资源管理

- 使用 goroutine 进行异步处理，充分利用了 Go 的并发特性
- 避免了长连接占用，减少服务器资源消耗
- 可以更好地控制系统负载，便于实现限流和任务队列


### 10. 使用 ffmpeg+yt-dlp 提取音频文件处理

> [FFmpeg](https://github.com/FFmpeg/FFmpeg)
>
> 一个功能强大的跨平台开源多媒体框架，用于处理音频、视频和其他多媒体文件。它包含一系列命令行工具和库，主要功能包括：
>
> - 音视频转码和格式转换
> - 音视频流的剪切、合并、分离和混合
> - 调整音视频参数（如分辨率、比特率、采样率等）
> - 添加滤镜效果和字幕
>
> 在音频提取方面，FFmpeg 可以轻松从视频文件中分离音频轨道，并转换为多种音频格式（如MP3、AAC、WAV、FLAC等）。
>
> [yt-dlp](https://github.com/yt-dlp/yt-dlp)
>
> youtube-dl 的增强分支，是一个用于从 YouTube 和其他数百个视频平台下载视频和音频的命令行工具。
>
> 相比原版，yt-dlp 有更快的下载速度和更多的功能。主要特点：
>
> - 支持从数百个网站下载音视频内容
> - 可以直接提取音频而不下载视频
> - 支持多种音频格式和质量选择
> - 可以下载整个播放列表、频道或特定用户的内容
> - 绕过各种网站限制和地理限制



- 项目中主要使用 ffmpeg 以及 yt-dlp 来分别处理本地文件和 YouTube/Bilibili 视频
- 处理过程中根据不同的视频类型来构造对应的命令行参数并执行
- 同时在提取时考虑了视频内容可能会有访问受限的情况，所以增加了添加 cookies 文件的方式

```go

// linkToFile 处理视频链接并提取音频文件
// 支持三种类型的输入：
// 1. 本地文件 (local:)
// 2. YouTube视频
// 3. Bilibili视频
//
// 参数：
//   - ctx: 上下文信息
//   - stepParam: 字幕任务步骤参数
//
// 返回值：
//   - error: 处理过程中的错误信息
func (s Service) linkToFile(ctx context.Context, stepParam *types.SubtitleTaskStepParam) error {
	var (
		err    error
		output []byte
	)
	// 初始化文件路径
	link := stepParam.Link
	audioPath := fmt.Sprintf("%s/%s", stepParam.TaskBasePath, types.SubtitleTaskAudioFileName)
	videoPath := fmt.Sprintf("%s/%s", stepParam.TaskBasePath, types.SubtitleTaskVideoFileName)
	// 更新任务进度为3%
	storage.SubtitleTasks[stepParam.TaskId].ProcessPct = 3

	// 1. 处理本地文件
	if strings.Contains(link, "local:") {
		// 移除local:前缀，获取实际文件路径
		videoPath = strings.ReplaceAll(link, "local:", "")
		stepParam.InputVideoPath = videoPath
		// 使用ffmpeg提取音频
		// 参数说明：
		// -i: 输入文件
		// -vn: 不处理视频
		// -ar 44100: 采样率44.1kHz
		// -ac 2: 双声道
		// -ab 192k: 音频比特率192kbps
		// -f mp3: 输出MP3格式
		cmd := exec.Command(storage.FfmpegPath, "-i", videoPath, "-vn", "-ar", "44100", "-ac", "2", "-ab", "192k", "-f", "mp3", audioPath)
		output, err = cmd.CombinedOutput()
		if err != nil {
			log.GetLogger().Error("generateAudioSubtitles.linkToFile ffmpeg error", zap.Any("step param", stepParam), zap.String("output", string(output)), zap.Error(err))
			return fmt.Errorf("generateAudioSubtitles.linkToFile ffmpeg error: %w", err)
		}
	} else if strings.Contains(link, "youtube.com") { // 2. 处理YouTube视频
		// 提取YouTube视频ID
		var videoId string
		videoId, err = util.GetYouTubeID(link)
		if err != nil {
			log.GetLogger().Error("linkToFile.GetYouTubeID error", zap.Any("step param", stepParam), zap.Error(err))
			return fmt.Errorf("linkToFile.GetYouTubeID error: %w", err)
		}
		// 构造标准YouTube链接
		stepParam.Link = "https://www.youtube.com/watch?v=" + videoId
		// 使用yt-dlp下载音频
		// 参数说明：
		// -f bestaudio: 选择最佳音频质量
		// --extract-audio: 提取音频
		// --audio-format mp3: 转换为MP3格式
		// --audio-quality 192K: 设置音频质量
		cmdArgs := []string{"-f", "bestaudio", "--extract-audio", "--audio-format", "mp3", "--audio-quality", "192K", "-o", audioPath, stepParam.Link}
		// 添加代理设置（如果配置了）
		if config.Conf.App.Proxy != "" {
			cmdArgs = append(cmdArgs, "--proxy", config.Conf.App.Proxy)
		}
		// 添加cookies文件（用于访问受限内容）
		cmdArgs = append(cmdArgs, "--cookies", "./cookies.txt")
		// 指定ffmpeg路径（如果不是系统默认路径）
		if storage.FfmpegPath != "ffmpeg" {
			cmdArgs = append(cmdArgs, "--ffmpeg-location", storage.FfmpegPath)
		}
		cmd := exec.Command(storage.YtdlpPath, cmdArgs...)
		output, err = cmd.CombinedOutput()
		if err != nil {
			log.GetLogger().Error("linkToFile download audio yt-dlp error", zap.Any("step param", stepParam), zap.String("output", string(output)), zap.Error(err))
			return fmt.Errorf("linkToFile download audio yt-dlp error: %w", err)
		}
	} else if strings.Contains(link, "bilibili.com") { // 3. 处理Bilibili视频
		// 提取Bilibili视频ID
		videoId := util.GetBilibiliVideoId(link)
		if videoId == "" {
			return errors.New("linkToFile error: invalid link")
		}
		// 构造标准Bilibili链接
		stepParam.Link = "https://www.bilibili.com/video/" + videoId
		// 使用yt-dlp下载音频
		// 参数说明：
		// -f bestaudio[ext=m4a]: 选择最佳m4a格式音频
		// -x: 提取音频
		// --audio-format mp3: 转换为MP3格式
		cmdArgs := []string{"-f", "bestaudio[ext=m4a]", "-x", "--audio-format", "mp3", "-o", audioPath, stepParam.Link}
		// 添加代理设置（如果配置了）
		if config.Conf.App.Proxy != "" {
			cmdArgs = append(cmdArgs, "--proxy", config.Conf.App.Proxy)
		}
		// 指定ffmpeg路径（如果不是系统默认路径）
		if storage.FfmpegPath != "ffmpeg" {
			cmdArgs = append(cmdArgs, "--ffmpeg-location", storage.FfmpegPath)
		}
		cmd := exec.Command(storage.YtdlpPath, cmdArgs...)
		output, err = cmd.CombinedOutput()
		if err != nil {
			log.GetLogger().Error("linkToFile download audio yt-dlp error", zap.Any("step param", stepParam), zap.String("output", string(output)), zap.Error(err))
			return fmt.Errorf("linkToFile download audio yt-dlp error: %w", err)
		}
	} else {
		// 不支持的视频源
		log.GetLogger().Info("linkToFile.unsupported link type", zap.Any("step param", stepParam))
		return errors.New("linkToFile error: unsupported link, only support youtube, bilibili and local file")
	}

	// 更新任务进度为6%
	storage.SubtitleTasks[stepParam.TaskId].ProcessPct = 6
	// 保存音频文件路径
	stepParam.AudioFilePath = audioPath

	// 如果需要下载原视频（非本地文件且需要嵌入字幕）
	if !strings.HasPrefix(link, "local:") && stepParam.EmbedSubtitleVideoType != "none" {
		// 使用yt-dlp下载视频
		// 参数说明：
		// -f bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/...: 选择最佳视频质量（按分辨率优先级）
		cmdArgs := []string{"-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]", "-o", videoPath, stepParam.Link}
		// 添加代理设置（如果配置了）
		if config.Conf.App.Proxy != "" {
			cmdArgs = append(cmdArgs, "--proxy", config.Conf.App.Proxy)
		}
		cmd := exec.Command(storage.YtdlpPath, cmdArgs...)
		output, err = cmd.CombinedOutput()
		if err != nil {
			log.GetLogger().Error("linkToFile download video yt-dlp error", zap.Any("step param", stepParam), zap.String("output", string(output)), zap.Error(err))
			return fmt.Errorf("linkToFile download video yt-dlp error: %w", err)
		}
		// 保存视频文件路径
		stepParam.InputVideoPath = videoPath
	}

	// 更新任务进度为10%
	storage.SubtitleTasks[stepParam.TaskId].ProcessPct = 10
	return nil
}
```


### 11. 音频转字幕的核心处理

核心逻辑在 `audio2subtitle.go`，主要实现了将音频文件转换为多语言字幕的功能，包括多个关键步骤。

#### 音频分割

- 将长音频分割成小段以便处理，方便后续进行并行处理

```go

// splitAudio 将长音频文件分割成多个小段
// 使用 ffmpeg 进行音频分割，便于后续并行处理
// @param ctx 上下文信息
// @param stepParam 字幕任务的参数信息
// @return error 处理过程中的错误信息
func (s Service) splitAudio(ctx context.Context, stepParam *types.SubtitleTaskStepParam) error {
	// .....
	// 使用ffmpeg分割音频
	outputPattern := filepath.Join(stepParam.TaskBasePath, types.SubtitleTaskSplitAudioFileNamePattern) // 输出文件格式
	segmentDuration := config.Conf.App.SegmentDuration * 60                                             // 计算分段时长，转换为秒

	// 构建并执行 ffmpeg 命令进行音频分割
	cmd := exec.Command(
		storage.FfmpegPath,
		"-i", stepParam.AudioFilePath, // 输入文件路径
		"-f", "segment", // 指定输出格式为分段
		"-segment_time", fmt.Sprintf("%d", segmentDuration), // 设置每段时长（秒）
		"-reset_timestamps", "1", // 重置每段的时间戳为0
		"-y",          // 自动覆盖已存在的输出文件
		outputPattern, // 输出文件名模式
	)
	err = cmd.Run()
	if err != nil {
		return fmt.Errorf("audioToSubtitle splitAudio ffmpeg err: %w", err)
	}

	// 获取分割后的文件列表，使用通配符匹配所有生成的音频文件
	audioFiles, err := filepath.Glob(filepath.Join(stepParam.TaskBasePath, fmt.Sprintf("%s_*.mp3", types.SubtitleTaskSplitAudioFileNamePrefix)))
	if err != nil {
		return fmt.Errorf("audioToSubtitle splitAudio filepath.Glob err: %w", err)
	}

	//....
}
```


#### 语音识别

- 将音频转换为文本，对每个音频片段进行并行处理，通过信号量模式控制并发数量等处理

```go

    // ....

	// 创建可取消的上下文和错误组，用于管理并行任务
	ctx, cancel = context.WithCancel(ctx)
	defer cancel()
	eg, ctx = errgroup.WithContext(ctx)

	// 对每个音频片段进行并行处理
	for _, audioFileItem := range stepParam.SmallAudios {
		parallelControlChan <- struct{}{} // 信号量模式控制并发数量
		audioFile := audioFileItem
		eg.Go(func() error {
			// 确保资源释放和异常处理
			defer func() {
				<-parallelControlChan // 释放并发控制槽
				if r := recover(); r != nil {
					// ....
				}
			}()
			// 检查上下文是否已取消
			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
			}

			// 执行语音识别，最多重试3次
			var transcriptionData *types.TranscriptionData
			for i := 0; i < 3; i++ {
				language := string(stepParam.OriginLanguage)
				if language == "zh_cn" {
					language = "zh" // 中文简体标识转换
				}
				transcriptionData, err = s.Transcriber.Transcription(audioFile.AudioFile, language, stepParam.TaskBasePath)
				if err == nil {
					break
				}
			}
			if err != nil {
				cancel() // 出错时取消所有并行任务
				return fmt.Errorf("audioToSubtitle audioToSrt Transcription err: %w", err)
			}

            // ....

			// 更新任务进度信息（多个步骤中的第一步）
			stepNumMu.Lock()
			stepNum++
			processPct := uint8(20 + 70*stepNum/(len(stepParam.SmallAudios)*2)) // 进度从20%到90%，分两个主要步骤
			stepNumMu.Unlock()
			storage.SubtitleTasks[stepParam.TaskId].ProcessPct = processPct

			// 文本分割和翻译处理
            // ....

		})
	}

	// 等待所有并行任务完成
	if err = eg.Wait(); err != nil {
		log.GetLogger().Error("audioToSubtitle audioToSrt eg.Wait err", zap.Any("taskId", stepParam.TaskId), zap.Error(err))
		return fmt.Errorf("audioToSubtitle audioToSrt eg.Wait err: %w", err)
	}

    // ....
```



- 设计通用接口，内部集成了多个语音识别的客户端，比如 openapi、aliyun、fasterwhisper、whisperkit 等

```go

type Transcriber interface {
	Transcription(audioFile, language, wordDir string) (*TranscriptionData, error)
}
```

- 以 openapi 的实现处理来举例

```go
// Package openai 提供了 OpenAI API 的客户端封装
// 用于访问 OpenAI 的大语言模型服务，支持聊天补全等功能
// 支持自定义基础 URL、API 密钥和代理设置
package openai

import (
    // ....
	openai "github.com/sashabaranov/go-openai"
)

// Client 是 OpenAI API 的客户端封装
// 使用官方的 go-openai 库实现，提供对 OpenAI API 的访问
type Client struct {
	client *openai.Client // OpenAI 官方库的客户端实例
}

// NewClient 创建并初始化 OpenAI 客户端
// @param baseUrl OpenAI API 的基础 URL，为空时使用默认值
// @param apiKey OpenAI API 的访问密钥
// @param proxyAddr 代理服务器地址，为空时不使用代理
// @return *Client 初始化后的 OpenAI 客户端
func NewClient(baseUrl, apiKey, proxyAddr string) *Client {
	// 创建默认配置，设置 API 密钥
	cfg := openai.DefaultConfig(apiKey)
	if baseUrl != "" {
		// 如果提供了自定义 URL，则使用自定义 URL
		cfg.BaseURL = baseUrl
	}

	if proxyAddr != "" {
		// 如果提供了代理地址，则设置代理
		transport := &http.Transport{
			Proxy: http.ProxyURL(config.Conf.App.ParsedProxy),
		}
		cfg.HTTPClient = &http.Client{
			Transport: transport,
		}
	}

	// 使用配置创建 OpenAI 客户端
	client := openai.NewClientWithConfig(cfg)
	return &Client{client: client}
}


// ChatCompletion 使用 OpenAI 的聊天模型生成回复
// 使用流式API接收响应，适用于字幕翻译等需要较长输出的场景
// @param query 用户的查询内容或需要处理的文本
// @return string 模型生成的回复内容
// @return error 处理过程中的错误，如果有的话
func (c *Client) ChatCompletion(query string) (string, error) {
	// 构建聊天补全请求
	req := openai.ChatCompletionRequest{
		Model: openai.GPT4oMini20240718, // 默认使用 GPT-4o-mini 模型
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem, // 系统提示，定义AI助手的行为
				Content: "You are an assistant that helps with subtitle translation.",
			},
			{
				Role:    openai.ChatMessageRoleUser, // 用户消息
				Content: query,
			},
		},
		Stream:    true, // 启用流式响应，获取实时输出
		MaxTokens: 8192, // 最大输出标记数
	}

	// 如果配置中指定了模型，则使用配置中的模型
	if config.Conf.Openai.Model != "" {
		req.Model = config.Conf.Openai.Model
	}

	// 创建流式聊天补全请求
	stream, err := c.client.CreateChatCompletionStream(context.Background(), req)
	if err != nil {
		log.GetLogger().Error("openai create chat completion stream failed", zap.Error(err))
		return "", err
	}
	defer stream.Close() // 确保流在函数返回时关闭

	// 接收流式响应并拼接结果
	var resContent string
	for {
		// 从流中接收响应片段
		response, err := stream.Recv()
		if err == io.EOF {
			// 流结束
			break
		}
		if err != nil {
			// 接收中出现错误
			log.GetLogger().Error("openai stream receive failed", zap.Error(err))
			return "", err
		}

		// 累加响应内容
		resContent += response.Choices[0].Delta.Content
	}

	return resContent, nil
}


```








#### 文本翻译

- 将识别出的文本翻译成目标语言

#### 字幕生成

- 生成包含时间戳的字幕文件，支持双语字幕、单语字幕等多种格式

#### 字幕优化


- 支持自动分行、语气词过滤等优化功能










## 可优化的地方

### 1. storage.SubtitleTasks 全局 map 带来的并发安全问题

- 在 subtitle_service.go 实现中 storage.SubtitleTasks 变量是一个全局 map

- 该逻辑里面也有异步 goroutine 中修改全局 map 的处理，虽然每个任务有唯一的taskId，但是map的并发访问和修改是不安全的

- 项目中主流程和goroutine之间也确实可能会出现并发访问，虽然每个任务的处理是顺序的，但不同任务之间可能并发

- **可以考虑使用类似 sync.Map 的处理来进行避免**


### 2. 任务状态管理考虑持久化处理避免重启导致任务状态丢失

```go
storage.SubtitleTasks[taskId] = &types.SubtitleTask{
    TaskId:   taskId,
    VideoSrc: req.Url,
    Status:   types.SubtitleTaskStatusProcessing,
}
```

- 当前使用的是内存存储（map），建议改用 Redis 或数据库存储
- 需要考虑任务状态的持久化，避免服务重启导致任务状态丢失
- 可以添加任务过期清理机制

### 3. 多个任务的并发控制

- 建议添加任务队列，控制并发处理的任务数量
- 可以使用信号量或工作池模式限制同时处理的任务数

```go
// 建议添加类似这样的任务队列控制
type TaskQueue struct {
    semaphore chan struct{}
    tasks     chan *types.SubtitleTask
}

func NewTaskQueue(maxConcurrent int) *TaskQueue {
    return &TaskQueue{
        semaphore: make(chan struct{}, maxConcurrent),
        tasks:     make(chan *types.SubtitleTask, 100),
    }
}
```

### 4. 可考虑的架构演进

1. 消息队列改造

```go
// 使用消息队列解耦任务处理
type TaskProcessor struct {
    mqClient    mq.Client
    taskQueue   string
    resultQueue string
}

func (p *TaskProcessor) PublishTask(task *types.SubtitleTask) error {
    return p.mqClient.Publish(p.taskQueue, task)
}
```

2. 分布式任务处理

- 将任务处理服务独立部署
- 使用分布式任务调度系统（如 Asynq）
- 支持横向扩展的任务处理集群

3. WebSocket 实时进度

- 除了轮询接口外，可以提供 WebSocket 接口推送任务进度
- 减少客户端轮询压力

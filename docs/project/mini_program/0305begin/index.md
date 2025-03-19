
# 0305Begin

**[github repo:https://github.com/catwithtudou/0305begin](https://github.com/catwithtudou/0305begin)**

## 技术栈

- vue3
- **uni-app**（跨平台应用开发引擎）

## uni-app

> 官网:https://uniapp.dcloud.net.cn/
>
> github:https://github.com/dcloudio/uni-app

简介：

- uni-app 是一个使用 Vue.js 开发所有前端应用的框架，开发者编写一套代码，可发布到iOS、Android、Web（响应式）、以及各种小程序（微信/支付宝/百度/头条/飞书/QQ/快手/钉钉/淘宝）、快应用等多个平台
- DCloud公司拥有900万开发者、数百万应用、12亿手机端月活用户、数千款uni-app插件、70+微信/qq群。阿里小程序工具官方内置uni-app，腾讯课堂官方为uni-app录制培训课程，开发者可以放心选择
- uni-app在手，做啥都不愁。即使不跨端，uni-app也是更好的小程序开发框架、更好的App跨平台框架、更方便的H5开发框架。不管领导安排什么样的项目，你都可以快速交付，不需要转换开发思维、不需要更改开发习惯

### 工程项目解释

```shell
┌─uniCloud              云空间目录，支付宝小程序云为uniCloud-alipay，阿里云为uniCloud-aliyun，腾讯云为uniCloud-tcb（uniCloud）
│─components            符合vue组件规范的uni-app组件目录
│  └─comp-a.vue         可复用的a组件
├─utssdk                存放uts文件
├─pages                 业务页面文件存放的目录
│  ├─index
│  │  └─index.vue       index页面
│  └─list
│     └─list.vue        list页面
├─static                存放应用引用的本地静态资源（如图片、视频等）的目录，注意：静态资源都应存放于此目录
├─uni_modules           存放uni_module
├─platforms             存放各平台专用页面的目录，
├─nativeplugins         App原生语言插件
├─nativeResources       App端原生资源目录
│  ├─android            Android原生资源目录
|  └─ios                iOS原生资源目录
├─hybrid                App端存放本地html文件的目录，
├─wxcomponents          存放小程序组件的目录，
├─unpackage             非工程代码，一般存放运行或发行的编译结果
├─main.js               Vue初始化入口文件
├─App.vue               应用配置，用来配置App全局样式以及监听 应用生命周期
├─pages.json            配置页面路由、导航条、选项卡等页面类信息，
├─manifest.json         配置应用名称、appid、logo、版本等打包信息，
├─AndroidManifest.xml   Android原生应用清单文件
├─Info.plist            iOS原生应用配置文件
└─uni.scss              内置的常用样式变量
```

### 使用教程

主要参考[官方文档](https://uniapp.dcloud.net.cn/tutorial/)
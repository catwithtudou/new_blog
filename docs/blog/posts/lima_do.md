---
date: 2024-02-29
categories:
  - os
tags:
  - os
  - docker
---


# Mac搭建Docker+Ubuntu环境支持GDB

## 1. 背景

最近在准备通过 gdb 来调试 c 语言程序时，发现目前 gdb 是没有支持 mac m1 的，如下图：

<!-- more -->

![](https://img.zhengyua.cn/blog/202402282108182.png)

如果想要在 mac 本机来使用 gdb 的话，那只有采取类似虚拟机或容器等的思路，去运行其他系统类型去安装解决。 

之前也尝试过本机安装 docker desktop 去通过 docker 解决，但发现运行过程中老是出现异常和超时，基本不可用。

最后找到了 lima 来解决该问题，使用成本极低和兼容性好，能让 mac 很方便地本地运行其他系统。

这里记录了相关使用和通过 lima 搭建 docker+ubuntu 环境的过程，希望能帮助有类似困惑的同学。

## 2. Lima

### 2.1 介绍

> https://github.com/lima-vm/lima
> 
> Lima launches Linux virtual machines with automatic file sharing and port forwarding (similar to WSL2). 
> The original goal of Lima was to promote containerd including nerdctl (contaiNERD ctl) to Mac users, but Lima can be used for non-container applications as well.

简单来说就是一个里面运行着 containerd 的虚拟机，使用类似于 windows 上的 WSL2。

> 其中 containerd 简单来说就是与 docker 引擎所做的事情一样，同时也是 CNCF 毕业项目。
> 
> https://github.com/containerd/containerd
> 
> containerd is an industry-standard container runtime with an emphasis on simplicity, robustness, and portability. It is available as a daemon for Linux and Windows, which can manage the complete container lifecycle of its host system: image transfer and storage, container execution and supervision, low-level storage and network attachments, etc.

### 2.2 安装

在 mac 上安装十分简单:

```shell
$ brew install lima

$ lima -v
limactl version 0.20.1
```

安装好 lima 后，你就可以通过 lima 来做很多事情了。

目前 lima 官方提供了多个模版，如 archlinux、docker、podman、Kubernetes、ubuntu 等，基本满足所有搭建环境的需求，可通过下面指令查看：

```shell
$ limactl start --list-templates

almalinux-8
almalinux-9
almalinux
alpine
apptainer-rootful
apptainer
archlinux
.....

```

下面会重点描述下通过 lima 搭建 docker+ubuntu 的环境。

## 3. 搭建 docker+ubuntu 环境

### 3.1 安装 docker

这里我们创建一个目录来保存下 LimaVM 的配置文件：

```shell
$ mkdir lima_vm && cd lima_vm
```

我们这里下载使用官方提供的[配置模版库](https://github.com/lima-vm/lima/tree/master/examples)下的 [docker.yaml](https://github.com/lima-vm/lima/blob/master/examples/docker.yaml)，先查看其内容：

```shell
$ curl -o docker.yaml https://raw.githubusercontent.com/lima-vm/lima/master/examples/docker.yaml
$ cat docker.yaml
```

配置文件中每个配置项的都有详细的解释，有兴趣的同学可以自行查阅，这里我们就使用默认的配置文件就可以直接启动 lima VM：

> 若想要对虚拟机分配的 CPU、内存、挂载目录进行调整，配置文件中提供了对应的参数。

```shell
$ limactl start ./docker.yaml
```

![](https://img.zhengyua.cn/blog/202402282318785.png)


需要注意的是：

- 此命令通常是初始化的时候执行，后续创建成功后不用重复执行
- 上面文件只是初始启动的配置，启动后会自动生成下面路径的配置文件
    - 后续若需要修改配置，则需要编辑下面生成的配置文件，重启生效。

```shell
~/.lima/docker/lima.yaml
```

### 3.2 具体使用

```shell
# 查看目前运行列表，并包含其分配的名称、SSH、Status、CPU、Memory 等
$ limactl list
# 进入 shell
$ limactl shell docker
# 直接执行 shell 命令 docker ps
$ limactl shell docker docker ps
# 关闭 VM
$ limactl stop docker
# 刪除 VM
$ limactl delete docker
```

上面可看到我们在执行 docker 命令的时候，要么是要进入到终端具再操作，要么是要加上对应的`limactl shell docker`的前缀。

如果想做到像在本地一样直接执行 docker cli 的话，需要：


```shell
# 1. 本地安装 docker cli
$ brew install docker
# 2. 设置 docker 环境变量
# Name 即 lima 启动时命名的名称，如前面的 docker，即 lima-docker）
# Dir 即 lima 启动后自动生成的路径，如前面的 ~/.lima/docker/sock/docker.sock
$ docker context create lima-{{.Name}} --docker "host=unix://{{.Dir}}/sock/docker.sock"
$ docker context use lima-{{.Name}}
# 3. 像 docker cli 一样直接在本地终端执行 docker 命令
$ docker run hello-world
```

![](https://img.zhengyua.cn/blog/202402282335529.png)


### 3.3 新增 ubuntu 容器

目前 docker 镜像中已经有现成的镜像可以使用，下面安装的是 ubuntu 20.04 版本：

```shell
$ docker pull ubuntu:20.04
$ docker images 
```

![](https://img.zhengyua.cn/blog/202402282342158.png)

安装好镜像后，我们直接创建一个 ubuntu 的容器：

```shell
# 初始化容器
$ docker run --name ubuntu-container -it ubuntu:20.04 bash
```

此时你就已经能使用 ubuntu 的操作系统来完成需求勒。这里也贴一下可能会用到的常用操作：

```shell
# 查看当前所有的容器及其状态，比如前面运行的 ubuntu-container
$ docker ps -a 
# 若容器不是运行状态，则需要启动它
$ docker start ubuntu-container
# 进行该容器的终端
$ docker exec -it ubuntu-container bash
```
![](https://img.zhengyua.cn/blog/202402282354707.png)

### 3.4 安装 gdb

进入 ubuntu 容器后，就可以安装 gdb 来调试 c 语言程序了：

```shell
# 进入容器后更新软件包
$ apt update
# 安装 gdb
$ apt install gdb
```


## 参考

https://zhuanlan.zhihu.com/p/476240258

https://blog.crazyfirelee.tw/posts/sharing/lima/

https://github.com/lima-vm/lima/blob/master/examples/docker.yaml

https://stackoverflow.com/questions/67310123/how-to-install-gdb-on-mac-m1-apple-silicon

https://zhuanlan.zhihu.com/p/354794701
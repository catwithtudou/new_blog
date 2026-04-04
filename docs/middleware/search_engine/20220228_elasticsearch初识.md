# ElasticSearch初识

## ElasticSearch 简介


- 开源分布式搜索分析引擎
  - **近实时（Near Real Time）**
  - **分布式存储/搜索/分析引擎**

Elastic Search 起源是基于 Lucene 。Lucene 是基于 Java 开发的搜索引擎类库，具有高性能、易扩展的优点，它的局限性主要在于以下方面：

- 只能基于 Java 语言开发
- 类库的学习曲线陡峭
- 原生并不支持水平扩展

### ElasticSearch 的分布式架构

![](https://img.zhengyua.cn/img/20220228095556.png)

- 集群规模可以从单个节点扩展至数百节点
- 高可用且支持水命扩展（服务和数据两个维度）
- 支持不同的节点类型（支持 Hot 和 Waram 架构）

### 支持多种方式接入

- 多种编程语言类库
- RESTful API
- JDBC&ODBC

### 主要功能

- 海量数据的分布式存储以及集群管理
  - 服务和数据的高可用，水平扩展
- 近实时搜索，性能卓越
  - 结构化/全文/地理位置/自动完成
- 海量数据的近实时分析
  - 聚合功能


## ElasticStack 生态圈

![](https://img.zhengyua.cn/img/20220228094934.png)


1. Logstash

开源的服务器端数据处理管道，支持从不同来源采集数据，转换数据，并将数据发送到不同的存储库中。且有以下特性：

- 实时解析和转换数据（如从IP地址破译出地理坐标和PII数据匿名化等）
- 可扩展（200多个插件包含日志、数据库等）
- 可靠性安全性（持久化队列和数据传输加密等）
- 监控

2. Kibana

数据可视化工具。

![](https://img.zhengyua.cn/img/20220228093053.png)

3. BEATS

使用GO语言开发的轻量数据采集器。

![](https://img.zhengyua.cn/img/20220228093320.png)

4. X-Pack

商业化套件。可主要应用于：

- Machine Learning
- Alerting
- 图表功能
- SQL 的 JDBC 和 ODBC 连接性

## ELK 应用场景

主要包括：

- 网站搜索/垂直搜索/代码搜索
- 日志管理与分析/安全指标监控/应用性能指标监控/WEB抓取舆情分

总结下来就是**搜索**和**分析**。

## 常见架构接入场景

### ElasticSearch 与数据库的集成

![](https://img.zhengyua.cn/img/20220228094058.png)

- 单独使用 ElasticSearch 存储
- 以下情况可以考虑与数据库集成：
  - 与现有系统的集成
  - 需要考虑**事务性**
  - **数据更新频繁**

### 指标分析/日志分析

![](https://img.zhengyua.cn/img/20220228094229.png)

## 安装部署

### ElasticSearch 安装&简单配置

> ElasticSearch7.0版本及之后安装时已经内置 Java 环境，所以不需要额外准备 Java 编译环境。

这里以 **windows 系统**进行安装部署。

1. **直接在官网上下载安装包**

[官网下载链接](https://www.elastic.co/cn/downloads/elasticsearch)

安装及运行过程该页面都有相应提示：

![](https://img.zhengyua.cn/img/20220228102131.png)


ElasticSearch 安装目录：

- Bin：脚本文件
- config：集群配置文件，user，role based 相关配置
- JDK：Java运行环境
- data（path.data）：数据文件
- lb：Java 类库
- logs（path.log）：日志文件
- modules：包含所有 ES 模块
- plugins：包含所有已安装插件

> **配置建议**
> - 修改 JVM - config/jvm.options
> - 7.1 下载的默认配置是1GB
> - Xmx 和 Xms 设置成一样
> - Xmx 不要超过机器内存的50%
> - 不要超过30GB

2. **启动ElasticSearch**

运行程序如下：

![](https://img.zhengyua.cn/img/20220228121711.png)

> 这里可以将 ElasticSearch 下的 bin 目录放入环境变量，方便后续使用。

![](https://img.zhengyua.cn/img/20220301123644.png)

这里需要注意的是，这里下载的是 8.0 的版本，第一次启动的时候默认是开启了`x-pack`安全鉴权和`https`等配置，所以在我们访问的是时候都是`HTTPS`进行访问，且需要输入账号密码进行登录，默认用户名为`elastic`，密码是第一次启动的时候自动生成的。


3. **验证ElasticSearch是否启动成功**

这里我们需要访问的是：

- https://localhost:9200

![](https://img.zhengyua.cn/img/20220301124248.png)

出现上述页面就说明启动成功了。

4. **安装并查看ElasticSearch插件**

我们可以通过`elasticsearch-plugin`来进行插件的安装，如下图所示：

![](https://img.zhengyua.cn/img/20220228132648.png)

安装成功后，可以通过`https://localhost:9200/_cat/plugins`查看：

![](https://img.zhengyua.cn/img/20220228132829.png)
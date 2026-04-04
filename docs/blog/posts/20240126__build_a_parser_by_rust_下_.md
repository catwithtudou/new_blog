---
date: 2024-01-26
categories:
  - rust
tags:
  - rust
  - parser
---

# 🔬Build A Parser By Rust（下）

> 此文档内容为飞书文档复制过来作为搜索，存在内容格式不兼容情况，建议看原[飞书文档](https://jih9axn4gg.feishu.cn/wiki/VmmVwdAMHiLCOJkNMXwcJGq6nfg?from=from_copylink)

# 背景

通过上文（[Build A Parser By Rust（上）](https://jih9axn4gg.feishu.cn/wiki/WdxwwjNnbivzzXkZZwZcR5l7nPd?chunked=false) ）我们已经基本了解了解析器的相关概念及其 Rust 中解析器库的相关使用等，所以这篇文章我们将上文学到的东西实践到具体的 case 中，帮助大家更好地理解其概念和掌握其实际的应用，同时也能了解到部分解析器实现的相关设计，为后续实现自定义的解析器提供思路。

下面将会带领大家，分别通过 nom 和 pest 来简单实现较为常见且协议较为简单的 Json 解析器。

> 注意：
>
> - 下面使用到的 nom 或者 pest 的依赖版本为最新版本
>
> ```TOML
> [dependencies]
> pest = "2.6"
> pest_derive = "2.6"
> nom = "7.1.3"
> ```
>
> - 下面在实践过程中，只会解释部分重要或上文没有提到的 API 的具体含义，若想了解可查阅[上文](https://jih9axn4gg.feishu.cn/wiki/WdxwwjNnbivzzXkZZwZcR5l7nPd?from=from_copylink)或库文档
> - 此篇文档构造的解析器只验证了解析的正确性，并没有进行相关的性能压测，感兴趣的同学可自行尝试
> - 具体源码可查看：[https://github.com/catwithtudou/parser_toy/tree/main](https://github.com/catwithtudou/parser_toy/tree/main)


<!-- more -->

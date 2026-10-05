# Middleware

这里目前以 Elasticsearch 与搜索引擎的学习笔记为主。下面按概念、索引设计和查询的顺序整理阅读入口。

## 先理解搜索与索引

1. [初识 Elasticsearch](search_engine/20220228_elasticsearch初识.md)
2. [文档、索引与基本概念](search_engine/20220303_elasticsearch基本概念.md)
3. [倒排索引与 Analysis 分词](search_engine/20220305_elasticsearch倒排索引_analysis分词.md)

## 组织数据与查询

- **定义数据结构**：[Mapping](search_engine/20220307_elasticsearchmapping.md) · [Template](search_engine/20220308_elasticsearchtemplate使用.md)
- **处理文本**：[多字段特性与自定义 Analyzer](search_engine/20220308_elasticsearch多字段特性_自定义analyzer.md)
- **查询与分析**：[Search API](search_engine/20220307_elasticsearchsearchapi.md) · [深入搜索](search_engine/20220318_elasticsearch深入搜索.md) · [聚合简介](search_engine/20220308_elasticsearch聚合简介.md)

这些笔记记录于 2022 年，API 与配置示例需要结合所用的 Elasticsearch 版本阅读。

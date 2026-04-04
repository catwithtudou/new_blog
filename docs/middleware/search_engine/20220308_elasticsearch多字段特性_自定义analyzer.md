# ElasticSearch多字段特性&自定义Analyzer

## 多字段特性

以不同的特性索引字段来实现不同的需求，即多字段的特性。

```json
PUT products
{
    "mappings":{
        "properties":{
            "company":{
                "type":"text",
                "fields":{
                    "keyword":{
                        "type":"keyword",
                        "ignore_above":256,
                    }
                }
            },
            "comment":{
                "type":"text",
                "fields":{
                    "english_comment":{
                        "type":"text",
                        "analyzer":"english",
                        "search_anlyzer":"english"
                    }
                }
            }
        }
    }
}
```

### ExactValues&FullText

- Exact Value：包括数字/日期/具体一个字符串
  - `keyword`
- Full text：全文本，非结构化的文本数据
  - `text`

其中 Exact Value **不需要被分词**，会为每一个字段创建一个倒排索引。

## 自定义分词

可以通过不同的组合实现自定义的分词器：

1. **Character Filter**

在 Tokenizer 之前**对文本进行处理，可配置多个**，且会影响 Tokenizer 的 position 和 offset 信息。

> 自带的 Character Filter：HTML strip（去除 html 标签）、Mapping（字符串替换）、Pattern replace（正则替换）。

```json

POST _analyze
{
  "tokenizer":"keyword",
  "char_filter":["html_strip"],
  "text": "<b>hello world</b>"
}

#返回如下
{
  "tokens" : [
    {
      "token" : "hello world",
      "start_offset" : 3,
      "end_offset" : 18,
      "type" : "word",
      "position" : 0
    }
  ]
}


#使用char filter进行替换
POST _analyze
{
  "tokenizer": "standard",
  "char_filter": [
      {
        "type" : "mapping",
        "mappings" : [ "- => _"]
      }
    ],
  "text": "123-456, I-test"
}

#返回如下：
{
  "tokens" : [
    {
      "token" : "123_456",
      "start_offset" : 0,
      "end_offset" : 7,
      "type" : "<NUM>",
      "position" : 0
    },
    {
      "token" : "I_test",
      "start_offset" : 9,
      "end_offset" : 15,
      "type" : "<ALPHANUM>",
      "position" : 1
    }
  ]
}

//正则表达式
GET _analyze
{
  "tokenizer": "standard",
  "char_filter": [
      {
        "type" : "pattern_replace",
        "pattern" : "http://(.*)",
        "replacement" : "$1"
      }
    ],
    "text" : "http://www.elastic.co"
}

#返回如下：
{
  "tokens" : [
    {
      "token" : "www.elastic.co",
      "start_offset" : 0,
      "end_offset" : 21,
      "type" : "<ALPHANUM>",
      "position" : 0
    }
  ]
}
```

2. **Tokenizer**

将原始的文本按照一定的规则，**切分为词（term or token）**。

- Elasticsearch 内置的 Tokenizer
  - `whitespace`/`standard`/`uax_url email`/`pattern`/`keyword`/`path hierarchy`

> 可以用官方提供的库自己开发。

```json
POST _analyze
{
  "tokenizer":"path_hierarchy",
  "text":"/user/e/a"
}

#返回如下
{
  "tokens" : [
    {
      "token" : "/user",
      "start_offset" : 0,
      "end_offset" : 5,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "/user/e",
      "start_offset" : 0,
      "end_offset" : 7,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "/user/e/a",
      "start_offset" : 0,
      "end_offset" : 9,
      "type" : "word",
      "position" : 0
    }
  ]
}

```

3. **TokenFilter**

将 Tokenizer 输出的单词（term），进行增加、修改、删除。

- Elasticsearch 内置的：
  - `Lowercase`/`stop`/`synonym`（添加近义词）

```json
// white space and snowball
GET _analyze
{
  "tokenizer": "whitespace",
  "filter": ["stop","snowball"],
  "text": ["The gilrs in China are playing this game!"]
}

#返回如下：
{
  "tokens" : [
    {
      "token" : "The",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "gilr",
      "start_offset" : 4,
      "end_offset" : 9,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "China",
      "start_offset" : 13,
      "end_offset" : 18,
      "type" : "word",
      "position" : 3
    },
    {
      "token" : "play",
      "start_offset" : 23,
      "end_offset" : 30,
      "type" : "word",
      "position" : 5
    },
    {
      "token" : "game!",
      "start_offset" : 36,
      "end_offset" : 41,
      "type" : "word",
      "position" : 7
    }
  ]
}


//remove 加入lowercase后，The被当成 stopword删除
GET _analyze
{
  "tokenizer": "whitespace",
  "filter": ["lowercase","stop","snowball"],
  "text": ["The gilrs in China are playing this game!"]
}

#返回如下：
{
  "tokens" : [
    {
      "token" : "gilr",
      "start_offset" : 4,
      "end_offset" : 9,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "china",
      "start_offset" : 13,
      "end_offset" : 18,
      "type" : "word",
      "position" : 3
    },
    {
      "token" : "play",
      "start_offset" : 23,
      "end_offset" : 30,
      "type" : "word",
      "position" : 5
    },
    {
      "token" : "game!",
      "start_offset" : 36,
      "end_offset" : 41,
      "type" : "word",
      "position" : 7
    }
  ]
}

```


## 参考

https://time.geekbang.org/course/intro/100030501?tab=catalog
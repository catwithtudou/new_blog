# ElasticSearch倒排索引&Analysis分词

## 正排索引和倒排索引

![](https://img.zhengyua.cn/img/20220305143949.png)

> 书籍的目录也是生活中常见的正排索引。

### 倒排索引核心组成

其主要包含两个部分：

1. 单词词典（Term Dictionary）

**记录所有的单词，记录单词到倒排列表的关联关系。**

> 单词词典一般较大，可通过插入查询性能较高 B+树或哈希拉链法实。

2. 倒排列表（Posting List）

**记录单词对应的文档组合，由倒排索引项组成。**

其中倒排索引项（Posting）：

- 文档 ID
- 词频 TF：记录单词在文档出现的次数，用于相关性评分
- 位置（Position）：单词在文档中分词的位置，利于语句搜索
- 偏移（Offset）:单词在文档中开始结束位置，实现高亮显示

![](https://img.zhengyua.cn/img/20220305144721.png)


## Analysis & Analyzer

Analysis 即文本分析，是把全文转换一系列单词（term/token）的过程，也叫分词。而 Analysis 就是通过 Analyzer 实现的。

> 可使用 Elasticsearch 内置的分析器或者按需定制分析器。

除了在数据写入时转换词条，**匹配 Query 语句时也需要用相同的分析器对查询语句进行分析**。

### Analyzer 的组成

分词器是专门处理分词的组件，Analyzer 由三部分组成：

- **Character Filters**：针对原始文本处理，如去除 html
- **Tokenizer**：按照规则，切分为单词
- **Token Filter**：将切分的单词进行加工，小写，删除 stopwords，增加同义词

一般按照顺序 Character Filters -> Tokenizer -> Token Filter 对语句进行拆分。

### 使用 _analyzer API

- 可指定 Analyzer 进行测试
- 指定索引的字段进行测试
- 自定义分词进行测试

```json
GET /_analyze 
{
    "analyzer":"standard",
    "text":"xxx"
}

POST index/_analyze 
{
    "field":"xxx",
    "text":"xxx"
}

POST /_analyze 
{
    "tokenizer":"standard",
    "filter":["lowercase"],
    "text":"xxx"
}
```

### Analyzer 类型

#### Standard Analyzer

- 默认分词器
- 按词切分
- 小写处理

组成如下：

- Tokenizer:Standard
- TokenFilters:Standard&LowerCase&Stop(默认关闭)

```json
#standard
GET _analyze
{
  "analyzer": "standard",
  "text": "2 running Quick brown-foxes leap over lazy dogs in the summer evening."
}


{
  "tokens" : [
    {
      "token" : "2",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "<NUM>",
      "position" : 0
    },
    {
      "token" : "running",
      "start_offset" : 2,
      "end_offset" : 9,
      "type" : "<ALPHANUM>",
      "position" : 1
    },
    {
      "token" : "quick",
      "start_offset" : 10,
      "end_offset" : 15,
      "type" : "<ALPHANUM>",
      "position" : 2
    },
    {
      "token" : "brown",
      "start_offset" : 16,
      "end_offset" : 21,
      "type" : "<ALPHANUM>",
      "position" : 3
    },
    {
      "token" : "foxes",
      "start_offset" : 22,
      "end_offset" : 27,
      "type" : "<ALPHANUM>",
      "position" : 4
    },
    {
      "token" : "leap",
      "start_offset" : 28,
      "end_offset" : 32,
      "type" : "<ALPHANUM>",
      "position" : 5
    },
    {
      "token" : "over",
      "start_offset" : 33,
      "end_offset" : 37,
      "type" : "<ALPHANUM>",
      "position" : 6
    },
    {
      "token" : "lazy",
      "start_offset" : 38,
      "end_offset" : 42,
      "type" : "<ALPHANUM>",
      "position" : 7
    },
    {
      "token" : "dogs",
      "start_offset" : 43,
      "end_offset" : 47,
      "type" : "<ALPHANUM>",
      "position" : 8
    },
    {
      "token" : "in",
      "start_offset" : 48,
      "end_offset" : 50,
      "type" : "<ALPHANUM>",
      "position" : 9
    },
    {
      "token" : "the",
      "start_offset" : 51,
      "end_offset" : 54,
      "type" : "<ALPHANUM>",
      "position" : 10
    },
    {
      "token" : "summer",
      "start_offset" : 55,
      "end_offset" : 61,
      "type" : "<ALPHANUM>",
      "position" : 11
    },
    {
      "token" : "evening",
      "start_offset" : 62,
      "end_offset" : 69,
      "type" : "<ALPHANUM>",
      "position" : 12
    }
  ]
}
```

#### Simple Analyzer

- 按照非字母切分，非字母的都被去除
- 小写处理

组成如下：

- Tokenizer：LowerCase

```json
GET _analyze
{
  "analyzer": "simple",
  "text": "2 running Quick brown-foxes leap over lazy dogs in the summer evening."
}

{
  "tokens" : [
    {
      "token" : "running",
      "start_offset" : 2,
      "end_offset" : 9,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "quick",
      "start_offset" : 10,
      "end_offset" : 15,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "brown",
      "start_offset" : 16,
      "end_offset" : 21,
      "type" : "word",
      "position" : 2
    },
    {
      "token" : "foxes",
      "start_offset" : 22,
      "end_offset" : 27,
      "type" : "word",
      "position" : 3
    },
    {
      "token" : "leap",
      "start_offset" : 28,
      "end_offset" : 32,
      "type" : "word",
      "position" : 4
    },
    {
      "token" : "over",
      "start_offset" : 33,
      "end_offset" : 37,
      "type" : "word",
      "position" : 5
    },
    {
      "token" : "lazy",
      "start_offset" : 38,
      "end_offset" : 42,
      "type" : "word",
      "position" : 6
    },
    {
      "token" : "dogs",
      "start_offset" : 43,
      "end_offset" : 47,
      "type" : "word",
      "position" : 7
    },
    {
      "token" : "in",
      "start_offset" : 48,
      "end_offset" : 50,
      "type" : "word",
      "position" : 8
    },
    {
      "token" : "the",
      "start_offset" : 51,
      "end_offset" : 54,
      "type" : "word",
      "position" : 9
    },
    {
      "token" : "summer",
      "start_offset" : 55,
      "end_offset" : 61,
      "type" : "word",
      "position" : 10
    },
    {
      "token" : "evening",
      "start_offset" : 62,
      "end_offset" : 69,
      "type" : "word",
      "position" : 11
    }
  ]
}

```

#### Whitespace Analyzer

- 按照空格切分

组成如下：

- Tokenizer:Whitespace

#### Stop Analyzer

- 相比 Simple Analyzer 多了 stop filter
  - 会把 the\a\is 等修饰性词语去除

组成如下：

- Tokenizer:Lowe Case
- TokenFilter:Stop

```json
#stop
GET _analyze
{
  "analyzer": "whitespace",
  "text": "2 running Quick brown-foxes leap over lazy dogs in the summer evening."
}

{
  "tokens" : [
    {
      "token" : "2",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "running",
      "start_offset" : 2,
      "end_offset" : 9,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "Quick",
      "start_offset" : 10,
      "end_offset" : 15,
      "type" : "word",
      "position" : 2
    },
    {
      "token" : "brown-foxes",
      "start_offset" : 16,
      "end_offset" : 27,
      "type" : "word",
      "position" : 3
    },
    {
      "token" : "leap",
      "start_offset" : 28,
      "end_offset" : 32,
      "type" : "word",
      "position" : 4
    },
    {
      "token" : "over",
      "start_offset" : 33,
      "end_offset" : 37,
      "type" : "word",
      "position" : 5
    },
    {
      "token" : "lazy",
      "start_offset" : 38,
      "end_offset" : 42,
      "type" : "word",
      "position" : 6
    },
    {
      "token" : "dogs",
      "start_offset" : 43,
      "end_offset" : 47,
      "type" : "word",
      "position" : 7
    },
    {
      "token" : "in",
      "start_offset" : 48,
      "end_offset" : 50,
      "type" : "word",
      "position" : 8
    },
    {
      "token" : "the",
      "start_offset" : 51,
      "end_offset" : 54,
      "type" : "word",
      "position" : 9
    },
    {
      "token" : "summer",
      "start_offset" : 55,
      "end_offset" : 61,
      "type" : "word",
      "position" : 10
    },
    {
      "token" : "evening.",
      "start_offset" : 62,
      "end_offset" : 70,
      "type" : "word",
      "position" : 11
    }
  ]
}
``` 

#### Keyword Analyzer

- 不分词，直接把输入当 term 输出

组成如下：

- Tokenizer:Keyword

#### Pattern Analyzer

- 通过正则表达式进行分词
- 默认是 \W+,非字符的符号进行分隔

组成如下：

- Tokenizer:Pattern
- TokenFilters:LowerCase&Stop

```json
GET _analyze
{
  "analyzer": "pattern",
  "text": "2 running Quick brown-foxes leap over lazy dogs in the summer evening."
}

{
  "tokens" : [
    {
      "token" : "2",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "running",
      "start_offset" : 2,
      "end_offset" : 9,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "quick",
      "start_offset" : 10,
      "end_offset" : 15,
      "type" : "word",
      "position" : 2
    },
    {
      "token" : "brown",
      "start_offset" : 16,
      "end_offset" : 21,
      "type" : "word",
      "position" : 3
    },
    {
      "token" : "foxes",
      "start_offset" : 22,
      "end_offset" : 27,
      "type" : "word",
      "position" : 4
    },
    {
      "token" : "leap",
      "start_offset" : 28,
      "end_offset" : 32,
      "type" : "word",
      "position" : 5
    },
    {
      "token" : "over",
      "start_offset" : 33,
      "end_offset" : 37,
      "type" : "word",
      "position" : 6
    },
    {
      "token" : "lazy",
      "start_offset" : 38,
      "end_offset" : 42,
      "type" : "word",
      "position" : 7
    },
    {
      "token" : "dogs",
      "start_offset" : 43,
      "end_offset" : 47,
      "type" : "word",
      "position" : 8
    },
    {
      "token" : "in",
      "start_offset" : 48,
      "end_offset" : 50,
      "type" : "word",
      "position" : 9
    },
    {
      "token" : "the",
      "start_offset" : 51,
      "end_offset" : 54,
      "type" : "word",
      "position" : 10
    },
    {
      "token" : "summer",
      "start_offset" : 55,
      "end_offset" : 61,
      "type" : "word",
      "position" : 11
    },
    {
      "token" : "evening",
      "start_offset" : 62,
      "end_offset" : 69,
      "type" : "word",
      "position" : 12
    }
  ]
}
```

#### Language Analyzer

支持按不同国家语言进行分词。

```json
#english
GET _analyze
{
  "analyzer": "english",
  "text": "2 running Quick brown-foxes leap over lazy dogs in the summer evening."
}

{
  "tokens" : [
    {
      "token" : "2",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "<NUM>",
      "position" : 0
    },
    {
      "token" : "run",
      "start_offset" : 2,
      "end_offset" : 9,
      "type" : "<ALPHANUM>",
      "position" : 1
    },
    {
      "token" : "quick",
      "start_offset" : 10,
      "end_offset" : 15,
      "type" : "<ALPHANUM>",
      "position" : 2
    },
    {
      "token" : "brown",
      "start_offset" : 16,
      "end_offset" : 21,
      "type" : "<ALPHANUM>",
      "position" : 3
    },
    {
      "token" : "fox",
      "start_offset" : 22,
      "end_offset" : 27,
      "type" : "<ALPHANUM>",
      "position" : 4
    },
    {
      "token" : "leap",
      "start_offset" : 28,
      "end_offset" : 32,
      "type" : "<ALPHANUM>",
      "position" : 5
    },
    {
      "token" : "over",
      "start_offset" : 33,
      "end_offset" : 37,
      "type" : "<ALPHANUM>",
      "position" : 6
    },
    {
      "token" : "lazi",
      "start_offset" : 38,
      "end_offset" : 42,
      "type" : "<ALPHANUM>",
      "position" : 7
    },
    {
      "token" : "dog",
      "start_offset" : 43,
      "end_offset" : 47,
      "type" : "<ALPHANUM>",
      "position" : 8
    },
    {
      "token" : "summer",
      "start_offset" : 55,
      "end_offset" : 61,
      "type" : "<ALPHANUM>",
      "position" : 11
    },
    {
      "token" : "even",
      "start_offset" : 62,
      "end_offset" : 69,
      "type" : "<ALPHANUM>",
      "position" : 12
    }
  ]
}
```

#### 中文分词

中文分词难点较多，如需要切分成词、没有像英文自然的空格作为分隔、不同上下文分词理解不同等。

中文分词使用较为常见的分词器 ICU Analyzer：

- 需要安装 plugin
  - `Elasticsearch-plugin install analysis-icu`
- 提供了 Unicode 的支持，更好的支持亚洲语言

组成如下：

- CharacterFilters:Normalization
- Tokenizer:ICU Tokenizer
- TokenFilters:Normalization&Folding&Collation&Transform


```json
POST _analyze
{
  "analyzer": "icu_analyzer",
  "text": "他说的确实在理”"
}

{
  "tokens" : [
    {
      "token" : "他",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "<IDEOGRAPHIC>",
      "position" : 0
    },
    {
      "token" : "说的",
      "start_offset" : 1,
      "end_offset" : 3,
      "type" : "<IDEOGRAPHIC>",
      "position" : 1
    },
    {
      "token" : "确实",
      "start_offset" : 3,
      "end_offset" : 5,
      "type" : "<IDEOGRAPHIC>",
      "position" : 2
    },
    {
      "token" : "在",
      "start_offset" : 5,
      "end_offset" : 6,
      "type" : "<IDEOGRAPHIC>",
      "position" : 3
    },
    {
      "token" : "理",
      "start_offset" : 6,
      "end_offset" : 7,
      "type" : "<IDEOGRAPHIC>",
      "position" : 4
    }
  ]
}



POST _analyze
{
  "analyzer": "standard",
  "text": "他说的确实在理”"
}


{
  "tokens" : [
    {
      "token" : "他",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "<IDEOGRAPHIC>",
      "position" : 0
    },
    {
      "token" : "说",
      "start_offset" : 1,
      "end_offset" : 2,
      "type" : "<IDEOGRAPHIC>",
      "position" : 1
    },
    {
      "token" : "的",
      "start_offset" : 2,
      "end_offset" : 3,
      "type" : "<IDEOGRAPHIC>",
      "position" : 2
    },
    {
      "token" : "确",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "<IDEOGRAPHIC>",
      "position" : 3
    },
    {
      "token" : "实",
      "start_offset" : 4,
      "end_offset" : 5,
      "type" : "<IDEOGRAPHIC>",
      "position" : 4
    },
    {
      "token" : "在",
      "start_offset" : 5,
      "end_offset" : 6,
      "type" : "<IDEOGRAPHIC>",
      "position" : 5
    },
    {
      "token" : "理",
      "start_offset" : 6,
      "end_offset" : 7,
      "type" : "<IDEOGRAPHIC>",
      "position" : 6
    }
  ]
}


POST _analyze
{
  "analyzer": "icu_analyzer",
  "text": "这个苹果不大好吃"
}
{
  "tokens" : [
    {
      "token" : "这个",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "<IDEOGRAPHIC>",
      "position" : 0
    },
    {
      "token" : "苹果",
      "start_offset" : 2,
      "end_offset" : 4,
      "type" : "<IDEOGRAPHIC>",
      "position" : 1
    },
    {
      "token" : "不大",
      "start_offset" : 4,
      "end_offset" : 6,
      "type" : "<IDEOGRAPHIC>",
      "position" : 2
    },
    {
      "token" : "好吃",
      "start_offset" : 6,
      "end_offset" : 8,
      "type" : "<IDEOGRAPHIC>",
      "position" : 3
    }
  ]
}
```

更多的中文分词器：

- IK
  - 支持自定义词库，支持热更新分词字典
  - https://github.com/medcl/elasticsearch-analysis-ik
- THULAC
  - THU Lexucal Analyzer for Chinese，清华大学自然语言处理和社会人文计算实验室的一套中文分词器
  - https://github.com/microbun/elasticsearch-thulac-plugin


```json
POST _analyze
{
  "analyzer": "ik_smart",
  "text": "他说的确实在理”"
}

{
  "tokens" : [
    {
      "token" : "他",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "CN_CHAR",
      "position" : 0
    },
    {
      "token" : "说",
      "start_offset" : 1,
      "end_offset" : 2,
      "type" : "CN_CHAR",
      "position" : 1
    },
    {
      "token" : "的确",
      "start_offset" : 2,
      "end_offset" : 4,
      "type" : "CN_WORD",
      "position" : 2
    },
    {
      "token" : "实",
      "start_offset" : 4,
      "end_offset" : 5,
      "type" : "CN_CHAR",
      "position" : 3
    },
    {
      "token" : "在理",
      "start_offset" : 5,
      "end_offset" : 7,
      "type" : "CN_WORD",
      "position" : 4
    }
  ]
}


POST _analyze
{
  "analyzer": "ik_smart",
  "text": "这个苹果不大好吃"
}

{
  "tokens" : [
    {
      "token" : "这个",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "CN_WORD",
      "position" : 0
    },
    {
      "token" : "苹果",
      "start_offset" : 2,
      "end_offset" : 4,
      "type" : "CN_WORD",
      "position" : 1
    },
    {
      "token" : "不大",
      "start_offset" : 4,
      "end_offset" : 6,
      "type" : "CN_WORD",
      "position" : 2
    },
    {
      "token" : "好吃",
      "start_offset" : 6,
      "end_offset" : 8,
      "type" : "CN_WORD",
      "position" : 3
    }
  ]
}



```

## 参考

https://time.geekbang.org/course/intro/100030501?tab=catalog
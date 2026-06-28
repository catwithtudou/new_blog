# ElasticSearch深入搜索

## 基于词项和基于全文搜索

![](https://img.zhengyua.cn/img/202203181639379.png)

### 基于 Term 的查询

- Term 的重要性
  - Term 是**表达语意的最小单位**
  - 搜索和利用统计语言模型进行自然语言处理都需要处理 Term

- 特点
  - **Term Level Query**:Term Query/Range Query/Exists Query/Prefix Query/Wildcard Query
  - Term 查询对**输入不做分词**（会将输入作为一个整体，在倒排索引中查找准确的词项，并且使用相关度算分公式为每个包含该词项的文档进行**相关度算分**）
  - 可以通过 Constant Score 将查询**转换成一个 Filtering，避免算分，并利用缓存，提高性能**

```json
DELETE products
PUT products
{
  "settings": {
    "number_of_shards": 1
  }
}


POST /products/_bulk
{ "index": { "_id": 1 }}
{ "productID" : "XHDK-A-1293-#fJ3","desc":"iPhone" }
{ "index": { "_id": 2 }}
{ "productID" : "KDKE-B-9947-#kL5","desc":"iPad" }
{ "index": { "_id": 3 }}
{ "productID" : "JODL-X-1937-#pV7","desc":"MBP" }

GET /products

POST /products/_search
{
  "query": {
    "term": {
      "desc": {
        //"value": "iPhone"
        "value":"iphone"
      }
    }
  }
}

POST /products/_search
{
  "query": {
    "term": {
      "desc.keyword": {
        //"value": "iPhone"
        //"value":"iphone"
      }
    }
  }
}

POST /products/_search
{
  "query": {
    "term": {
      "productID": {
        "value": "XHDK-A-1293-#fJ3"
      }
    }
  }
}

POST /products/_search
{
  //"explain": true,
  "query": {
    "term": {
      "productID.keyword": {
        "value": "XHDK-A-1293-#fJ3"
      }
    }
  }
}

```

### 复合查询（Constant Score 转为 Filter）

- 将 Query 转成 Filter，忽略 TF-IDF 计算，**避免相关性算分的开销**
- Filter 可以有效**利用缓存**

```json

POST /products/_search
{
  "explain": true,
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "productID.keyword": "XHDK-A-1293-#fJ3"
        }
      }

    }
  }
}

```

### 基于全文的查询

- 基于全文本的查找
  - Match Query/Match Phrase Query/Query String Query
- 特点
  - 索引和搜索时**都会进行分词**，查询字符串先传递到一个合适的分词器，然后生成一个供查询的词项列表
  - 查询时候，先会对输入的查询进行分词，然后每个词项逐个进行底层的查询，最终将结果进行合并。**并为每一个文档生成一个算分**。

```json
#设置 position_increment_gap
DELETE groups
PUT groups
{
  "mappings": {
    "properties": {
      "names":{
        "type": "text",
        "position_increment_gap": 0
      }
    }
  }
}

GET groups/_mapping

POST groups/_doc
{
  "names": [ "John Water", "Water Smith"]
}

POST groups/_search
{
  "query": {
    "match_phrase": {
      "names": {
        "query": "Water Water",
        "slop": 100
      }
    }
  }
}


POST groups/_search
{
  "query": {
    "match_phrase": {
      "names": "Water Smith"
    }
  }
}
```

# ElasticSearchMapping

## 字段的数据类型

字段的数据类型主要如下：

- **简单类型**
  - Text/Keyword
  - Date
  - Integer/Floating
  - Boolean
  - IPv4&IPv6
- **复杂类型-对象和嵌套对象**
  - 对象类型/嵌套类型
- **特殊类型**
  - geo_point&geo_shape/percolator

## Mapping

- Mapping 类似**数据库中的 Schema 的定义**，作用如下：
  - 定义索引中的字段的名称
  - 定义字段的数据类型
  - 字段，倒排索引的相关，Analyzer等
- Mapping 会把 JSON 文档**映射成 Lucene 所需要的扁平格式**
- 一个 Mapping **属于一个索引的 Type**
  - 每个文档都属于一个 Type
  - 一个 Type 有一个 Mapping 定义

### 显示自定义 Mappings

```json
PUT movies
{
    "mappings":{
        //define your mappings here
    }
}
```

在自定义 Mappings 我们需要注意的是：

- 可以参考 API 手册手写
- 为了减少工作量和出错概率，**最好可以创建临时 index 来测试**

#### 控制当前字段是否被索引

`index` 控制当前字段是否被索引：

- 默认为true，若设置为false则该字段不可被搜索

```json
PUT users
{
    "mappings" : {
      "properties" : {
        "firstName" : {
          "type" : "text"
        },
        "lastName" : {
          "type" : "text"
        },
        "mobile" : {
          "type" : "text",
          "index": false
        }
      }
    }
}

PUT users/_doc/1
{
  "firstName":"Ruan",
  "lastName": "Yiming",
  "mobile": "12345678"
}

POST /users/_search
{
  "query": {
    "match": {
      "mobile":"12345678"
    }
  }
}

#返回如下：
{
  "error": {
    "root_cause": [
      {
        "type": "query_shard_exception",
        "reason": "failed to create query: {\n  \"match\" : {\n    \"mobile\" : {\n      \"query\" : \"12345678\",\n      \"operator\" : \"OR\",\n      \"prefix_length\" : 0,\n      \"max_expansions\" : 50,\n      \"fuzzy_transpositions\" : true,\n      \"lenient\" : false,\n      \"zero_terms_query\" : \"NONE\",\n      \"auto_generate_synonyms_phrase_query\" : true,\n      \"boost\" : 1.0\n    }\n  }\n}",
        "index_uuid": "SxPqkWdSSmqvEN1Fs1_VSQ",
        "index": "users"
      }
    ],
    "type": "search_phase_execution_exception",
    "reason": "all shards failed",
    "phase": "query",
    "grouped": true,
    "failed_shards": [
      {
        "shard": 0,
        "index": "users",
        "node": "Ko9MGMaiQsqw-So5TLyBIg",
        "reason": {
          "type": "query_shard_exception",
          "reason": "failed to create query: {\n  \"match\" : {\n    \"mobile\" : {\n      \"query\" : \"12345678\",\n      \"operator\" : \"OR\",\n      \"prefix_length\" : 0,\n      \"max_expansions\" : 50,\n      \"fuzzy_transpositions\" : true,\n      \"lenient\" : false,\n      \"zero_terms_query\" : \"NONE\",\n      \"auto_generate_synonyms_phrase_query\" : true,\n      \"boost\" : 1.0\n    }\n  }\n}",
          "index_uuid": "SxPqkWdSSmqvEN1Fs1_VSQ",
          "index": "users",
          "caused_by": {
            "type": "illegal_argument_exception",
            "reason": "Cannot search on field [mobile] since it is not indexed."
          }
        }
      }
    ]
  },
  "status": 400
}
```

#### index Options

- 四种不同级别的 Index Options 配置，**可以控制倒排索引记录的内容**：
  - `docs`：记录 doc id
  - `freqs`：记录 doc id 和 term frequencies
  - `positions`：记录 doc id/term frequencies/term position
  - `offsets`：记录 doc id/term frequencies/term positions/character offects
- Text类型**默认记录 positions，其他默认为 docs**
- **记录内容越多，占用存储空间越大**

#### null_value

- 需要对 Null 值实现搜索
- 只有 Keyword 类型支持设定 Null_Value

```json
#设定Null_value

DELETE users
PUT users
{
    "mappings" : {
      "properties" : {
        "firstName" : {
          "type" : "text"
        },
        "lastName" : {
          "type" : "text"
        },
        "mobile" : {
          "type" : "keyword",
          "null_value": "NULL"
        }

      }
    }
}

PUT users/_doc/1
{
  "firstName":"Ruan",
  "lastName": "Yiming",
  "mobile": null
}

GET users/_search
{
  "query": {
    "match": {
      "mobile":"NULL"
    }
  }

}

# 返回内容：
{
  "took" : 6,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 0.2876821,
    "hits" : [
      {
        "_index" : "users",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.2876821,
        "_source" : {
          "firstName" : "Ruan",
          "lastName" : "Yiming",
          "mobile" : null
        }
      }
    ]
  }
}
```

#### copy_to 设置

- 满足一些特定的搜索需求
- `copy_to`将字段的数值拷贝到目标字段
- `copy_to`的目标字段不出现在`_source`中

```json
#设置 Copy to
DELETE users
PUT users
{
  "mappings": {
    "properties": {
      "firstName":{
        "type": "text",
        "copy_to": "fullName"
      },
      "lastName":{
        "type": "text",
        "copy_to": "fullName"
      }
    }
  }
}
PUT users/_doc/1
{
  "firstName":"Ruan",
  "lastName": "Yiming"
}

GET users/_search?q=fullName:(Ruan Yiming)

#以上等同
POST users/_search
{
  "query": {
    "match": {
       "fullName":{
        "query": "Ruan Yiming",
        "operator": "and"
      }
    }
  }
}




#返回如下：
{
  "took" : 44,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 0.5753642,
    "hits" : [
      {
        "_index" : "users",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.5753642,
        "_source" : {
          "firstName" : "Ruan",
          "lastName" : "Yiming"
        }
      }
    ]
  }
}


```

#### 数组类型

Elasticsearch中不提供专门的数组类型，**但任何字段都可以包含多个相同类型的数值**。

```json
#数组类型
PUT users/_doc/1
{
  "name":"onebird",
  "interests":"reading"
}

PUT users/_doc/1
{
  "name":"twobirds",
  "interests":["reading","music"]
}

POST users/_search
{
  "query": {
		"match_all": {}
	}
}

#返回如下：
{
  "took" : 466,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "users",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "name" : "twobirds",
          "interests" : [
            "reading",
            "music"
          ]
        }
      }
    ]
  }
}

GET users/_mapping

#返回如下：
{
  "users" : {
    "mappings" : {
      "properties" : {
        "firstName" : {
          "type" : "text",
          "copy_to" : [
            "fullName"
          ]
        },
        "fullName" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "interests" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "lastName" : {
          "type" : "text",
          "copy_to" : [
            "fullName"
          ]
        },
        "name" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        }
      }
    }
  }
}
```

### Dynamic Mapping

Dynamic Mapping 机制的作用在于：

- **无需手动定义 Mappings**，自动根据文档信息推断出字段类型
- 推断结果**可能会存在错误，严重则导致一些功能无法运行**，如地理位置信息、Range 查询

#### 类型的自动识别

|JSON类型|Elasticsearch类型|
|---|---|
|字符串|1.匹配日期格式，设置成Date|
||2.配置数字设置为float或long，该选项默认关闭|
||3.设置为Text，并且增加keyword子字段|
|布尔值|boolean|
|浮点数|float|
|整数|long|
|对象|Object|
|数组|由第一个非空数值的类型决定|
|空值|忽略|

```json

#写入文档，查看 Mapping
PUT mapping_test/_doc/1
{
  "firstName":"Chan",
  "lastName": "Jackie",
  "loginDate":"2018-07-24T10:29:48.103Z"
}

#查看 Mapping文件
GET mapping_test/_mapping


#返回如下：
{
  "mapping_test" : {
    "mappings" : {
      "properties" : {
        "firstName" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "lastName" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "loginDate" : {
          "type" : "date"
        }
      }
    }
  }
}

```

```json
#Delete index
DELETE mapping_test

#dynamic mapping，推断字段的类型
PUT mapping_test/_doc/1
{
    "uid" : "123",
    "isVip" : false,
    "isAdmin": "true",
    "age":19,
    "heigh":180
}

#查看 Dynamic
GET mapping_test/_mapping


#返回如下：
{
  "mapping_test" : {
    "mappings" : {
      "properties" : {
        "age" : {
          "type" : "long"
        },
        "heigh" : {
          "type" : "long"
        },
        "isAdmin" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "isVip" : {
          "type" : "boolean"
        },
        "uid" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        }
      }
    }
  }
}
```



### 更改 Mapping 字段类型


1. **新增加字段**

- `Dynamic`设为True时，有新增字段写入 Mapping 会被更新
- `Dynamic`设为False时，Mapping 不会被更新，新增字段数据无法被索引，但会出现在`_source`中
- `Dynamic`设为Strict时，文档写入失败


2. **对已有字段**

- 一旦已经有数据写入，不再支持修改字段定义
  
> 因 Lucene 实现的倒排索引，一旦生成后，就不允许被修改。

- 必须 Reindex API 重建索引的方式来改变字段类型

> 若修改了字段的数据类型，会导致已被缩影的属于无法被搜索，但如果新增字段就不会被影响。

### 控制 Dyanmic Mappings

||true|flase|stric|
|-|-|-|-|
|文档可索引|YES|YES|NO|
|字段可索引|YES|NO|NO|
|Mappings被更新|YES|NO|NO|

- 被设置为False时若新增字段写入，该数据可被索引，但新增字段会被丢弃
- 被设置为Stric时，数据写入直接报错


```json
#默认Mapping支持dynamic，写入的文档中加入新的字段
PUT dynamic_mapping_test/_doc/1
{
  "newField":"someValue"
}

#该字段可以被搜索，数据也在_source中出现
POST dynamic_mapping_test/_search
{
  "query":{
    "match":{
      "newField":"someValue"
    }
  }
}

#返回如下：
{
  "took" : 25,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 0.2876821,
    "hits" : [
      {
        "_index" : "dynamic_mapping_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.2876821,
        "_source" : {
          "newField" : "someValue"
        }
      }
    ]
  }
}
```

```json
#修改为dynamic false
PUT dynamic_mapping_test/_mapping
{
  "dynamic": false
}

#新增 anotherField
PUT dynamic_mapping_test/_doc/10
{
  "anotherField":"someValue"
}

#返回如下：
{
  "_index" : "dynamic_mapping_test",
  "_type" : "_doc",
  "_id" : "10",
  "_version" : 1,
  "result" : "created",
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "failed" : 0
  },
  "_seq_no" : 1,
  "_primary_term" : 1
}



#该字段不可以被搜索，因为dynamic已经被设置为false
POST dynamic_mapping_test/_search
{
  "query":{
    "match":{
      "anotherField":"someValue"
    }
  }
}

#返回如下：
{
  "took" : 766,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 0,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  }
}

# 但是文档可以被索引到
get dynamic_mapping_test/_doc/10

# 返回如下：
{
  "_index" : "dynamic_mapping_test",
  "_type" : "_doc",
  "_id" : "10",
  "_version" : 1,
  "_seq_no" : 1,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "anotherField" : "someValue"
  }
}

```

```json


#修改为strict
PUT dynamic_mapping_test/_mapping
{
  "dynamic": "strict"
}



#写入数据出错，HTTP Code 400
PUT dynamic_mapping_test/_doc/12
{
  "lastField":"value"
}

#返回如下：
{
  "error": {
    "root_cause": [
      {
        "type": "strict_dynamic_mapping_exception",
        "reason": "mapping set to strict, dynamic introduction of [lastField] within [_doc] is not allowed"
      }
    ],
    "type": "strict_dynamic_mapping_exception",
    "reason": "mapping set to strict, dynamic introduction of [lastField] within [_doc] is not allowed"
  },
  "status": 400
}
```

## 参考

https://time.geekbang.org/course/intro/100030501?tab=catalog
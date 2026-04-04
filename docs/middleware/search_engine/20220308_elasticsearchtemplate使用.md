# ElasticSearchTemplate使用

## Index Template

Index Template 可以**设定 Mappings 和 Settings，并按照一定的规则自动匹配到新创建的索引上**。

这里需要注意的是：

- 模板仅在一个索引被新创建时才会生效
- 修改模板不会影响已创建的索引
- 可以设定多个索引模板，这些设置会被"merge"在一起
- 可指定`order`的值，控制"merging"的过程


Index Template 的工作方式通过一个新索引被创建时观察：

- 应用默认的 settings 和 mappings
- 应用 order 数值低的 Index Template 中的设定
- 应用 order 数值高的 Index Template 中的设定，之前的设定会被覆盖
- 应用创建索引时，用户所指定的 Settings 和 Mappings，并覆盖之前模板中的设定

```json
#Create a default template
PUT _template/template_default
{
  "index_patterns": ["*"],
  "order" : 0,
  "version": 1,
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas":1
  }
}


PUT _template/template_test
{
    "index_patterns" : ["test*"],
    "order" : 1,
    "settings" : {
    	"number_of_shards": 1,
        "number_of_replicas" : 2
    },
    "mappings" : {
    	"date_detection": false,
    	"numeric_detection": true
    }
}

#查看template信息
GET /_template/template_default

# 返回如下：
{
  "template_default" : {
    "order" : 0,
    "version" : 1,
    "index_patterns" : [
      "*"
    ],
    "settings" : {
      "index" : {
        "number_of_shards" : "1",
        "number_of_replicas" : "1"
      }
    },
    "mappings" : { },
    "aliases" : { }
  }
}

#使用通配符查看template信息
GET /_template/temp*

{
  "template_test" : {
    "order" : 1,
    "index_patterns" : [
      "test*"
    ],
    "settings" : {
      "index" : {
        "number_of_shards" : "1",
        "number_of_replicas" : "2"
      }
    },
    "mappings" : {
      "numeric_detection" : true,
      "date_detection" : false
    },
    "aliases" : { }
  },
  "template_default" : {
    "order" : 0,
    "version" : 1,
    "index_patterns" : [
      "*"
    ],
    "settings" : {
      "index" : {
        "number_of_shards" : "1",
        "number_of_replicas" : "1"
      }
    },
    "mappings" : { },
    "aliases" : { }
  }
}

#数字字符串被映射成text，日期字符串被映射成日期
PUT ttemplate/_doc/1
{
	"someNumber":"1",
	"someDate":"2019/01/01"
}
GET ttemplate/_mapping

#返回如下：
{
  "ttemplate" : {
    "mappings" : {
      "properties" : {
        "someDate" : {
          "type" : "date",
          "format" : "yyyy/MM/dd HH:mm:ss||yyyy/MM/dd||epoch_millis"
        },
        "someNumber" : {
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

#写入新的数据，index以test开头
PUT testtemplate/_doc/1
{
	"someNumber":"1",
	"someDate":"2019/01/01"
}
GET testtemplate/_mapping

#返回如下：
{
  "testtemplate" : {
    "mappings" : {
      "date_detection" : false,
      "numeric_detection" : true,
      "properties" : {
        "someDate" : { #可以看到这里并没有命中字段类型日期匹配
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "someNumber" : {
          "type" : "long"
        }
      }
    }
  }
}


get testtemplate/_settings

#返回如下：
{
  "testtemplate" : {
    "settings" : {
      "index" : {
        "creation_date" : "1646703465756",
        "number_of_shards" : "1",
        "number_of_replicas" : "2",
        "uuid" : "wLIqiv5VToSVKctGSbT1Kg",
        "version" : {
          "created" : "7010099"
        },
        "provided_name" : "testtemplate"
      }
    }
  }
}


PUT testmy
{
	"settings":{
		"number_of_replicas":5
	}
}

put testmy/_doc/1
{
  "key":"value"
}

get testmy/_settings

#返回如下
{
  "testmy" : {
    "settings" : {
      "index" : {
        "creation_date" : "1646703533380",
        "number_of_shards" : "1",
        "number_of_replicas" : "5", #可以看到模板被覆盖
        "uuid" : "EAS7QZZtSTGcYSN-8MlEEA",
        "version" : {
          "created" : "7010099"
        },
        "provided_name" : "testmy"
      }
    }
  }
}

```

## Dynamic Template

根据 Elasticsearch 识别的数据类型，结合字段名称，来动态设定字段类型。

> 比如所有字符串类型都被设定为 Keyword，is 开头的字段都设置成 boolean。

这里需要注意的是：

- DynamicTemplate 是定义在某个索引的 mapping 中
- Template 有一个名称
- 匹配规则是一个数组
- 为匹配到字段设置 Mapping


```json
PUT my_index/_doc/1
{
  "firstName":"Ruan",
  "isVIP":"true"
}

GET my_index/_mapping

#返回如下
{
  "my_index" : {
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
        "isVIP" : {
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

DELETE my_index
PUT my_index
{
  "mappings": {
    "dynamic_templates": [
        {
        "strings_as_boolean": {
          "match_mapping_type":   "string",
          "match":"is*",
          "mapping": {
            "type": "boolean"
          }
        }
      },
      {
        "strings_as_keywords": {
          "match_mapping_type":   "string",
          "mapping": {
            "type": "keyword"
          }
        }
      }
    ]
  }
}

PUT my_index/_doc/1
{
  "firstName":"Ruan",
  "isVIP":"true"
}



# GET my_index/_mapping

#返回如下：
{
  "my_index" : {
    "mappings" : {
      "dynamic_templates" : [
        {
          "strings_as_boolean" : {
            "match" : "is*",
            "match_mapping_type" : "string",
            "mapping" : {
              "type" : "boolean"
            }
          }
        },
        {
          "strings_as_keywords" : {
            "match_mapping_type" : "string",
            "mapping" : {
              "type" : "keyword"
            }
          }
        }
      ],
      "properties" : {
        "firstName" : {
          "type" : "keyword"
        },
        "isVIP" : {
          "type" : "boolean"
        }
      }
    }
  }
}

DELETE my_index
#结合路径
PUT my_index
{
  "mappings": {
    "dynamic_templates": [
      {
        "full_name": {
          "path_match":   "name.*",
          "path_unmatch": "*.middle",
          "mapping": {
            "type":       "text",
            "copy_to":    "full_name"
          }
        }
      }
    ]
  }
}


PUT my_index/_doc/1
{
  "name": {
    "first":  "John",
    "middle": "Winston",
    "last":   "Lennon"
  }
}

GET my_index/_search?q=full_name:John

#返回如下：
{
  "took" : 92,
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
        "_index" : "my_index",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.2876821,
        "_source" : {
          "name" : {
            "first" : "John",
            "middle" : "Winston",
            "last" : "Lennon"
          }
        }
      }
    ]
  }
}   
```

## 参考

https://time.geekbang.org/course/intro/100030501?tab=catalog
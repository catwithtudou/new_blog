# ElasticSearch聚合简介

## 简介

聚合是 Elasticsearch 除搜索以外，**提供的针对 ES 数据进行统计分析功能**。通过聚合，我们可以得到**数据的概览，是分析和总结全套的数据**，而不是寻找单个文档。

Elasticsearch 的主要优点就是：

- **实时性高**，和 Hadoop 相比会更快
- **性能高**，可直接通过提供的API就能得到分析结果

![](https://img.zhengyua.cn/img/202203081024738.png)

## 聚合的分类

集合的分类主要有以下：

- **Bucket Aggregation**：一些列满足特定条件的文档的集合
- **Metric Aggregation**：一些数学运算，可以对文档字段进行统计分析
- **Pipeline Aggregation**：对其他的聚合结果进行二次聚合
- **Matrix Aggregation**：支持对多个字段的操作并提取一个结果矩阵

### Bucket&Metric

与SQL进行比较：

SELECT COUNT(brand) => Metric：一些系列的统计方法
FROM cars
GROUP by band => Bucket：一组满足条件的文档

```json
#价格统计信息+天气信息
GET kibana_sample_data_flights/_search
{
  "size": 0,
  "aggs":{
    "flight_dest":{
      "terms":{
        "field":"DestCountry"
      },
      "aggs":{
        "stats_price":{
          "stats":{
            "field":"AvgTicketPrice"
          }
        },
        "wather":{
          "terms": {
            "field": "DestWeather",
            "size": 5
          }
        }

      }
    }
  }
}


#返回如下：
{
  "took" : 5,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10000,
      "relation" : "gte"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "flight_dest" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 3187,
      "buckets" : [
        {
          "key" : "IT",
          "doc_count" : 2371,
          "max_price" : {
            "value" : 1195.3363037109375
          },
          "min_price" : {
            "value" : 100.57646942138672
          },
          "avg_price" : {
            "value" : 586.9627099618385
          }
        },
        {
          "key" : "US",
          "doc_count" : 1987,
          "max_price" : {
            "value" : 1199.72900390625
          },
          "min_price" : {
            "value" : 100.14596557617188
          },
          "avg_price" : {
            "value" : 595.7743908825026
          }
        },
        {
          "key" : "CN",
          "doc_count" : 1096,
          "max_price" : {
            "value" : 1198.4901123046875
          },
          "min_price" : {
            "value" : 102.90382385253906
          },
          "avg_price" : {
            "value" : 640.7101617033464
          }
        },
        {
          "key" : "CA",
          "doc_count" : 944,
          "max_price" : {
            "value" : 1198.8525390625
          },
          "min_price" : {
            "value" : 100.5572509765625
          },
          "avg_price" : {
            "value" : 648.7471090413757
          }
        },
        {
          "key" : "JP",
          "doc_count" : 774,
          "max_price" : {
            "value" : 1199.4913330078125
          },
          "min_price" : {
            "value" : 103.97209930419922
          },
          "avg_price" : {
            "value" : 650.9203447346847
          }
        },
        {
          "key" : "RU",
          "doc_count" : 739,
          "max_price" : {
            "value" : 1196.7423095703125
          },
          "min_price" : {
            "value" : 101.0040054321289
          },
          "avg_price" : {
            "value" : 662.9949632162009
          }
        },
        {
          "key" : "CH",
          "doc_count" : 691,
          "max_price" : {
            "value" : 1196.496826171875
          },
          "min_price" : {
            "value" : 101.3473129272461
          },
          "avg_price" : {
            "value" : 575.1067587028537
          }
        },
        {
          "key" : "GB",
          "doc_count" : 449,
          "max_price" : {
            "value" : 1197.78564453125
          },
          "min_price" : {
            "value" : 111.34574890136719
          },
          "avg_price" : {
            "value" : 650.5326856005696
          }
        },
        {
          "key" : "AU",
          "doc_count" : 416,
          "max_price" : {
            "value" : 1197.6326904296875
          },
          "min_price" : {
            "value" : 102.2943115234375
          },
          "avg_price" : {
            "value" : 669.5588319668403
          }
        },
        {
          "key" : "PL",
          "doc_count" : 405,
          "max_price" : {
            "value" : 1185.43701171875
          },
          "min_price" : {
            "value" : 104.28328704833984
          },
          "avg_price" : {
            "value" : 662.4497233072917
          }
        }
      ]
    }
  }
}

```

#### Bucket

Elasticsearch **提供了很多类型的 Bucket，可以多种方式划分文档**:

- Term&Range：时间/年龄区间/地理位置等

> 比如下面这些例子：
>
> - 杭州属于浙江/一个演员属于男或女性
> - 嵌套关系 - 杭州属于浙江属于中国属于亚洲


```json
#按照目的地进行分桶统计
GET kibana_sample_data_flights/_search
{
    "size": 0,
    "aggs":{
        "flight_dest":{
            "terms":{
                "field":"DestCountry"
            }
        }
    }
}

#返回如下：
{
  "took" : 33,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10000,
      "relation" : "gte"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "flight_dest" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 3187,
      "buckets" : [
        {
          "key" : "IT",
          "doc_count" : 2371
        },
        {
          "key" : "US",
          "doc_count" : 1987
        },
        {
          "key" : "CN",
          "doc_count" : 1096
        },
        {
          "key" : "CA",
          "doc_count" : 944
        },
        {
          "key" : "JP",
          "doc_count" : 774
        },
        {
          "key" : "RU",
          "doc_count" : 739
        },
        {
          "key" : "CH",
          "doc_count" : 691
        },
        {
          "key" : "GB",
          "doc_count" : 449
        },
        {
          "key" : "AU",
          "doc_count" : 416
        },
        {
          "key" : "PL",
          "doc_count" : 405
        }
      ]
    }
  }
}

```

#### Metric

Metric 会**基于数据集计算结果，除了支持在字段上进行计算，同样支持在脚本（painless script）产生的结果之上进行计算**：

- 大部分 Metric 是数学计算，仅输出一个值
  - min/max/sum/avg/cardinality
- 部分 metric 支持输出多个数值
  - stats/percentiles/percentile_ranks


```json
#查看航班目的地的统计信息，增加平均，最高最低价格
GET kibana_sample_data_flights/_search
{
  "size": 0,
  "aggs":{
    "flight_dest":{
      "terms":{
        "field":"DestCountry"
      },
      "aggs":{
        "avg_price":{
          "avg":{
            "field":"AvgTicketPrice"
          }
        },
        "max_price":{
          "max":{
            "field":"AvgTicketPrice"
          }
        },
        "min_price":{
          "min":{
            "field":"AvgTicketPrice"
          }
        }
      }
    }
  }
}

#返回如下：
{
  "took" : 5,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10000,
      "relation" : "gte"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "flight_dest" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 3187,
      "buckets" : [
        {
          "key" : "IT",
          "doc_count" : 2371,
          "max_price" : {
            "value" : 1195.3363037109375
          },
          "min_price" : {
            "value" : 100.57646942138672
          },
          "avg_price" : {
            "value" : 586.9627099618385
          }
        },
        {
          "key" : "US",
          "doc_count" : 1987,
          "max_price" : {
            "value" : 1199.72900390625
          },
          "min_price" : {
            "value" : 100.14596557617188
          },
          "avg_price" : {
            "value" : 595.7743908825026
          }
        },
        {
          "key" : "CN",
          "doc_count" : 1096,
          "max_price" : {
            "value" : 1198.4901123046875
          },
          "min_price" : {
            "value" : 102.90382385253906
          },
          "avg_price" : {
            "value" : 640.7101617033464
          }
        },
        {
          "key" : "CA",
          "doc_count" : 944,
          "max_price" : {
            "value" : 1198.8525390625
          },
          "min_price" : {
            "value" : 100.5572509765625
          },
          "avg_price" : {
            "value" : 648.7471090413757
          }
        },
        {
          "key" : "JP",
          "doc_count" : 774,
          "max_price" : {
            "value" : 1199.4913330078125
          },
          "min_price" : {
            "value" : 103.97209930419922
          },
          "avg_price" : {
            "value" : 650.9203447346847
          }
        },
        {
          "key" : "RU",
          "doc_count" : 739,
          "max_price" : {
            "value" : 1196.7423095703125
          },
          "min_price" : {
            "value" : 101.0040054321289
          },
          "avg_price" : {
            "value" : 662.9949632162009
          }
        },
        {
          "key" : "CH",
          "doc_count" : 691,
          "max_price" : {
            "value" : 1196.496826171875
          },
          "min_price" : {
            "value" : 101.3473129272461
          },
          "avg_price" : {
            "value" : 575.1067587028537
          }
        },
        {
          "key" : "GB",
          "doc_count" : 449,
          "max_price" : {
            "value" : 1197.78564453125
          },
          "min_price" : {
            "value" : 111.34574890136719
          },
          "avg_price" : {
            "value" : 650.5326856005696
          }
        },
        {
          "key" : "AU",
          "doc_count" : 416,
          "max_price" : {
            "value" : 1197.6326904296875
          },
          "min_price" : {
            "value" : 102.2943115234375
          },
          "avg_price" : {
            "value" : 669.5588319668403
          }
        },
        {
          "key" : "PL",
          "doc_count" : 405,
          "max_price" : {
            "value" : 1185.43701171875
          },
          "min_price" : {
            "value" : 104.28328704833984
          },
          "avg_price" : {
            "value" : 662.4497233072917
          }
        }
      ]
    }
  }
}


```

## 参考

https://time.geekbang.org/course/intro/100030501?tab=catalog
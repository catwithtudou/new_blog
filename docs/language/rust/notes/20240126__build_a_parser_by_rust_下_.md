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

# Json 标准

> Json（JavaScript Object Notation）是一种轻量级的数据交换格式。它采用易于阅读的文本形式表示数据，对人类来说易于阅读和编写。Json 格式由键值对组成，使用了类似于 JavaScript 对象的语法，因此得名 JavaScript Object Notation。Json 格式通常用于在网络传输数据、存储配置信息、以及在不同系统之间交换数据。它在 Web 开发中非常常见，例如用于 API 的数据传输、前后端数据交互等。Json 也被广泛应用于移动应用开发、大数据处理等领域。由于 Json 格式简单易用且易于阅读，因此它非常常见，并且成为了许多应用程序中数据交换的标准格式之一。

若我们想要实现 Json 解析器，我们首先需要了解 [Json 标准协议](https://www.json.org/json-zh.html)，可看到标准中主要拆分为以下 6 个部分：

| Json 标注      | 描述                                                         | 具体定义                                                     |
| :------------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| 空白whitespace | 空白（whitespace）可以插入在任何一对标记之间                 | ![img](https://jih9axn4gg.feishu.cn/space/api/box/stream/download/asynccode/?code=ZGU2ZWJjYzM3MmYyYWQ4YTNlOGIxNTQ3ZTFhZjY2ZDVfZWJCMGpsaWhRSDJudzBRa0FZWTBON3lnQXlnS1pZZVdfVG9rZW46Q3dWTGIzRlA4b2FHc1p4QW1FZGMzYzBsbmFlXzE3MDYzMDkzNjA6MTcwNjMxMjk2MF9WNA) |
| 数值number     | 数值（number）非常类似于 C 或 Java 数字，只是不使用八进制和十六进制格式 | ![img](https://jih9axn4gg.feishu.cn/space/api/box/stream/download/asynccode/?code=OWE3M2U2Y2NlMTAyMzIwMGZkZTMxOTY2M2E4ZDliMDZfY0JmbXlpV1dZeVJPeUtNOVFodjFCMzhoNXBFVWtkYWpfVG9rZW46T0xyMWJkenl0bzVHM3F4alo0WmNRRVZqbkpmXzE3MDYzMDkzNjA6MTcwNjMxMjk2MF9WNA) |
| 字符串string   | 一个字符串（string）是由用双引号括起来的零个或多个 Unicode 字符组成的序列，使用反斜杠转义。一个字符（character）即一个单独的字符串（character string） | ![img](https://jih9axn4gg.feishu.cn/space/api/box/stream/download/asynccode/?code=MmE2OGJmMGM5NjU3OGY4M2U1YWNkZGU5MWViZDUyMWJfT2FTeHNUekY2cGpQTVVLSzFnb25tMHNhTENLQlQ1QTNfVG9rZW46TXNQZGJJWExRb0ZPdjB4U2NVMWM0YzlxbnVkXzE3MDYzMDkzNjA6MTcwNjMxMjk2MF9WNA) |
| 值value        | 值（value）可以是双引号括起来的字符串（string）、数值(number)、true、false、 null、对象（object）或者数组（array）。并且这些结构可以嵌套 | ![img](https://jih9axn4gg.feishu.cn/space/api/box/stream/download/asynccode/?code=Y2E2MWZkZmMxYTIyNGM3ZDM2Y2M3YjI5ODA3YTcxOTZfanZ6em1oOFlNTHRjY3FwSmJkNXd0ajk2NXRFUnhYaHlfVG9rZW46REZGOWJSdXVzb2VYRGR4enlvWWNOQlhBbmpmXzE3MDYzMDkzNjA6MTcwNjMxMjk2MF9WNA) |
| 数组array      | 数组（array）是值（value）的有序集合。一个数组以左中括号`[`开始且以右中括号`]`结束，值之间使用逗号`,`分隔 | ![img](https://jih9axn4gg.feishu.cn/space/api/box/stream/download/asynccode/?code=MGE1NDljZTRiZmNmYjZhNjNhZDZlYjcxYjZiYWUxZTJfdXRBaXFjc0VTckR1NXhiSDdpWE1GOUwyNW5oOGIzU3hfVG9rZW46TUdxMWJ0R01vb0NEZUl4czMyTWNOWXlzbkFmXzE3MDYzMDkzNjA6MTcwNjMxMjk2MF9WNA) |
| 对象object     | 对象（object）是一个无序的名称/值对集合。一个对象以左括号`{`开始，右括号`}`结束。每个名称后跟一个冒号`:` ，且名称/值对之间使用逗号`,`分隔 | ![img](https://jih9axn4gg.feishu.cn/space/api/box/stream/download/asynccode/?code=MzhlMGExNjJjM2NkM2ZjYTUxOWY2ODllMmZiZDk4MDZfVmVobDZTRzNNT3p2NkZnaXBhRldYc0VoRUhYaVpoU0lfVG9rZW46RzJZRWJhYTE5b0o0SmZ4bGtGY2NWM3RtbjdjXzE3MDYzMDkzNjA6MTcwNjMxMjk2MF9WNA) |


可以看到在 [Json 标准协议](https://www.json.org/json-zh.html) 中，其**数据类型的定义和具体解析情况都非常清晰和较为简单**。

下面会根据其标准，分别通过前面了解到的 nom 和 pest 简单实现，具体代码路径在 [nom/json](https://github.com/catwithtudou/parser_toy/tree/main/src/nom/json) 和 [pest/json](https://github.com/catwithtudou/parser_toy/tree/main/src/pest/json) 中。

# 基于 nom 实现

## Json Model

这里我们**使用一个枚举**来代表除空白外的 **Json Value**：

```Rust
#[derive(Debug, PartialEq)]
pub enum JsonValue {
    Str(String),
    Boolean(bool),
    Num(f64),
    Array(Vec<JsonValue>),
    Object(HashMap<String, JsonValue>),
    Null,
}
```

## 具体类型解析

1. **空白**

从前面中可看到**空白元素分为以下情况的任意一个**，处理时会消耗输入直至遇到其他元素，最终得到 whitespace：

-  space->`" "`
- linefeed->`"\n"`
- carriage return->`"\r"`
- horizontal tab->`"\t"`

这里 nom 有两种实现方式，一种可直接使用内置函数`multispace0`，一种是利用`take_while`构建解析函数：

> 前文可了解到`take_while`作为谓词解析器持续消耗输入，直到其输入不满足谓词。

```Rust
// whitespace Json 空格解析（等价于 nom 内置函数 multispace0）
fn whitespace(i: &str) -> IResult<&str, &str> {
    let chars = " \t\r\n";
    take_while(move |c| chars.contains(c))(i)
}
```

1. **数值**

从前面可以看到对于数值，Json 是支持正负数、小数和科学计数法，虽然我们可以通过`alt`和`be_f64`等解析器子组合进行解析，但是考虑到此场景更常用的是**使用 nom 提供的内置函数** **`double`**，其使用方式可参考示例：

```Rust
use nom::number::complete::double;

let parser = |s| {
  double(s)
};

assert_eq!(parser("1.1"), Ok(("", 1.1)));
assert_eq!(parser("123E-02"), Ok(("", 1.23)));
assert_eq!(parser("123K-01"), Ok(("K-01", 123.0)));
assert_eq!(parser("abc"), Err(Err::Error(("abc", ErrorKind::Float))));
```

1. **字符串**

这里我们需要分别讨论字符串和两边引号中的字符串的情况：

- 首先可看到在字符串中，在左引号右边有三种情况，除了引号之间为空白的空字符情况外，**其余情况可通过组合器来去掉两边引号，获取到两边引号中的字符串的内容**，其中组合器的使用方式有很多种，这里列举出常见的两种使用思路：
    - `alt`+`delimited`：按**字符整体结构的思路**去解析
    - `preceded`+`cut`+`terminated`：按**字符顺序的思路**去解析

```Rust
// string 整个字符串解析
fn string(i: &str) -> IResult<&str, &str> {
    context(
        "string",
        preceded(char('\"'), cut(terminated(parse_str, char('\"')))))(i)
        // parse_str 后续会描述其实现
}
fn string(i: &str) -> IResult<&str, &str> {
    context(
        "string",
        alt((tag("\"\""), delimited(tag("\""), parse_str, tag("\"")))),
    )(i)
}
```

> 其中`cut`组合器的的作用是阻止回溯（backtracking），它会在解析失败时立即停止解析，而不会尝试其他可能的解析路径。这对于避免不必要的性能开销和解析错误非常有用。这里给出官方的示例方便理解：
>
> ```Rust
> use nom::combinator::cut;
> 
> fn parser(input: &str) -> IResult<&str, &str> {
>   alt((
>     preceded(one_of("+-"), cut(digit1)),
>     rest
>   ))(input)
> }
> 
> assert_eq!(parser("+10 ab"), Ok((" ab", "10")));
> assert_eq!(parser("ab"), Ok(("", "ab")));
> assert_eq!(parser("+"), Err(Err::Failure(Error { input: "", code: ErrorKind::Digit })));
> ```

- 然后获取到引号中的字符串后，我们需要**处理转义字符才能获取到实际内容**，目前 nom 内置提供了**专门处理转义字符的** **`escaped`** **函数**，该函数入参为 `escaped(normal, control, escapable)`，其参数分别表示：
    - `normal` ：用于匹配普通字符解析器，但无法接受含有控制符的字符
    - `control`：控制字符（例如在大多数语言中使用的`\`）
    - `escapable`：可匹配的转义字符

```Rust
// 官方示例
use nom::bytes::complete::escaped;
use nom::character::complete::one_of;

fn esc(s: &str) -> IResult<&str, &str> {
  // digit1:即内置解析器函数，表示匹配至少一个数字
  // '\\':表示反斜杠字符'\'
  // r#""n\"#:通过「r#"{构造原始字符串字面量的字符串内容}"#」，这里表示可匹配的转义字符有 "、n、\
  escaped(digit1, '\\', one_of(r#""n\"#))(s)
}

assert_eq!(esc("123;"), Ok((";", "123")));
assert_eq!(esc(r#"12\"34;"#), Ok((";", r#"12\"34"#)));
```

- 最后根据`escaped`函数和 Json 标准构造`parse_str`函数，其中在此场景填写的三个参数的意思分别为：
    - `normal`：匹配"Any codepoint except " or \ or control characters"
    - `'\\'`：Json 中的转义字符同样也是反斜杠字符
    - `escapable`：匹配标准描述中的`",\,/,b`等，需要注意十六进制数字也需要单独处理
        - 这里特别说明一下十六进制处理使用到的`peek`内置函数即解析后不消耗输入，使后面解析正常

```Rust
// parse_str 单独字符串解析
fn parse_str(i: &str) -> IResult<&str, &str> {
    escaped(normal, '\\', escapable)(i)
}

// normal 普通字符解析
fn normal(i: &str) -> IResult<&str, &str> {
    take_till1(|c: char| c == '\\' || c == '"' || c.is_ascii_control())(i)
}

// escapable 转义字符解析
fn escapable(i: &str) -> IResult<&str, &str> {
    context(
        "escaped",
        alt((
            tag("\""),
            tag("\\"),
            tag("/"),
            tag("b"),
            tag("f"),
            tag("n"),
            tag("r"),
            tag("t"),
            hex
        )))(i)
}

// hex  十六进制字符解析
fn hex(i: &str) -> IResult<&str, &str> {
    context(
        "hex",
        preceded(
            peek(tag("u")),
            take_while_m_n(5, 5, |c: char| c.is_ascii_hexdigit() || c == 'u'),
        ))(i)
}
```

1. **值**

前面已经实现了空白、数字、字符串的解析器，下面我们先完成**基本类型 boolean 和 null：**

```Rust
// boolean 布尔数据类型解析
fn boolean(i: &str) -> IResult<&str, bool> {
    alt((
        value(true, tag("true")),
        value(false, tag("false"))
    ))(i)
}

// null Null解析
fn null(i: &str) -> IResult<&str, JsonValue> {
    map(tag("null"), |_| JsonValue::Null)(i)
}
```

目前根据实现好的类型解析器，我们可以**构造出值的解析器（复合类型后面实现）**：

> 下面实现中有一个可能比较难理解的语法，这里简单说明下：
>
> - `map`函数的入参类型分别是 nom parser trait 和闭包函数*`FnMut`*`(O1) -> O2`
> - 这里我们可以利用枚举类型的元素的构造函数本身就是如上的匿名函数，所以可直接使用

```Rust
// json_value JsonValue 解析
fn json_value(i: &str) -> IResult<&str, JsonValue> {
    context(
        "json value",
        delimited(
            whitespace,
            alt((
                map(string, |s| JsonValue::Str(String::from(s))),
                map(double, JsonValue::Num),
                map(boolean, JsonValue::Boolean),
                null,
                map(array, JsonValue::Array),
                map(object, JsonValue::Object)
            )),
            whitespace,
        ),
    )(i)
}
```

1. **数组**

根据数组的标准描述：

- 首先使用`delimited`来去掉左右方括号后，方便解析之间的内容
- 利用**内置函数** **`separated_list0`** **来解析括号包含内容得到数组** **`Vec<JsonValue>`**：

```Rust
// array 数组解析
fn array(i: &str) -> IResult<&str, Vec<JsonValue>> {
    context(
        "array",
        delimited(
            tag("["),
            separated_list0(tag(","), delimited(whitespace, json_value, whitespace)),
            tag("]"),
        ),
    )(i)
}
```

1. **对象**

对于像对象这样复杂的解析器，通过组合器解析器的思想，我们可**通过拆分子解析器的方式**来分别实现：

- 首先针对对象中的**名称/值对的格式**进行解析，使用`separated_pair`+`preceded`的组合：

```Rust
// key_value kv格式解析
fn key_value(i: &str) -> IResult<&str, (&str, JsonValue)> {
    separated_pair(preceded(whitespace, string), cut(preceded(whitespace, char(':'))), json_value)(i)
}
```

- 然后针对**对象的整体结构**，其解析思路为：
    - 左括号->括号中内容->按（前面已实现的）键值对格式解析构造数组->数组转换为HashMap 的类型->右括号

```Rust
// object 对象格式解析
fn object(i: &str) -> IResult<&str, HashMap<String, JsonValue>> {
    context(
        "object",
        preceded(
            char('{'),
            cut(terminated(
                map(
                    separated_list0(preceded(whitespace, char(',')), key_value),
                    |tuple_vec| {
                        tuple_vec.into_iter().map(|(k, v)| (String::from(k), v)).collect()
                    },
                ),
                preceded(whitespace, char('}')),
            )),
        ),
    )(i)
}
```

## 顶层解析函数

前面我们已实现 Json 标准中所有的标注类型，最后我们只需要构造顶层的函数来使用该解析器。

这里 Json 的最外层结果允许要么是对象，要么是数组，所以我们的顶层函数为：

```Rust
fn root(i: &str) -> IResult<&str, JsonValue> {
    delimited(
        whitespace,
        alt((
            map(object, JsonValue::Object),
            map(array, JsonValue::Array),
        )),
        opt(whitespace),
    )(i)
}
```

最后你可运行下面测试函数来看看最终的返回结果是否正常：

```Rust
#[cfg(test)]
mod test_json {
    use crate::nom::json::json::root;

    #[test]
    fn test_parse_json() {
        let data = "  { \"a\"\t: 42,
  \"b\": [ \"x\", \"y\", 12 ] ,
  \"c\": { \"hello\" : \"world\"}
  } ";
        println!("will try to parse valid JSON data:\n\n**********\n{}\n**********\n", data);
        //
        // will try to parse valid JSON data:
        //
        //     **********
        // { "a" : 42,
        //     "b": [ "x", "y", 12 ] ,
        //     "c": { "hello" : "world"}
        // }
        // **********


        println!(
            "parsing a valid file:\n{:#?}\n",
            root(data)
        );
        // parsing a valid file:
        //     Ok(
        //         (
        // "",
        // Object(
        //     {
        //         "c": Object(
        //         {
        //             "hello": Str(
        //             "world",
        //             ),
        //         },
        //         ),
        //         "b": Array(
        //             [
        //                 Str(
        //         "x",
        //         ),
        //         Str(
        //             "y",
        //         ),
        //         Num(
        //             12.0,
        //         ),
        //         ],
        //         ),
        //         "a": Num(
        //         42.0,
        //         ),
        //     },
        // ),
        // ),
        // )
    }
}
```

至此通过 nom 实现的 Json 解析器就完成了。这里没有进行具体的性能测试，感兴趣的同学可以压测一下。

# 基于 pest 实现

## Json Model

与 nom 前面的实现类似，这里用**一个枚举**来构建除空白外的 **Json Value**

```Rust
#[derive(Debug, PartialEq)]
pub enum JsonValue<'a> {  
    Number(f64),
    String(&'a str),
    Boolean(bool),
    Array(Vec<JsonValue<'a>>),
    Object(Vec<(&'a str, JsonValue<'a>)>),
    Null,
}
```

实际上**也不一定要声明生命周期**，可直接使用 String，声明的原因是引入了`&str`，这样可省去后面类型转换处理。

考虑到后面 Json 解析后得到的 JsonValue 更好地展示和处理，这里增加一个**针对 JsonValue 的序列化器**：

```Rust
pub fn serialize_json_value(val: &JsonValue) -> String {
    use JsonValue::*; // 方便后续枚举

    match val {
        Number(n) => format!("{}", n),
        String(s) => format!("\"{}\"", s),
        Boolean(b) => format!("{}", b),
        Array(a) => {
            let contents: Vec<_> = a.iter().map(serialize_json_value).collect();
            format!("[{}]", contents.join(","))
        }
        Object(o) => {
            let contents: Vec<_> = o
                .iter()
                .map(|(key, value)| format!("\"{}\":{}", key, serialize_json_value(value)))
                .collect();
            format!("{{{}}}", contents.join(","))
        }
        Null => "null".to_string(),
    }
}
```

其中需要注意，在处理数组和对象复合类型时，需要**进行递归**才能拿到复合类型下的具体值。

## Pest  Grammar 解析

这里我们新建`json.pest`来用 Pest Grammar 来编写我们需要解析的 Json 标准。

1. **空白**

根据标准提到的描述，通过可选择操作符`|`实现：

```TypeScript
WHITESPACE = _{ " " | "\t" | "\r" | "\n" }
```

这里有几个的语法特殊处理需要前置说明下：

- 若规则加上前缀`_`则代表创建了一个静默规则，与普通规则不同的是，在解析过程中**不会产生  token pairs 同时也不会上报错误，最终只会获取到最外层的一对 token pair**
- 在 pest 中若单独定义`WHITESPACE`，则它会被**隐式地插入到每个 sequence 或 repetition 之间（除原子规则）**
    - 这里的提到的“除原子规则外”需要注意，后面会有规则关联到这个信息
    - 类似的隐式约定还有`COMMENT`规则，都是 pest 对于字符内容中隐含空白场景的考虑处理

综上可知，后续文件中**除原子规则外的所有 sequence 或 repetition 之间解析时都会忽略空白**

1. **数值**

根据标准描述，通过序列运算符`~`来加入表达式不同的解析条件，且可利用 pest 中对数字相关的内置规则：

```TypeScript
// 2. number
number = @{
    "-"?
    ~ ("0" | ASCII_NONZERO_DIGIT ~ ASCII_DIGIT*)
    ~ ("." ~ ASCII_DIGIT*)?
    ~ (^"e" ~ ("+"|"-")? ~ ASCII_DIGIT+)?
}
```

这里同样存在语法的特殊处理需要解释下，方便大家理解为什么要这么写：

- 若规则加上前缀`@`则代表创建了一个**原子规则**，其具有以下特性：
    - 不会生效前面提到的`WHITESPACE`处理，即**不会隐藏内部空白**，与`~`构造的 sequence 之间不会忽略字符
    - 在原子规则中，调用的**其他规则也会被视为原子规则**
    - 在原子规则中，**内部匹配的所有规则会被视为静默的**，即只能获取到最外层的整个规则的解析结果
- 在规则后缀加上运算符`?`、`*`、`+`，则分别表示**可匹配至多一个**，**匹配所有**，**匹配至少一个字符**
- 在规则前缀加上运算符`^`，则说明**不区分大小写**

1. **字符串**

根据标准描述，我们这里将字符串的解析结合三个规则来更清晰地说明：

```TypeScript
// 3. string
string = ${ "\"" ~ inner ~ "\"" }
inner = @{ char* }
char = {
    !( "\"" | "\\") ~ ANY
    | "\\" ~ ("\"" | "\\" | "/" | "b" | "f" | "n" | "r" | "t")
    | "\\" ~ ("u" ~ ASCII_HEX_DIGIT{4})
}
```

pest 没有像 nom 一样提供了内置针对转义字符的处理函数，所以我们需要在**解析时需要手动带上转义符号**。

这里解释下其中用到的语法特殊处理：

- 若规则加上前缀`$`则代表创建了一个**复合原子规则**，与前面原子规则类似但也有区别需注意，其具有以下特性：
    - 同样不会生效前面提到的`WHITESPACE`处理
    - 在复合原子规则中，不存在将**其他规则视为原子规则和内部匹配规则视为静默的处理**，其他均与普通规则类似
-  `!(...) ~ ANY`代表匹配**除了括号中给出的字符之外**的任何字符

1. **值**

与之前实现值类似，我们先完成**基本类型 boolean 和 null**

```TypeScript
// 4. boolean
boolean = {"true" | "false"}
// 5. null
null = {"null"}
```

**结合各数据类型的解析规则构造值**，考虑到后续不关心值中不同规则的解析过程，**所以标记** **`_`** **静默规则减少嵌套**：

```TypeScript
value = _{ number | string | boolean | array | object | null}
```

其中数组和对象我们下面描述。

1. **数组**

根据标准描述，这里将空数组和有值数组分开，**通过** **`~`** **和** **`\*`** **来表示可能会存在的多个值**：

```TypeScript
// 6. array
array = {
    "[" ~ "]"|
    "[" ~ value ~ ("," ~ value)* ~ "]"
}
```

1. **对象**

这里单独将对象值拆分成 pair 规则，**利用前面的字符串和值规则**，后面与数组类似处理，区分空对象和有值对象：

```TypeScript
// 7. object
object = {
    "{" ~ "}"|
    "{" ~ pair ~ ("," ~ pair)* ~ "}"
}
pair = { string ~ ":" ~ value }
```

1. **最终规则**

最后我们需要一个最终规则来表示整个 Json，而 Json 内容唯一合法的是**一个对象或数组**。

同时考虑到后续我们只需要**解析后的值本身，以及 EOI 规则**两个 token pairs，所以我们将规则标记为静默：

```TypeScript
// 9. json
json = _{ SOI ~ (object | array) ~ EOI}
```

至此我们需要编写的 pest 规则已经完成，下面就是根据规则生成的解析结构来生成 AST。

## AST 生成和解析

1. **定义 Pest 规则绑定的结构体**

pest 需要通过 **grammar** 宏来标记到 Rust 的结构体上：

```Rust
use pest::Parser;
use pest_derive::Parser;

#[derive(Parser)]
#[grammar = "pest/json/json.pest"] // 根据自己项目文件所定
pub struct JsonParser;
```

1. **构建 AST 生成函数**

通过绑定 pest 规则的 JsonParser，使用`pest::Parser` 的 parse 方法来**得到前面的 json 规则生成的 AST 结果**：

```Rust
pub fn root(content: &str) -> Result<JsonValue, Error<Rule>> {
    let json = JsonParser::parse(Rule::json, content)?.next().unwrap();
    // ......
}
```

由于 json 为静默规则只有**最终生成的 token pair 即** **`Pair<Rule>`** **类型**，所以只需要`next()`一次就可以了。

我们的目标是将 AST 解析得到最终的 JsonValue，所以我们还需要一个方法来解析这个`Pair<Rule>`。

1. **解析 AST 函数**

新增`parse_json_value`函数：

- 使用得到的 AST 结果，来对 JsonValue 中的各个类型，根据前面 **pest 的规则进行解析赋值**
- 其中对数组和对象复合类型的处理，需要通过**递归函数来搜索嵌套的值**
- 若匹配的 Rule 不是 JsonValue 中的类型，则直接报错退出

```Rust
pub fn parse_json_value(pair: Pair<Rule>) -> JsonValue {
    match pair.as_rule() {
        Rule::number => JsonValue::Number(pair.as_str().parse().unwrap()),
        Rule::string => JsonValue::String(pair.into_inner().next().unwrap().as_str()),
        Rule::boolean => JsonValue::Boolean(pair.as_str().parse().unwrap()),
        Rule::null => JsonValue::Null,
        Rule::array => JsonValue::Array(pair.into_inner().map(parse_json_value).collect()),
        Rule::object => JsonValue::Object(
            pair.into_inner()
                .map(|pair| {
                    let mut inner_rules = pair.into_inner();
                    let key = inner_rules
                        .next() // 得到 pair 规则
                        .unwrap()
                        .into_inner()
                        .next() // 得到 pair 规则的第一个 token pair 即 key
                        .unwrap()
                        .as_str();
                    let value = parse_json_value(inner_rules.next().unwrap());
                    (key, value)
                })
                .collect()
        ),
        _ => unreachable!()
    }
}
```

1. **最终顶层函数及函数测试**

根据上一步的解析函数，我们来**完善前面的顶层函数** **`root`**，得到最终的解析结果：

```Rust
pub fn root(content: &str) -> Result<JsonValue, Error<Rule>> {
    let json = JsonParser::parse(Rule::json, content)?.next().unwrap();
    Ok(parse_json_value(json))
}
```

最后可运行下面测试函数来验证解析的结果：

```Rust
#[cfg(test)]
mod test {
    use crate::pest::json::json::{JsonValue, root, serialize_json_value};

    #[test]
    fn test_parse_json_by_pest() {
        let data = "  { \"a\"\t: 42,
  \"b\": [ \"x\", \"y\", 12 ] ,
  \"c\": { \"hello\" : \"world\"}
  } ";
        println!("will try to parse valid JSON data:\n\n** ********\n{}\n**********\n", data);

        // will try to parse valid JSON data:
        //
        //     **********
        // { "a" : 42,
        //     "b": [ "x", "y", 12 ] ,
        //     "c": { "hello" : "world"}
        // }
        // **********


        let json_result: JsonValue = root(data).expect("unsuccessful JSON");

        println!("{}", serialize_json_value(&json_result))
        // {"a":42,"b":["x","y",12],"c":{"hello":"world"}}
    }
}
```

至此我们完成了基于 pest 实现的 Json 解析器。

# 总结

我们通过上文学到的 nom 和 pest 来实践构造了 Json 解析器。其中 nom 和 pest 都是较为经典的解析器库，基于不同的优秀的实现思路来完成解析器，能够满足大部分解析器库的相关诉求。

通过这两篇文章的阅读，相信大家已经能基本掌握，通过 Rust 解析器库来快速地构建自己的自定义解析器，摆脱了手撸解析器的痛点，同时在这个过程中，我们也了解到了 Parser、Parser Combinator、Json 标准等相关概念。

最后感谢各位的阅读，希望能够帮助到有想了解解析器或类似解析器需求的同学。

> 后续 repo 里面还会准备更新 Redis 协议的解析器，考虑篇幅就不放在这里了。

# 参考

https://zhuanlan.zhihu.com/p/146455601

https://github.com/rust-bakery/nom?tab=readme-ov-file

https://www.json.org/json-zh.html

https://pest.rs/book/examples/json.html
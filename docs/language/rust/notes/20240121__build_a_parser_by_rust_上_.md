# 🔬Build A Parser By Rust（上）

> 此文档内容为飞书文档复制过来作为搜索，存在内容格式不兼容情况，建议看原[飞书文档](https://jih9axn4gg.feishu.cn/wiki/WdxwwjNnbivzzXkZZwZcR5l7nPd?from=from_copylink)


# 背景

最近在跟着 [mbrubeck](https://github.com/mbrubeck) 大佬写的 [Robinson](https://github.com/mbrubeck/robinson) 学习用 Rust 来编写一个简单的浏览器引擎（后续写完我也会出一个文档来介绍下），在其过程中因为需要解析 html、css 等格式文件，所以你需要编写相关的解析器来完成。

而从 0 到 1 的手写解析器是**一件非常枯燥且容易出错的行为**，因为你不仅需要考虑其具体需要解析的协议规则，还需要考虑解析器的错误处理、拓展性、解析性能等，所以在文章中大佬也提到，建议后续可通过目前已有的类似 pest 等解析器三方库来优化。

回想在我日常的开发工作中，遇到需要构造解析器的场景较少，往往是，如果出现对解析某格式或协议的信息，如 Json、Csv 等，为了追求效率，直接使用找针对解析该格式或协议的三方库。但实际上并不是所有协议或格式都有别人写好的解析器，**特别是对于各种网络通信协议等，且写好的解析器也很难针对其定制化**，所以借助这个契机，正好学习**了解下解析器，及构造解析器的相关实践，方便后续有类似场景的使用。**

注意：

- 此篇文档不会重点深挖解析器和解析器库的相关原理，更多是对于「解析器入门的了解及其实践」
- 此系列文档分为上下两篇，上篇主要讲述解析器的了解和三方库的使用，下篇主要讲述具体的实践
- 此系列文档出现的源码可在 https://github.com/catwithtudou/parser_toy 查看

# 前置知识

下面会介绍一些关于解析器相关的前置背景知识，帮助了解后面的理解。

## Parser

这里提到的解析器（Parser）实际是更广泛的定义，通常是指把**某种格式的信息转换成某种数据结构**的组件。

就好比将某种某种格式的信息进行“解码”，抽象成有组织的数据结构信息，方便对信息的理解和处理加工。

> 举个🌰：此时有一段算数表达式的文本 "1 + 2"，期望通过程序能够计算出结果。
>
> 为了让程序能够识别算术表达式，可通过针对算法表达式的解析器，转换成 (left,op,right) 的结构体进行计算。

对于计算机领域来说，**在处理数据的过程中解析器必不可少，能够应用各种数据处理场景中**，比如较为常见的：

- 在底层编译器或解释器中的解析器，其主要作用就是将源码进行词法和语法的分析，提取出抽象语法树 AST
- 对于 Web 应用较多的数据交换格式 Json 的文本，可通过对应的解析器序列化需要的数据结构进行处理加工
- 其他如通过解析器解析网络通信协议、脚本语言、数据库语言等

## PEG

在介绍 PEG （解析表达文法）之前，我们这里可通过（假设）更为常见的正则表达式来进行方便理解。

正则表达式和 PEG 联系主要是都可在**处理字符文本时通过特定的语法对字符文本进行匹配和解析**，而不同点在于：

- 【语法方面】前者是使用一种特定语法来描述字符串的模式，通常用于处理简单的字符串匹配和搜索。而后者使用一种**更复杂的语法来描述语言结构**，通常用于处理复杂的语言解析和分析需求。
- 【应用领域】前者主要用于处理简单的文本处理需求，例如查找特定模式的文本或验证输入的格式。而后者主要用于**处理复杂的语言结构**，例如编程语言的语法分析和解释器的构建。

通过介绍，相信大家对于 PEG 有了简单的理解。

而为什么介绍 PEG，其原因就是因为**可通过 PEG 实现的工具（称为 Parser Generator）来实现定制的 Parser。**

接下来我们来简单正式介绍下 PEG 即 解析表达文法：

1. **PEG（解析表达文法）简介**

**解析表达文法**，简称**PEG**（英语：**P**arsing **E**xpression **G**rammar）：

- 是一种**分析型****形式文法**。在 04年由 Bryan Ford 推出，与20世纪70年代引入的[自顶向下的语法分析语言](https://zh.wikipedia.org/w/index.php?title=自顶向下的语法分析语言&action=edit&redlink=1)家族相关
- 作为描述语言结构的语法，相较于正则表达式可以处理更复杂的语言结构，因**递归性特点可描述无限嵌套的结构**
- 使用一种**简单而灵活的方式来定义语法规则**，该规则可以被用来解析输入字符串并生成语法树
- **易用性、正确性和性能**的优势且提供错误报告、可重用规则模板等功能，因此在解析和分析文本时被广泛使用

1. **PEG 应用简介**

PEG 的语法类似于编程语言，使用**操作符**和**规则**来描述语言结构：

- 操作符包括“|”（或）、“&”（与）、“?”（可选）等，规则则用于描述语言的具体结构

- 例如下面是一个简单的 PEG 规则，它描述了一个整数的语法：

    ```Plain
    int := [0-9]+
    ```

因为可以直接转换为高效的解析器代码，目前已有许多**底层使用** **PEG** **实现的解析器**，如 ANTLR、PEG.js 等。

## Parser Combinator

通过前面对 Parser 的了解，理解 Parser Combinator（解析器组合器）就比较容易了。

1. **Parser Combinator 的定义及思想**

简单来说 **Parser Combinator 就是组合各种解析器组件**而构建的组件。

Parser Combinator 的思路就比较符合软件工程，它是一种基于函数组合的方式来构建解析器的技术，通过**组合小的、可复用的、可测试的解析器组件**来构建复杂的解析器，这种方式可以使得解析器的构建更加灵活和可扩展，且大大提升了开发的效率和方便了后续的维护。

1. **Parser Combinator 和 Parser Generator**

Parser Combinator 实际上和前面提到的 Parser Generator 是平行的概念，这里举个例子：

- 如果我们把想要实现的解析器（如 Json Parser）看成一幢大楼的话
- 用 Parser Generator 构建则每次都几乎从零开始构建该大楼，大楼和大楼之间相似的部分（如门窗）无法复用
- 而用 Parser Combinator **就像搭乐高积木****即不****断构建小的，可复用****的、****可测试的组件**，然后用这些组件来构建大楼，如果我们要构建新的大楼时，之前创建的组件可以拿来使用，非常方便。同时当解析器出现问题时，可容易地定位到某个具体的组件，也方便后续的维护

1. **Parser Combinator 和基于 PEG 实现的 Parser Generator**

【表达方面】Parser Combinator 在表达能力上更加灵活，可以**直接使用编程语言的特性来组合和定义解析器**。而 PEG 实现的 Parser Generator 则是通过特定的语法规则来描述解析器，表达能力受到语法规则的限制，即你需要学会使用其  Parser Generator 本身接口外**还必须要掌握  PEG 的语法规则**。

【性能方面】Parser Combinator 和 Parser Generator 的性能对比取决于具体的实现和使用场景。但是一般从底层原理来说，Parser Generator 通常**会生成高效的解析器代码**，因此在处理大型语法和复杂输入时可能具有更好的性能。另一方面，Parser Combinator 通常会有一定的性能开销，因为它们是在**运行时动态组合解析器的**。

> 但目前在 Rust 中，基于 Parser Combinator 实现的 nom 和基于 PEG 实现的 pest，前者性能更高一些。

# Rust Praser Library

下面会介绍在 Rust 中用于实现解析器的经典三方库，分别是**基于 PEG 的 Pest 和 Paser Combinator 的 Nom。**

## pest

### 简介

> https://github.com/pest-parser/pest

Pest 是一个**使用 Rust 编写的通用解析器**，注重可访问性、正确性和性能。它使用前面提到的 **PEG 作为输入**，提供了解析复杂语言所需的增强表达能力，同时也以一种简洁、优雅的方式来定义和生成解析器方便构造自定义解析器。

其中还具有自动生成错误报告、通过 derive 属性自动生成实现解析器 trait、单个文件中可定义多个解析器等特性。

### 使用示例

1. **在 cargo.toml 引入 pest 依赖**

```TOML
[dependencies]
pest = "2.6"
pest_derive = "2.6"
```

1. **新建****`src/grammar.pest`****文件编写解析表达式语法**

这里语法表示 field 字段的解析规则，即每个字符都是 ASCII 数字且包含小数点和负号，`+`表示该模式可出现多次。

```TypeScript
field = { (ASCII_DIGIT | "." | "-")+ }
```

1. **新建****`src/parser.rs`****文件定义解析器**

下面代码通过定义一个结构体 Parser，通过派生宏绑定，（每次编译）自动实现满足语法文件中模式的解析器。

```Rust
use pest_derive::Parser;

#[derive(Parser)] 
#[grammar = "grammer.pest"]
pub struct Parser;

// 每当你编译这个文件时，pest 会自动使用 grammar 文件生成这样的项
#[cfg(test)]
mod test {
    use std::fs;

    use pest::Parser;
    
    use crate::{Parser, Rule};

    #[test]
    pub fn test_parse() {
        let successful_parse = Parser::parse(Rule::field, "-273.15");
        println!("{:?}", successful_parse);

        let unsuccessful_parse = Parser::parse(Rule::field, "China");
        println!("{:?}", unsuccessful_parse);
    }
}    
```

### 具体使用

> [官方文档](https://pest.rs/book/parser_api.html)

#### Parser API

pest 提供了多种访问成功解析结果的方法。下面按照以下语法示例来介绍其方法：

```TypeScript
number = { ASCII_DIGIT+ }                // one or more decimal digits
enclosed = { "(.." ~ number ~ "..)" }    // for instance, "(..1024..)"
sum = { number ~ " + " ~ number }        // for instance, "1024 + 12"
```

1. **Tokens**

pest 使用 tokens 表示成功，每当规则匹配时，会生成两个 tokens，分别表示匹配的开头 start 和结尾 start，如：

```TypeScript
"3130 abc"
 |   ^ end(number)
 ^ start(number)
```

> 目前 rustrover 有支持 pest 格式的插件，能够校验规则和查看 tokens 等功能。

1. **嵌套规则**

如果一个命名规则包含另一个命名规则，则均会为两者生成 tokens 生成如下将为两者，如：

```TypeScript
"(..6472..)"
 |  |   |  ^ end(enclosed)
 |  |   ^ end(number)
 |  ^ start(number)
 ^ start(enclosed)
```

同时某些场景下，标记可能不会出现在不同的字符位置：

```TypeScript
"1773 + 1362"
 |   |  |   ^ end(sum)
 |   |  |   ^ end(number)
 |   |  ^ start(number)
 |   ^ end(number)
 ^ start(number)
 ^ start(sum)
```

1. **interface**

token 会以 Token enum 形式暴露，该 enum 具有 Start 和 End 变体，可在解析结果上调用 tokens 来获取迭代器：

```Rust
let parse_result = DemoParser::parse(Rule::sum, "1773 + 1362").unwrap();
let tokens = parse_result.tokens();

for token in tokens {
    println!("{:?}", token);
}
```

![img](https://jih9axn4gg.feishu.cn/space/api/box/stream/download/asynccode/?code=NzNhNzVmNmY3NzI3Nzc2YzlmOTQ0MmZiZGZiMzI1ZmJfT1dhZ1ViZUF4TGMzWmExeDZyVUdLREtLY0tqZjJNVnhfVG9rZW46WGR4VGJSV3RobzNGS3h4SUF6NWNickw2bm5nXzE3MDU4MzEyODE6MTcwNTgzNDg4MV9WNA)

1. **Pairs**

若考虑匹配的标记对来探索解析树，则 pest 提供 Pair 类型来表示一对匹配的 tokens，使用方式主要如下：

- 确定哪个规则产生了 Pair
- 使用 Pair 作为原始 &str
- 检查生成 Pair 的内部命名规则

```Rust
let pair = DemoParser::parse(Rule::enclosed, "(..6472..) and more text")
    .unwrap().next().unwrap();

assert_eq!(pair.as_rule(), Rule::enclosed);
assert_eq!(pair.as_str(), "(..6472..)");

let inner_rules = pair.into_inner();
println!("{}", inner_rules); // --> [number(3, 7)]
```

Pair 可能有任意数量的内部规则，可通过 Pair::into_inner() 返回  Pairs 即每一对的迭代器：

```Rust
let pairs = DemoParser::parse(Rule::sum, "1773 + 1362")
    .unwrap().next().unwrap()
    .into_inner();

let numbers = pairs
    .clone()
    .map(|pair| str::parse(pair.as_str()).unwrap())
    .collect::<Vec<i32>>();
assert_eq!(vec![1773, 1362], numbers);

for (found, expected) in pairs.zip(vec!["1773", "1362"]) {
    assert_eq!(Rule::number, found.as_rule());
    assert_eq!(expected, found.as_str());
}
```

1. **Parse method**

派生的 Parser 提供了会返回 Result<Paris,Error> parse方法，若要访问底层解析树则需要 match 或 unwrap 结果：

```Rust
// check whether parse was successful
match Parser::parse(Rule::enclosed, "(..6472..)") {
    Ok(mut pairs) => {
        let enclosed = pairs.next().unwrap();
        // ...
    }
    Err(error) => {
        // ...
    }
}
```

#### 解析表达式语法

PEG 语法的基本逻辑实际上是非常简单和直接的，可以概括为三步：

- 尝试匹配规则
- 如果成功，就尝试下一步
- 如果失败，就尝试另外规则

其语法的特点主要有以下四点：

1. **Eagerness**

当在输入字符串上运行重复的 PEG 表达式时，它会贪婪地（尽可能多次）运行表达式，其结果有以下：

- 若匹配成功，则会消耗它所匹配的任何内容，并将剩余的输入传递到解析器的下一步
- 若匹配失败，则不消耗什么字符，且若该失败就会向上传播，最终导致解析失败，除非失败被传播中被捕获

```TypeScript
// 表达式
ASCII_DIGIT+      // one or more characters from '0' to '9'

// 匹配过程
"42 boxes"
 ^ Running ASCII_DIGIT+

"42 boxes"
   ^ Successfully took one or more digits!

" boxes"
 ^ Remaining unparsed input.
```

1. **Ordered choice**

语法中存在有序的选择操作符`|`，比如`one|two`则表示先尝试前者 one，若失败则尝试后者 two。

若有顺序的要求，则需要注意规则放置在表达式中的位置，比如：

- 表达式`"a"|"ab"`，在匹配字符串"abc"时，命中前面的规则`"a"`后，则不会解析后面的"bc"了

所以通常当编写一个有选择的解析器时，把最长或最具体的选择放在前面，而把最短或最一般的选择放在最后。

1. **Non-backtracking**

在解析过程中，表达式要么成功，要么失败。

若成功则进行下一步，若失败了，则表达式会失败，且引擎不会后退再试即回溯，这与具有回溯的正则表达式不同。

比如下面这个例子（其中`~`表示该表达式中前面规则匹配成功后会进行的下一步）：

```TypeScript
word = {     // to recognize a word...
    ANY*     //   take any character, zero or more times...
    ~ ANY    //   followed by any character
}

"frumious"
```

匹配字符串"frumious"时，`ANY*`首先会消耗掉整个字符串，而下一步`ANY`则不会匹配任何内容，导致它解析失败

```TypeScript
"frumious"
 ^ (word)

"frumious"
         ^ (ANY*) Success! Continue to ANY with remaining input "".
 
""
 ^ (ANY) Failure! Expected one character, but found end of string.
```

而上面这种场景，对于具有回溯功能的系统（如正则表达式），则会后退一步，“吐出"一个字符，然后再试。

1. **Unambiguous**

PEG 的每个规则都会在输入字符串的剩余部分上运行，消耗尽可能多的输入。一旦一个规则完成，剩下的输入就会被传递给解析器的其他部分，比如表达式`ASCII_DIGIT+`表示匹配一个或多个数字，始终会匹配可能的最大的连续数字序列。而不存在意外地，让后面的规则回溯，且以一种不直观和非局部的方式窃取一些数字等可能的危险情况。

这与其他解析工具形成了鲜明对比，如正则表达式和 CFG，在这些工具中，规则的结果往往取决于一些距离的代码。

#### 解析器语法&内置规则

1. **重要语法**

pest 的语法数量相较于正则表达式来说少很多，下面简单展示主要的语法及含义，关于语法的详情可自行搜索：

| 语法             | 含义                                                         |语法               | 含义                                                         |
| :--------------- | :----------------------------------------------------------- |:----------------- | :----------------------------------------------------------- |
| `foo = { ... }`  | [regular rule](https://pest.rs/book/grammars/syntax.html#syntax-of-pest-parsers) |`baz = @{ ... }`   | [atomic](https://pest.rs/book/grammars/syntax.html#atomic)   |
| `bar = _{ ... }` | [silent](https://pest.rs/book/grammars/syntax.html#silent-and-atomic-rules) |`qux = ${ ... }`   | [compound-atomic](https://pest.rs/book/grammars/syntax.html#atomic) |
| `#tag = ...`     | [tags](https://pest.rs/book/grammars/syntax.html#tags)       |`plugh = !{ ... }` | [non-atomic](https://pest.rs/book/grammars/syntax.html#non-atomic) |
| `"abc"`          | [exact string](https://pest.rs/book/grammars/syntax.html#terminals) |`^"abc"`           | [case insensitive](https://pest.rs/book/grammars/syntax.html#terminals) |
| `'a'..'z'`       | [character range](https://pest.rs/book/grammars/syntax.html#terminals) |`ANY`              | [any character](https://pest.rs/book/grammars/syntax.html#terminals) |
| `foo ~ bar`      | [sequence](https://pest.rs/book/grammars/syntax.html#sequence) |`baz | qux`        | [ordered choice](https://pest.rs/book/grammars/syntax.html#ordered-choice) |
| `foo*`           | [zero or more](https://pest.rs/book/grammars/syntax.html#repetition) |`bar+`             | [one or more](https://pest.rs/book/grammars/syntax.html#repetition) |
| `baz?`           | [optional](https://pest.rs/book/grammars/syntax.html#repetition) |`qux{n}`           | [exactly n](https://pest.rs/book/grammars/syntax.html#repetition) |
| `qux{m, n}`      | [between m and n (inclusive)](https://pest.rs/book/grammars/syntax.html#repetition) |                   |                                                              |
| `&foo`           | [positive predicate](https://pest.rs/book/grammars/syntax.html#predicates) |                   |                                                              |
| `PUSH(baz)`      | [match and push](https://pest.rs/book/grammars/syntax.html#the-stack-wip) |`!bar`             | [negative predicate](https://pest.rs/book/grammars/syntax.html#predicates) |
| `POP`            | [match and pop](https://pest.rs/book/grammars/syntax.html#the-stack-wip) |                   |                                                              |
| `DROP`           | [pop without matching](https://pest.rs/book/grammars/syntax.html#indentation-sensitive-languages) |`PEEK`             | [match without pop](https://pest.rs/book/grammars/syntax.html#the-stack-wip) |
`PEEK_ALL`         | [match entire stack](https://pest.rs/book/grammars/syntax.html#indentation-sensitive-languages) |


1. **内置规则**

除了`ANY`外，pest 还提供非常多的内置规则，让解析文本更加方便，这里主要展示几个常用的，详情可[自行查阅](https://pest.rs/book/grammars/built-ins.html)：

| 内置规则         | 等价于     | 内置规则           | 等价于                                               |
| :--------------- | :--------- | :----------------- | :--------------------------------------------------- |
| ASCII_DIGIT      | `'0'..'9'` | ASCII_ALPHANUMERIC | any digit or letter      `ASCII_DIGIT | ASCII_ALPHA` |
| UPPERCASE_LETTER | 大写字母   | NEWLINE            | any line feed format`"\n" | "\r\n" | "\r"`           |
| LOWERCASE_LETTER | 小写字母   | SPACE_SEPARATOR    | 空格分隔符                                           |
| MATH_SYMBOL      | 数学符号   | EMOJI              | Emoji 表情                                           |

## nom

### 简介

> https://github.com/rust-bakery/nom

nom 是使用 Rust 编写的前面提到的解析器组合器（Parser Combinator）库，它具有以下特性：

- 在不影响速度或内存消耗的情况下**构建安全的解析器**
- 依靠 Rust 强大的类型系统和内存安全来生成**既正确又高效的解析器**
- 提供函数、宏和特征来**抽象大部分容易出错的管道**，同时也能轻松**组合和重用解析器来构建复杂解析器**

nom 能支持的应用场景非常广泛，比如以下常见场景：

- **二进制格式解析器**：nom 的性能与用 C 语言手写的解析器一样快，且不受缓冲区溢出漏洞，并内置常见处理模式
- **文本格式解析器**：能够处理类似 csv 和更复杂的嵌套格式 Json 等，不仅可以管理数据，并内置多个有用的工具
- **编程语言解析器**：nom 可作为语言的原型解析器，支持自定义错误类型和报告、自动处理空格、就地构造 AST 等
- 除了以上场景还有 steaming formats（如 HTTP 网络处理）、更符合软件工程的解析器组合器等

### 使用示例

这里以 nom repo README 提供的“十六进制颜色解析器”例子来进行介绍：

> 这里简单讲述下十六进制颜色的具体格式是：
>
> - 以"#"开头，后面跟着六个字符，每两个字符代表红、绿、蓝三种颜色通道的数值
>
> 比如 "#2F14DF" 则 "2F" 代表红色通道的数值，"14" 代表绿色通道的数值，"DF" 代表蓝色通道的数值。

1. **在 cargo.toml 引入 nom 依赖**

```TOML
[dependencies]
nom = "7.1.3"
```

1. **新建****`src/nom/hex_color.rs`****,引入 nom 来构造十六进制颜色的解析方法****`hex_color`**

- `tag`会匹配开头的字符模式，`tag("#")`返回的是一个函数，其返回值为`IResult<Input,Input,Error>`
    - 其中`Input`为函数输入参数类型，第一个值为去掉匹配模式后的输入值，第二个为匹配内容，最后是错误值
- nom 提供的`take_while_m_n`方法前两个参数为最少和最多的匹配数量，最后参数为匹配规则，返回与上类似
- nom 提供的`map_res`方法则可将第一个参数得到的结果进行根据第二参数的模式进行转换
- nom 提供的`tuple`方法接受一组组合子，将组合子按顺序应用到输入上，然后按顺序以元组形式返回解析结果

```Rust
use nom::{AsChar, IResult};
use nom::bytes::complete::tag;
use nom::bytes::complete::take_while_m_n;
use nom::combinator::map_res;
use nom::sequence::tuple;

#[derive(Debug, PartialEq)]
pub struct Color {
    pub red: u8,
    pub green: u8,
    pub blue: u8,
}


// 是否为16进制数字
pub fn is_hex_digit(c: char) -> bool {
    c.is_hex_digit()
}

// 将字符串转换为十进制结果
pub fn to_num(input: &str) -> Result<u8, std::num::ParseIntError> {
    u8::from_str_radix(input, 16)
}

// 按 is_hex_digit 规则对输入按两位进行匹配，并将结果按 to_hex_num 转换十进制结果
pub fn hex_primary(input: &str) -> IResult<&str, u8> {
    map_res(
        take_while_m_n(2, 2, is_hex_digit),
        to_num,
    )(input)
}

// 十六进制颜色的解析器
pub fn hex_color(input: &str) -> IResult<&str, Color> {
    let (input, _) = tag("#")(input)?;
    let (input, (red, green, blue)) = tuple((hex_primary, hex_primary, hex_primary))(input)?;

    Ok((input, Color { red, green, blue }))
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_hex_color() {
        assert_eq!(hex_color("#2F14DF"), Ok(("", Color {
            red: 47,
            green: 20,
            blue: 223,
        })))
    }
}
```

### 具体使用

#### parser result

在前面示例中看到的 nom 解析方法的返回`IResult`，这是 nom 的核心结构之一，表示 nom 解析的返回结果。

首先 nom 构造的解析器，将解析后的结果定义为以下：

- `Ok(...)`表示解析成功后找到的内容，`Err(...)`表示解析没有查到对应内容
- 若解析成功后，将返回一个元组，第一个会包含解析器未匹配的所有内容，第二个会包含解析器匹配的所有内容
- 若解析失败，则可能会返回多个错误

```Plain
                                   ┌─► Ok(
                                   │      what the parser didn't touch,
                                   │      what matched the regex
                                   │   )
             ┌─────────┐           │
 my input───►│my parser├──►either──┤
             └─────────┘           └─► Err(...)
```

所以为表示该模型，nom 定义了结构体`IResult<Input,Output,Error>`：

- 可看出实际上 Input 和 Output 可定义为不同的类型，Error 则为任何实现 ParseError trait 的类型

#### tag & character classes

1. **tag 字节集合标签**

**nom 将简单的字节集合称为标签**。因为这些十分常见，所以也内置了`tag()`函数，返回给定字符串的解析器。

比如想要解析字符串"abc"，则可使用`tag("abc")`，

> 需要注意的是 nom 中存在多个不同的 tag 定义，若不特别说明则通常使用以下定义，避免出现意外的错误：
>
> ```Rust
> pub use nom::bytes::complete::tag;
> ```

`tag`函数的签名如下，可看到其`tag`返回了一个函数，且该函数是一个解析器，获取 `&str` 并返回 `IResult`：

> 同时这里的，创建解析器的函数返回其解析器函数，使用时输入其参数，是 nom 中的常见模式。

```Rust
pub fn tag<T, Input, Error: ParseError<Input>>(
    tag: T
) -> impl Fn(Input) -> IResult<Input, Input, Error> where
    Input: InputTake + Compare<T>,
    T: InputLength + Clone, 
```

这里以一个实现使用`tag`的函数来进行举例：

```Rust
use nom::bytes::complete::tag;
use nom::IResult;

pub fn parse_input(input: &str) -> IResult<&str, &str> {
    tag("abc")(input)
}

#[cfg(test)]
mod test {
    use super::*;
    #[test]
    fn test_parse_input() {
        let (leftover_input, output) = parse_input("abcWorld!").unwrap();
        assert_eq!(leftover_input, "World!");
        assert_eq!(output, "abc");
        assert!(parse_input("defWorld").is_err());
    }
}
```

1. **character classes**

考虑到 tag 仅能用于开头序列中的字符，nom 提供了另外的**预先编写的解析器即被称为 character classes**，其允许接受一组字符中的任何一个。下面展示一些使用较多的内置解析器：

| 解析器                      | 作用                                                         | 解析器                  | 作用                                                         |
| :-------------------------- | :----------------------------------------------------------- | :---------------------- | :----------------------------------------------------------- |
| alpha0/alpha1               | 识别零个或多个小写和大写字母字符后者类似，但要求至少返回一个字符 | multispace0/multispace1 | 识别零个或多个空格、制表符、回车符和换行符后者类似，但要求至少返回一个字符 |
| alphanumeric0/alphanumeric1 | 识别零个或多个数字字符或字母字符后者类似，但要求至少返回一个字符 | space0/space1           | 识别零个或多个空格和制表符后者类似，但要求至少返回一个字符   |
| digit0/digit1               | 识别零个或多个数字字符后者类似，但要求至少返回一个字符       | newline                 | 识别换行符                                                   |

这里举一个简单的例子来看看是如何使用的：

```Rust
use nom::character::complete::alpha0;
use nom::IResult;

fn parse_alpha(input: &str) -> IResult<&str, &str> {
    alpha0(input)
}

#[test]
fn test_parse_alpha() {
    let (remaining, letters) = parse_alpha("abc123").unwrap();
    assert_eq!(remaining, "123");
    assert_eq!(letters, "abc");
}
```

#### alternatives & composition

1. **alternatives**

nom 提供了`alt()`组合器来满足多个解析器的选择，它**将执行元组中的每个解析器，直至找到解析成功的解析器**。

若元组中的所有解析器都解析失败，那么才会收到相应的报错。

下面举一个简单的例子来进行说明：

```Rust
use nom::branch::alt;
use nom::bytes::complete::tag;
use nom::IResult;

fn parse_abc_or_def(input: &str) -> IResult<&str, &str> {
    alt((
        tag("abc"),
        tag("def"),
    ))(input)
}

#[test]
fn test_parse_abc_or_def() {
    let (leftover_input, output) = parse_abc_or_def("abcWorld").unwrap();
    assert_eq!(leftover_input, "World");
    assert_eq!(output, "abc");
    let (_, output) = parse_abc_or_def("defWorld").unwrap();
    assert_eq!(output, "def");
    assert!(parse_abc_or_def("ghiWorld").is_err());
}
```

1. **composition**

除了多个解析器的选择之外，组合解析器也是一项非常常见的要求，所以 **nom 提供了内置的组合器**。

比如`tuple()`，其采用解析器的元组，且返回`Ok`以及所有成功解析的元组，或返回第一个失败的 `Err`解析器。

```Rust
use nom::branch::alt;
use nom::bytes::complete::tag_no_case;
use nom::IResult;
use nom::sequence::tuple;

fn parse_base(input: &str) -> IResult<&str, &str> {
    alt((
        tag_no_case("a"), // 与 tag 相比不区分大小写的标签
        tag_no_case("t"),
        tag_no_case("c"),
        tag_no_case("g"),
    ))(input)
}

fn parse_pair(input: &str) -> IResult<&str, (&str, &str)> {
    tuple((
        parse_base, parse_base
    ))(input)
}

#[test]
fn test_parse_pair() {
    let (remaining, parsed) = parse_pair("aTcG").unwrap();
    assert_eq!(parsed, ("a", "T"));
    assert_eq!(remaining, "cG");
    assert!(parse_pair("Dct").is_err());
}
```

除了上面提到的，实际上 rust 还支持下面具有类似操作的解析器

| combinator     | usage                                                   | input          | output                        |
| :------------- | :------------------------------------------------------ | :------------- | :---------------------------- |
| delimited      | `delimited(char('('), take(2), char(')'))`              | "(ab)cd"       | Ok(("cd", "ab"))              |
| preceded       | `preceded(tag("ab"), tag("XY"))`                        | "abXYZ"        | Ok(("Z", "XY"))               |
| terminated     | `terminated(tag("ab"), tag("XY"))`                      | "abXYZ"        | Ok(("Z", "ab"))               |
| pair           | `pair(tag("ab"), tag("XY"))`                            | "abXYZ"        | Ok(("Z", ("ab", "XY")))       |
| separated_pair | `separated_pair(tag("hello"), char(','), tag("world"))` | "hello,world!" | Ok(("!", ("hello", "world"))) |

#### Parsers With Custom Return Types

就像提到的`IResult`中的 Input 和 Output 实际上可以为不同的类型，如果我们想要对标签的结果进行类型转换，那么就可以使用 nom **提供的****`value`****组合器来将解析成功的结果转换为特定值**。比如下面这个例子：

```Rust
use nom::branch::alt;
use nom::bytes::complete::tag;
use nom::combinator::value;
use nom::IResult;

fn parse_bool(input: &str) -> IResult<&str, bool> {
    alt((
        value(true, tag("true")),    // 转换为 bool 类型
        value(false, tag("false")),
    ))(input)
}

#[test]
fn test_parse_bool() {
    let (remaining, parsed) = parse_bool("true|false").unwrap();
    assert_eq!(parsed, true);
    assert_eq!(remaining, "|false");
    assert!(parse_bool(remaining).is_err());
}
```

#### Repeating  Predicates and Parsers

1. **Repeating With Predicates**

这里的 Predicates 实际上就像是我们之前接触到的 while 循环，为了**满足包含特定条件而重复的解析器处理的功能**，nom 提供了几个不同类别的谓词解析器，主要分别是`take_till`、`take_until`、`take_while`三种类别：

| 组合器       | 作用                               | 用法                        | 输入          | 输出                    |
| :----------- | :--------------------------------- | :-------------------------- | :------------ | :---------------------- |
| `take_till`  | 持续消耗输入，直到其输入满足谓词   | `take_while(is_alphabetic)` | "abc123"      | Ok(("123", "abc"))      |
| `take_while` | 持续消耗输入，直到其输入不满足谓词 | `take_till(is_alphabetic)`  | "123abc"      | Ok(("abc", "123"))      |
| `take_until` | 消耗直到满足谓词的第一次出现       | `take_until("world")`       | "Hello World" | Ok(("World", "Hello ")) |

这里可以再补充一些：

- 上述组合器实际上都有一个“双胞胎”，即名称末尾带有`1`，区别在于需要至少返回一个匹配字符，不然就会报错
- 前面用到的`take_while_m_n`，实际类似于 `take_while`，是作为一种特殊情况，其保证消耗`[m,n]`字节

1. **Repeating Parsers**

除了重复谓词的单个解析器，nom 还提供了**重复解析器的组合器**，比如`many0`能尽可能多次地应用解析器，并返回这些解析结果的向量，比如下面这个例子：

```Rust
use nom::bytes::complete::tag;
use nom::IResult;
use nom::multi::many0;

fn repeat_parser(s: &str) -> IResult<&str, Vec<&str>> {
    many0(tag("abc"))(s)
}

#[test]
fn test_repeat_parser() {
    assert_eq!(repeat_parser("abcabc"), Ok(("", vec!["abc", "abc"])));
    assert_eq!(repeat_parser("abc123"), Ok(("123", vec!["abc"])));
    assert_eq!(repeat_parser("123123"), Ok(("123123", vec![])));
    assert_eq!(repeat_parser(""), Ok(("", vec![])));
}
```

下面也列出一些常用的组合器：

| 组合器                                                       | 用法                                                         | 输入        | 输出                                |
| :----------------------------------------------------------- | :----------------------------------------------------------- | :---------- | :---------------------------------- |
| [count](https://docs.rs/nom/latest/nom/multi/fn.count.html)  | `count(take(2), 3)`                                          | "abcdefgh"  | Ok(("gh", vec!["ab", "cd", "ef"]))  |
| [many0](https://docs.rs/nom/latest/nom/multi/fn.many0.html)  | `many0(tag("ab"))`                                           | "abababc"   | Ok(("c", vec!["ab", "ab", "ab"]))   |
| [many_m_n](https://docs.rs/nom/latest/nom/multi/fn.many_m_n.html) | `many_m_n(1, 3, tag("ab"))`                                  | "ababc"     | Ok(("c", vec!["ab", "ab"]))         |
| [many_till](https://docs.rs/nom/latest/nom/multi/fn.many_till.html) | `many_till(tag( "ab" ), tag( "ef" ))`                        | "ababefg"   | Ok(("g", (vec!["ab", "ab"], "ef"))) |
| [separated_list0](https://docs.rs/nom/latest/nom/multi/fn.separated_list0.html) | `separated_list0(tag(","), tag("ab"))`                       | "ab,ab,ab." | Ok((".", vec!["ab", "ab", "ab"]))   |
| [fold_many0](https://docs.rs/nom/latest/nom/multi/fn.fold_many0.html) | `fold_many0(be_u8, \|\| 0, \|acc, item\| acc + item)`        | [1, 2, 3]   | Ok(([], 6))                         |
| [fold_many_m_n](https://docs.rs/nom/latest/nom/multi/fn.fold_many_m_n.html) | `fold_many_m_n(1, 2, be_u8, \|\| 0, \|acc, item\| acc + item)` | [1, 2, 3]   | Ok(([3], 3))                        |
| [length_count](https://docs.rs/nom/latest/nom/multi/fn.length_count.html) | `length_count(number, tag("ab"))`                            | "2ababab"   | Ok(("ab", vec!["ab", "ab"]))        |

#### Error management

nom 的错误在设计时考虑到了多种需求：

- 指示哪个解析器失败以及输入数据中的位置
- 当错误沿着解析器链向上时，积累更多的上下文
- 开销非常低，因为调用解析器通常会丢弃错误
- 可以根据用户的需要进行修改，因为有些语言需要更多的信息

为了满足以上需求， **nom 解析器的结果类型**设计如下：

```Rust
pub type IResult<I, O, E=nom::error::Error<I>> = Result<(I, O), nom::Err<E>>;

pub enum Err<E> {
    Incomplete(Needed),    // 表示解析器没有足够的数据来做出决定，通常在 streaming 场景会遇到
    Error(E),              // 正常的解析器错误，比如 alt 组合器的子解析器返回 Error ，它将尝试另一个子解析器
    Failure(E),            // 无法恢复的错误，比如子解析器返回 Failure ，则 alt 组合器将不会尝试其他分支
}
```

1. **`nom::Err<E>`****中常见的错误类型**

- 默认错误类型`nom::error::Error`，它会返回**具体是哪个解析器的错误及错误的输入位置**

  ```Rust
    #[derive(Debug, PartialEq)]
    pub struct Error<I> {
      /// position of the error in the input data
      pub input: I,
      /// nom error code
      pub code: ErrorKind,
    }
    ```

    - 这种错误类型**速度快且开销较低**，适合重复调用的解析器，但它的功能也是有限的，比如**不会返回调用链信息**

- 获取更多信息`nom::error::VerboseError`，它会**返回遇到错误的解析器链的更多信息，如解析器类型等**

  ```Rust
    #[derive(Clone, Debug, PartialEq)]
    pub struct VerboseError<I> {
      /// List of errors accumulated by `VerboseError`, containing the affected
      /// part of input data, and some context
      pub errors: crate::lib::std::vec::Vec<(I, VerboseErrorKind)>,
    }
    
    #[derive(Clone, Debug, PartialEq)]
    /// Error context for `VerboseError`
    pub enum VerboseErrorKind {
      /// Static string added by the `context` function
      Context(&'static str),
      /// Indicates which character was expected by the `char` function
      Char(char),
      /// Error kind given by various nom parsers
      Nom(ErrorKind),
    }
    ```

    - 通过查看原始输入和错误链，可以构建更加用户友好的错误消息，可通过`nom::error::convert_error` 函数可以构建这样的消息

1. **ParseError tait 自定义错误类型**

可通过**实现** **`ParseError<I>`** **特征来定义自己的错误类型**。

因为所有 nom 组合器对于其错误都是通用的，因此只需要在解析器结果类型中定义它，并且它将在任何地方使用。

```Rust
pub trait ParseError<I>: Sized {
    // 根据输入位置和 ErrorKind 枚举来指示在哪个解析器中遇到错误
    fn from_error_kind(input: I, kind: ErrorKind) -> Self;
    // 允许在回溯解析器树时创建一系列错误（各种组合器将添加更多上下文）
    fn append(input: I, kind: ErrorKind, other: Self) -> Self;
    // 创建一个错误，指示期望哪个字符
    fn from_char(input: I, _: char) -> Self {
        Self::from_error_kind(input, ErrorKind::Char)
    }
    // 在像 alt 这样的组合器中，允许在来自各个分支的错误之间进行选择（或累积它们）
    fn or(self, other: Self) -> Self {
        other
    }
}
```

也可以实现`ContextError`特征来支持 `VerboseError<I>` 使用的 `context()` 组合器。

下面通过一个简单的例子来介绍其用法，这里会定义一个调试错误类型，做到每次生成错误时打印额外信息：

```Rust
use nom::error::{ContextError, ErrorKind, ParseError};

#[derive(Debug)]
struct DebugError {
    message: String,
}

impl ParseError<&str> for DebugError {
    // 打印出具体错误的解析器类型
    fn from_error_kind(input: &str, kind: ErrorKind) -> Self {
        let message = format!("【{:?}】:\t{:?}\n", kind, input);
        println!("{}", message);
        DebugError { message }
    }

    // 若遇到组合器的多个错误则打印出其他上下文信息
    fn append(input: &str, kind: ErrorKind, other: Self) -> Self {
        let message = format!("【{}{:?}】:\t{:?}\n", other.message, kind, input);
        println!("{}", message);
        DebugError { message }
    }

    // 打印出具体期望的字符
    fn from_char(input: &str, c: char) -> Self {
        let message = format!("【{}】:\t{:?}\n", c, input);
        print!("{}", message);
        DebugError { message }
    }

    fn or(self, other: Self) -> Self {
        let message = format!("{}\tOR\n{}\n", self.message, other.message);
        println!("{}", message);
        DebugError { message }
    }
}

impl ContextError<&str> for DebugError {
    fn add_context(_input: &str, _ctx: &'static str, other: Self) -> Self {
        let message = format!("【{}「{}」】:\t{:?}\n", other.message, _ctx, _input);
        print!("{}", message);
        DebugError { message }
    }
}
```

1. **调试解析器**

编写解析器的过程中，若需要跟踪解析器的执行过程信息，可通过`dbg_dmp`函数来打印出解析器的输入和输出：

```Rust
fn f(i: &[u8]) -> IResult<&[u8], &[u8]> {
    dbg_dmp(tag("abcd"), "tag")(i)
}

let a = &b"efghijkl"[..];

// Will print the following message:
// tag: Error(Error(Error { input: [101, 102, 103, 104, 105, 106, 107, 108], code: Tag })) at:
// 00000000        65 66 67 68 69 6a 6b 6c         efghijkl
f(a);
```

# 总结

通过这篇文章我们基本了解了解析器的前置知识（Parser、PEG 和 Parser Combinator）和如何使用 Rust 实现解析器需要的三方库（ pest 和 nom）。而无论是基于 PEG 实现的 pest 还是基于 Parser Combinator 实现的 nom，都能满足实现自定义解析器的通用场景，都不需要再从零到一的手写解析器了，这使自定义解析器的实现成本大大降低。若考虑更加复杂的情况（如性能、实现成本、使用文档等因素），就需要根据具体的场景来选择相应的三方库进行实现。

下篇文章我们就会分别用到 pest 和 nom 来实现几个常见的解析器，以此来更好地掌握解析器的视线。

# 参考

https://zhuanlan.zhihu.com/p/427767002

https://zh.wikipedia.org/wiki/%E8%A7%A3%E6%9E%90%E8%A1%A8%E8%BE%BE%E6%96%87%E6%B3%95

https://zhuanlan.zhihu.com/p/355364928

https://ohmyweekly.github.io/notes/2021-01-20-pest-grammars/#

https://pest.rs/book/parser_api.html

https://rustmagazine.github.io/rust_magazine_2021/chapter_4/nom_url.html

https://tfpk.github.io/nominomicon/chapter_1.html
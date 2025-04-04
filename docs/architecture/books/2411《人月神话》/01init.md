﻿# 01-07

## 第1章 焦油坑

> 前车之覆，后车之监。 ——荷兰谚语

### 1.1 编程系统产品

- 过去⼏⼗年的⼤型系统开发就犹如这样⼀个焦油坑，**很多⼤型和强壮的动物在其中剧烈地挣扎**。表⾯上看起来好像没有任何⼀个单独的问题会导致困难，每个问题都能获得解决，但是当它们相互纠缠和累积在⼀起的时候，团队的⾏动就会变得越来越慢。对于问题的⿇烦程度，每个⼈似乎都会感到惊讶，并且很难看清问题的本质。不过，**如果我们想解决问题，就必须试图先去了解问题**。

![](https://img.zhengyua.cn/blog/202412010952903.png)

- 右下部分代表编程系统产品。与以上的所有的简单的程序都不同的是，**它的成本⾼达 9 倍**。然⽽只有它才是真正有⽤的产品，**是⼤多数系统开发的⽬标**。

### 1.2 职业的乐趣

- ⾸先，这种乐趣来源于**创建事物的纯粹快乐**。
- 其次，这种快乐来⾃于**开发对他⼈有⽤的东西**。
- 第三，快乐来⾃于整个过程体现出的⼀股**强⼤的魅⼒——将相互啮合的零部件组装在⼀起**，看到它们以精妙的⽅式运⾏着，并收到了预期的效果。
- 第四，这种快乐是**持续学习的快乐**，它来⾃于这项⼯作的⾮重复特性。
- 最后，这种快乐还来⾃于在**易于驾驭的介质上**⼯作。

> 编程的快乐在于它不仅满⾜了我们内⼼深处进⾏创造的渴望，⽽且还唤醒了每个⼈内⼼的情感。

### 1.3 职业的苦恼

- ⾸先，苦恼来⾃**追求完美**。
- 其次，苦恼来⾃**由他⼈来设定⽬标、供给资源和提供信息**。编程⼈员很少能控制⼯作环境和⼯作⽬标。
- 下⼀个苦恼，**设计宏大概念是有趣的，但寻找琐碎的 Bug 却是⼀项重复性的活动**。
- 另外⼈们发现**调试和查错往往是线性收敛的**，或者更糟糕的是，具有⼆次⽅的复杂度。
- 最后⼀个苦恼，有时也是⼀种⽆奈——当投⼊了⼤量⾟苦的劳动，产品在即将完成或者终于完成的时候，**却已显得陈旧过时**。
- 因此，我们所⾯临的挑战和任务是在实际的进度和有效的资源范围内，**寻找解决实际问题的切实可⾏⽅案**。

> 这就是编程，⼀个许多⼈痛苦挣扎的焦油坑以及⼀种乐趣和苦恼共存的创造性活动。对许多⼈⽽⾔,其中的快乐远远⼤于苦恼。

## 第2章 人月神话

在众多软件项⽬中，缺乏合理的进度安排是造成项⽬滞后的最主要原因，它⽐其他所有因素加起来的影响还要⼤。导致这种灾难如此普遍的原因是什么呢：

- 第一，我们的估算技术还不成熟，说得严重一些，它反映了⼀种悄⽆声息但并不真实的假设——⼀切都将运作良好；
- 第⼆，采用的估算技术隐含地假设人和月可以互换，错误地将进度与⼯作量相互混淆；
- 第三，由于对⾃⼰的估算缺乏信⼼；
- 第四，对进度缺少跟踪和监督；
- 第五，当意识到进度的偏移时，下意识（以及传统）的反应是增加⼈⼒。这就像使⽤汽油灭⽕⼀样，只会使事情更糟；

### 2.1 乐观主义

- **所有的编程⼈员都是乐观主义者**。可能是这种现代魔术特别吸引那些相信美满结局和幻想中的圣母的⼈；也可能是成百上千琐碎的挫折赶⾛了⼤多数⼈，只剩下了那些习惯上只关注结果的⼈；还可能仅仅因为计算机还很年轻，程序员更加年轻，⽽年轻⼈总是些乐观主义者——⽆论是什么样的程序，**结果是⽏庸置疑的：“这次它肯定会运⾏”或者“我刚刚找出最后⼀个错误”**。
- 所以系统编程的进度安排背后的第⼀个错误的假设是：**⼀切都将运作良好，每⼀项任务仅花费它所“应该”花费的时间**。
- 对这种弥漫在编程⼈员中的乐观主义，理应受到慎重的分析。
- 由于物理介质和思路中隐含的不完善性，构思实现起来需要付出时间和精力。对遇到的⼤部分困难，**我们总是倾向于去责怪那些物理介质**，因为无力介质不是“我们的”，而思路是“我们的”。我们的自尊心使判断带上了主观色彩；
- 然⽽计算机粹的思维活动——**编程基于⼗分容易掌握的介质**，编程⼈员通过⾮常纯概念以及灵活的表现形式来开发程序。正是由于介质的易于驾驭，我们期待在实现过程中不会碰到困难，因此造成了乐观主义的弥漫。⽽我们的构思是有缺陷的，因此总会发现 bug。**也就是说我们的乐观主义并不应该是理所应当的**。
- 在单个的任务中，“⼀切都将运转正常”的假设在进度上具有可实现性。因所遇到的延迟是⼀个概率分布曲线，“不会延迟”具有限定的概率，所以现实情况可能会像计划安排的那样顺利。然⽽⼤型的编程⼯作，或多或少包含了很多任务，某些任务间还具有前后的次序，**从⽽⼀切正常的概率变得⾮常⼩，甚⾄接近于零**。

### 2.2 人月

- **第⼆个谬误的思考⽅式是在估计和进度安排中使⽤的⼯作量单位**：⼈⽉。成本的确随开发产品的⼈数和时间的不同，有着很⼤的变化，进度却不是如此。⼈员和时间的关系如图所⽰。因此我认为⽤⼈⽉作为**衡量⼀项⼯作的规模是⼀个危险和带有欺骗性的神话**。它暗⽰着⼈员数量和时间是可以相互替换的。
- 当任务由于次序上的限制不能分解时，**⼈⼿的添加对进度没有帮助**。
- 对于可以分解但⼦任务之间需要相互沟通和交流的任务，**必须在计划⼯作中考虑沟通的⼯作量**。因此在相同⼈⽉的前提下，采⽤增加⼈⼿来减少时间得到的最好情况，还是⽐未调整前差一些。
- 沟通所增加的负担由两个部分组成：**培训和相互的交流**。每个成员需要进⾏技术、项⽬⽬标、总体策略以及⼯作计划的培训。这种培训是不能分解的，因此**这部分增加的⼯作量随⼈员的数量呈线性变化**。相互之间交流的情况更糟⼀些。如果任务的每个部分必须**分别与其他部分单独协作，则⼯作量按照 n(n - 1)/ 2 递增**。所增加的⽤于沟通的**⼯作量可能会完全抵消对原有任务分解所产⽣的作⽤**。
- 因为软件开发本质上是⼀项**系统⼯作——错综复杂关系下的⼀种实践、沟通、交流的⼯作量⾮常⼤**，它很快会消耗任务分解所节省下来的个⼈时间。从⽽添加更多的⼈⼿，**实际上是延长了⽽不是缩短了时间进度**。

### 2.3 系统测试

- 在进度安排中，由于顺序限制所造成的影响，**没有哪个部分⽐单元调试和系统测试所受到的牵涉更彻底**。⽽且需要的时间依赖于所遇到的错误、缺陷的数量及其难以捕捉的程度。
- 对于软件任务的进度安排，以下是我使⽤了很多年的经验法则：
    - 1/3 计划
    - 1/6 编码
    - 1/4 构件测试和早期系统测试
    - 1/4 系统测试，所有的构件已完成
- 在许多重要的⽅⾯，它与传统的进度安排⽅法不同：
    - 分配给计划的时间⽐平常的多
    - 对所完成代码的调试和测试投⼊近⼀半的时间，这⽐平常的安排多很多
    - 容易估计的部分，如编码，仅仅分配了 1/6 的时间
- 通过对传统项⽬进度安排的研究，我发现很少有项⽬允许为测试分配⼀半的时间，但**⼤多数项⽬的测试实际上是花费了进度中⼀半的时间**。
- 特别需要指出的是，**不为系统测试安排⾜够的时间**简直就是⼀场灾难。另外此时此刻的延迟具有**不寻常的、严重的财务和⼼理上的反应**。

### 2.4 怯懦的估算

- 观察⼀下编程⼈员，你可能会发现同厨师⼀样，某项任务的计划进度，可能受限于顾客要求的紧迫程度，**但紧迫程度⽆法控制实际的完成情况**。
- 但为了满⾜顾客期望的⽇期⽽造成的不合理进度安排，在软件领域中却⽐其他任何⼯程领域要普遍得多。⽽且⾮阶段化⽅法的采⽤，少得可怜的数据⽀持，加上完全借助软件经理的直觉，这样的⽅式**很难⽣产出有⼒的、看似可靠的和规避风险的估计**。
- 在基于可靠基础的估算出现之前，项⽬经理需要挺直腰杆，他们的估计，**确信⾃⼰的经验和直觉总⽐从期望派⽣出的结果要强坚持得多**。

### 2.5 重复产生的进度灾难

- ⼀个具有丰富经验的硬件⼯程师的忠告：**“不要让小的偏差留着。”**
- 项⽬经理的相应措施是仔细、认真地调整项⽬，重新安排进度，或者默默地注视着任务由于轻率的设计和不完整的测试⽽被剪除。
- 毫⽆疑问，**重复“灾难”所开发出的产品**，⽐没有增加⼈⼿，⽽是重新安排开发进度所产⽣的产品更差。
- 冒昧地简化⼀下 Brooks 法则：**向进度落后的项⽬中增加⼈⼿，只会使进度更加落后**。这就是除去了神话⾊彩的⼈⽉。**项⽬的时间依赖于顺序上的限制，⼈员的最⼤数量依赖于独⽴⼦任务的数量**。
- 在众多软件项⽬中，**缺乏合理的进度安排是造成项⽬滞后的最主要原因**，它⽐其他所有因素加起来的影响还要⼤。

## 第3章 外科手术团队

> 效率高和效率低的实施者之间个体差异非常大，经常能够达到数量级的水平。

本章的主要内容如下：

二选一的观点“年轻的产品经理更喜欢由一流人才组成的小型精干团队，而不是由几百名（平庸的）程序员来完成项目”实际上回避了关键问题：**如何在有意义的进度安排内构建大型的系统？**

针对该问题，小型精干团队优势在于：

- 高效率的生产力，优秀编程人员和平庸编程人员之间生产力的差异确实比想象中的要更大
- 更少的协作成本，更多的建造人员会带来更多的协作成本

而劣势就在于就在与，在交付真正意义上的大型系统时，其速度太慢了。所以这其实是个取舍的问题，**从效率和概念的完整性角度来看前者更有优势，而对大型系统则需要后者来达到产品预期的交付时间**。

而如何调节该矛盾，作者提出了 Harlan Mills 的建议：大型项目的每一部分都由一个团队解决，但是该团队以**类似外科手术团队的方式组建，而不是杀猪团队**，即不是每个成员都拿刀乱砍，而是只有一个人操刀，其他人给予他各种支持，以提高效率和生产力。同时对于 Mills 的概念来说，至关重要的是编程**“从私人艺术到公共实践”的转换**。

如下图，参照目前外科手术团队的可行分工，开发团队也可抽象出管理员、编辑、副手、程序职员等角色职责进行分工，其中特别需要注意**该分工模式与传统团队分工模式的差别**：

![](https://img.zhengyua.cn/blog/202412050930878.png)

- “外科医生”和“副手”需要了解所有的设计和全部的代码，确保概念完整性，而不是每人仅看自己部分的设计和实现；
- 出现观点差异时，不存在利益差别，可由“外科医生”单方面解决，关键在于对问题不进行分解和上下级的关系；
- 专业化分工使成员之间的沟通成本降低；

除了上述问题的解决方案，我们还需要面对如何面对团队扩建的问题，而其扩建过程的成功依赖于一个关键事实：**每部分的概念完整性得到了彻底的提高**。该事实能够使扩建需要协调的人员数量更少，而对于协调的问题依然需要使用分解的技术。

该协作模式对于开发团队来说，保证整个系统必须具备概念完整性的角色通常是系统架构师，为了方便管理则需要划分出体系结构设计和实现的界线，而系统架构师则主要关注前者。

!!! note "感悟"

    - 该章节所讲的内容，与我目前所在公司对于大型项目的分工几乎一样，即相较于传统的分工，特殊的角色概念有 PMO、POC、Owner 等，研发效率和交付速度等都会得到一定的提升，而且我理解该模式对于具体负责的团队人员来说，不仅是专业上的考量，也是一次综合能力的挑战。
    - 当我们在了解观点的时候，也需要尝试思考问题的本质，而不是像上面跟随问题来幼稚的二选一，我们需要明白每个观点选择它的理由和不选择它的理由，以此来根据具体场景判断做出取舍。

??? note "claude 补充的观点和角度"

    1. 关于团队组织模式的深入思考：

    - "外科手术团队"模式实际上体现了一种"中心化"与"专业化"的平衡：
      - 中心化体现在决策权集中于"外科医生"，保证了概念完整性
      - 专业化体现在团队成员各司其职，提高整体效率
      - 这种平衡在现代敏捷团队中依然有其价值，尤其是在处理复杂系统时

    - 值得注意的是，这种模式对"外科医生"的要求极高：
      - 技术能力：需要掌握系统的整体设计
      - 决策能力：能够快速做出合理决策
      - 沟通能力：需要有效指导团队成员
      - 领导力：需要统筹团队工作

    2. 关于效率与规模的权衡：

    - 作者提出的解决方案实际上是一种"分形"结构：
      - 大型系统被分解成多个相对独立的部分
      - 每个部分都采用外科手术团队模式
      - 各团队之间通过架构师角色来协调

    - 这种方案的现代实践：
      - 微服务架构：系统的模块化分解
      - DevOps实践：专业化角色的深化
      - 敏捷开发：小团队高效协作

    3. 对现代软件开发的启示：

    - 角色演进：
      - 传统的"程序员"角色已经分化为多个专业方向
      - 除了开发外，还包括测试、运维、安全等专业角色
      - 这种专业化趋势与书中的预见是一致的

    - 工具支持：
      - 现代开发工具和平台可以部分替代书中某些支持角色的工作
      - 但核心的决策和创造性工作仍需要人来完成

    4. 实践建议：

    - 团队构建：
      - 根据项目规模和复杂度选择合适的团队模式
      - 注重培养有潜力的"外科医生"角色
      - 建立清晰的责任界定和沟通机制

    - 流程优化：
      - 引入自动化工具减少重复性工作
      - 建立有效的知识共享机制
      - 保持团队规模的合理控制

    您提到的点关于PMO、POC、Owner等角色的现代实践很有见地。这些角色的出现正是对书中理论的实践演进，同时也反映了现代软件开发对专业化和效率的追求。另外，您对"不应该简单二选一"的观点也很重要。在实际工作中，往往需要根据具体情况（如项目规模、时间约束、团队能力等）来选择合适的团队组织方式，这种情境化的决策能力是技术领导者必备的素质。

## 第4章 贵族制、民主制和系统设计


> 正是 Jean d'Orbais 构思出了这个建筑的总体规划，这个规划得到了其后继者的认同，至少在基本要素方面如此。这就是教堂能达到极致的和谐和统一的原因之一。 ——《兰斯大教堂指南》

本章首先通过对比大多数欧洲教堂和兰斯大教堂的一致性，引出了其一致性带来的纯粹和力量。而在编程系统中的“一致性”更多指向的就是“概念完整性”，编程系统的不一致通常不是因为它由不同时代的设计师设计，**而是由于设计被分成了很多任务，由很多人完成导致的**。

在系统设计中，作者的主张：“**概念完整性时最重要的考虑因素，即为了反映一系列连贯的设计思路，宁可让系统省略一些不规则的特性和改进，也不提倡在系统中包含很多独立和无法协调的好想法。**“ 而关于这一点实际在前面外科手术团队的章节有提到过，概念完整性也是面对团队扩建的核心依赖。

而为什么说概念完整性在编程系统设计中那么重要，作者通过以下几个实际问题进行解释：

- 如何获得概念完整性
- 这样的观点是否意味着出现架构师精英或者贵族，以及一群创造性天赋和构思被压制的平民实现人员
- 如何避免架构师制订出无法实现，或者代价高昂的技术规格说明，使大家陷入困境？
- 如何确保架构规格的每一个琐碎细节都能够传达给实现人员，由他正确理解并精确地整合到产品中？

**1. 获得概念的完整性**

编程系统的目的是使计算机更加容易使用，即“**易用性**”。而由于目标是易用性 simplicity，**功能与概念的复杂程度的比值才是系统设计的最终测试标准**，单是功能本身或简洁性等某一元素都无法成为一个好的设计评判标准。

**单独的简洁性和功能（直白）实际上都是不均衡的**。因为要表达一件待完成的事情，常常需要对**基本元素进行意料不到的复杂组合**，而且仅仅了解基本要素和组合规则也是不够的，还需要学习惯用的用法，以及整套元素元素在实际工作中如何进行组合。

而简洁和直白均来自概念的完整性，每一部分都必须反映相同的哲学以及相同的权衡，甚至在语法上，每一部分都必须使用相同的技巧，在语义上，使用类似的概念。这些标准都是获得概念完整性的途径。

同时这也能看出，**易用性实际上就是需要设计的一致性和概念的完整性，这也体现了概念完整性的重要性**。

**2. 贵族制和民主制**

概念的完整性要求设计来自一个或较少数由共识的人，但进度压力要求较多人员建造系统。解决该矛盾的方法，要么是仔细划分架构和实现的工作，要么是像前面章节提到的“外科手术”团队。

概念完整性的设计需要由极少数的像“贵族”一般的系统架构师来进行保障，这里的“系统架构”更多是指需求概念（类似接口规约）而不是我们通常理解的设计系统的“整体框架“，**所以系统架构师实际更多是站在用户的角度，支持用户的真正利益**。同时系统架构和实现的区分也需要注意，可用 Blaauw 所说的话进行解释：“**架构陈述的是发生了什么，而实现描述的是如何让它发生。**”

以上我们可以理解**贵族和平民实际更多对应的是“系统架构师”和“实现人员”**。所以我理解对于贵族制和民主制的矛盾实际上可能并不是谁好谁坏的问题，而只是角色职责的划分，比如作者提到的：

- **好的架构创意并不只有架构师拥有**，新的概念经常也来自于实现人员或用户，但同时也要明确一点，即使出现了好的特性和想法，**若违背了系统的概念完整性也是需要放弃的**，甚至重要到可以放弃整个系统重新开始，因为系统的概念完整性决定了易用性目标。
- 架构师的工作产物的生命周期与实现人员是有差异的，**解决问题的出发视角核心是站在维护用户利益的视角**，若要得到概念的完整性，则必须有人控制和管理这些概念。
- 外部规约的实现并不比实现的设计工作更具有创造性，只是一项性质不通的创造工作而已，实际上产品的成本性能在很大程度是依靠实现人员的，就如同易用性以来架构师一样。

并且有较多的案例还能看出两者是相辅相成的，**比如“形式即解放”，外部的架构规定（如同“纪律“）实际上是增强而不是限制实现小组的创造性**。

**3. 在等待时，实现人员做什么？**

这里反映了时间顺序和阶段性上的问题，通常的方案是在规约完成的时候，才开始雇佣实现人员。而在快节奏的计算机行业中，**为了尽可能地压缩进度，则需要寻求两者可重叠的部分**。

如何 Blaauw 指出的创造性活动可包括三个独立的阶段：**架构、实施、实现。在实际情况中，它们可以同时开始和并发地进行**。比如实现人员有了对手册的模糊设想、技术的构思等，就可以开始前置设计数据流、整体业务架构设计等工作。

概念的完整性虽然确实要求系统只反映单一的哲学，用户所见的规约应来自少数人的思想。**实际工作被划分成架构、实现和实施并不意味着需要更长的时间，相反经验来看会有更高的效率**，垂直的分工不仅减少了广泛的水平分工，提高了沟通效率，同时也让概念的完整性得到提升。


!!! note "感悟"

    - 本章的核心内容即概念完整性的重要性，以及从易用性、站在用户利益的角度、制定“纪律”增强实现、提高进度效率等角度来解释为什么重要。
    - 该部分十分贴近日常的工作，同时也能深刻理解作者提到的概念完整性有多么重要。在曾经遇到的业务需求、重构技术项目、交接或接手其他项目、与其他团队合作等工作时，概念的完整性能基本决定这件事情所具有的复杂度和大部分所需要的成本，越简洁和直白的设计，越一致和完整的概念，都能极大提升其易用性，这里的易用性不仅是对使用的用户，也是对内部实现和维护的人员。
    - 对于向外提供服务的系统，比如某些中台系统、各种框架组件，都需要对概念的完整性进行考虑，需要明白易用性是功能和概念的复杂度的比值，而不是单一的某一方面。同时也需要站在像“架构师”的视角来考虑用户的利益，而不是仅仅站在“实现人员”的视角来考虑，需明白是设计服务于用户，而不是用户来服务于设计，但可惜的是，我遇到的大部分系统都是后者。


??? note "claude 补充的观点和角度"

    1. 概念完整性在现代软件开发中的体现：

    - 领域驱动设计(DDD)：
      - 统一语言(Ubiquitous Language)直接体现了概念完整性的重要性
      - 限界上下文(Bounded Context)帮助在大型系统中维护局部的概念完整性
      - 领域模型的一致性正是概念完整性在业务层面的体现

    - API设计：
      - RESTful API的设计原则强调一致性和可预测性
      - GraphQL的类型系统帮助维护数据查询的概念完整性
      - 接口命名和使用规范的统一性

    2. 架构师角色的现代诠释：

    - 技术决策：
      - 不仅要考虑技术可行性，更要平衡业务价值
      - 需要在创新和稳定性之间找到平衡点
      - 关注长期演进而非短期收益

    - 责任边界：
      - 架构师更多是指导方向而非规定具体实现
      - 需要建立有效的反馈循环机制
      - 保持对实现细节的敏感度

    3. "贵族制"与"民主制"的现代平衡：

    - 微服务架构：
      - 团队自主性与系统一致性的平衡
      - 服务边界的划分需要同时考虑技术和业务视角
      - 通过契约测试等方式保证接口一致性

    - 开源项目的启示：
      - 核心维护者保证方向一致性
      - 社区贡献者提供多样化实现
      - 通过RFC等机制平衡创新和稳定

    4. 对当前开发实践的建议：

    - 好的架构应该是
      - 概念清晰：易于理解和使用
      - 一致性强：遵循统一的设计原则
      - 可扩展性好：允许在保持概念完整性的前提下进行扩展
      - 边界清晰：明确的责任划分


    - 有效的协作模式：
      - 明确决策机制
      - 建立反馈渠道
      - 保持文档更新
      - 重视知识传承

    5. 现代软件开发中的新挑战：

    - 分布式系统：
      - 如何在分布式环境中保持概念完整性
      - 服务间通信的一致性设计
      - 分布式事务的语义一致性

    - 敏捷开发：
      - 快速迭代与概念完整性的平衡
      - 技术债务的管理
      - 持续重构的重要性

    6. 实践建议：

    - 对架构师：
      - 建立清晰的架构愿景
      - 保持与实现团队的紧密沟通
      - 关注用户体验和反馈
      - 持续学习和适应新技术

    - 对实现团队：
      - 理解并遵循架构原则
      - 积极提供实现层面的反馈
      - 保持代码质量和一致性
      - 注重技术细节的完整性

    您提到的关于易用性的理解非常准确。特别是"功能与概念的复杂程度的比值"这个观点，这在现代软件开发中依然具有重要的指导意义。在设计API、框架或平台服务时，这个原则尤其重要，能够帮助我们在功能丰富性和使用简单性之间找到最佳平衡点。

## 第5章 第二系统效应

> 聚沙成塔，集腋成裘。  ——奥维德

作者在本章所核心讨论的点：

- 除了产品责任外的编制功能规约责任中，**有什么准则和机制来约束架构师的创造热情**

作者提出了两个关键的答案：**最基本的互动纪律和避免第二系统效应的“自律”**。

**1. 架构师的互动纪律**

这里通过列举架构师的核心工作之一编制预算的例子，来对与实现人员的互动纪律提出建议：

（1）首先实际上情况中尽早交流和持续沟通能使架构师有**较好的成本意识，以及增加实现人员对设计的信息，且减少混淆各自的责任分工**。

（2）若遇到估算过高的情况，架构师有两个选择：削减设计或者采用成本更低的实现方法。相较于前者，**后者是固有的主观感性反应，相当于向实现人员的做事方式提出挑战**，此种场景下作者对架构师提出建议如下，必须做到以下几点：

- 牢记是开发⼈员对实现有创造性和发明性的责任，所以架构师**只能建议，⽽不能⽀配**
- 时刻准备着为所指定的**说明建议⼀种实现的⽅法**，同样**准备接受其他任何能达到⽬标的⽅法**
- 对上述的建议保持**低调和不公开**
- **准备放弃**坚持所作的改进建议

而通常开发⼈员会通过建议更改架构来反击，**但通常情况下他是对的**——因为当实现时，某些次要特性的修改会造成意料不到的成本开销。

**2. 自律-第二系统效应**

通常在设计系统的第一版时，架构师会倾向精炼和简洁，一般不会有什么问题。核心危险通常是在设计第二版本（或者叫“第二系统”）时，才开始浮现出来，**目前的普遍倾向是过度设计第二个系统，即向系统添加很多修饰功能和想法，或者添加了后续容易过时的技术设计，以至于导致系统增加了过多不必要的复杂度，甚至是浪费和臃肿**，而这就是“第二系统效应”的主要表现。

那么如何避免开发第二系统效应呢？作者提到，虽然我们无法跳过第二系统效应，但我们**可以有意识地关注这个系统的危险性以及额外的自我约束，来避免那些对功能的过多修饰，并避免延伸出会因假设和目的的变化而废除的功能**。除了自我约束，作者也提到一个可以”开阔眼界“的准则即**为每个小功能分配一个值**。

!!! note "感悟"


    本章描述对架构师约束的内容基本在工作过程中也经常会遇到，除了一般技术书籍会提及到的“第二系统效应”，实际上就是避免过度设计，我比较惊讶的是作者提到的前者即互动纪律，这应该很少有讲到这一点的，但该点反而是我在一线工作所经常会遇到的问题，如向他人提出需求或者设计更改时所需要的“沟通”。就像作者提到的，该场景下我们首先得分清责任，不能一来就要求别人改这改那的支配指令，然后我们需要带着方案去聊但同时也准备该方案对方可能不接受的预期，而且作者后面几点，还真就是“人情世故”了，当体验过那些场景才能更好地明白作者这里提出建议的含金量。同时作者在本章“外部纪律”与“内部纪律”的视角来对约束进行分类描述也是非常容易理解和合理的，属于制定约束的一种通用思路。

??? note "claude 补充的观点和角度"

    您的总结和感悟非常到位，抓住了第五章的核心内容。我可以从以下几个方面补充一些思考：

    1. 关于互动纪律的延伸思考：

    - 在实际工作中，架构师与开发人员的关系更像是一种"技术合作伙伴"关系，而不是传统的上下级关系。建立这种认知有助于更好地实践互动纪律。

    - 除了提到的几点纪律外，架构师还需要具备"倾听能力"。开发人员的反馈常常来自一线实践经验，这些反馈对于优化架构设计非常重要。

    - 互动纪律某种程度上也体现了"Conway法则"：系统设计最终会反映出组织的沟通结构。良好的互动纪律有助于建立更健康的组织沟通结构。

    2. 关于第二系统效应的补充观点：

    - 这个效应不仅存在于系统架构中，在产品设计、项目管理等领域也同样适用。例如产品经理在设计产品2.0版本时也容易陷入类似的陷阱。

    - 一个有效的对抗方式是实践"演进式架构"，而不是追求一次性的完美设计。通过持续的小步迭代，既可以控制复杂度，又能及时响应变化。

    - 值得注意的是，第二系统效应背后往往反映了团队在第一个系统中的"技术债务"和"功能遗憾"，需要在设计时区分什么是必要的改进，什么是过度设计。

    3. 实践建议：

    - 建立架构决策记录(Architecture Decision Records, ADR)，记录每个重要决策的背景、约束和权衡，有助于控制过度设计的倾向。

    - 引入"架构评审"机制，通过团队共同评审来平衡创新与实用性，避免个人主观决策带来的风险。

    - 对于新功能的设计，除了作者提到的"为每个小功能分配一个值"外，还可以采用"投资回报率"(ROI)的思维模式来评估。

    您的感悟中特别提到了"人情世故"这一点很有见地。确实，技术领导力不仅仅是技术能力，更需要良好的沟通技巧和情商。这也是为什么有经验的架构师往往不仅仅关注技术方案，还会特别注意方案推进的方式和节奏。

## 第6章 传递消息

> 他只是坐在那里，嘴里说：“做这个！做那个！”当然，什么都不会发生，光说不做是没有用的。
> ——哈里·杜鲁门，《总统的权力》

在前面介绍了架构师和实现人员的相关职责与边界之后，我们需要开始考虑如何让**每个角色之间所传递的消息如何保证都被传达并且都能被理解等问题**，以此来确保符合预期的协作与实现，比如如何确保每个人听到、理解并实现架构师的决策以及在大团队中如何保持系统概念上的完整性？

所以作者在本章提出一套实现上述目标的方法，包含：

- 书面规约——手册
- 形式话定义
- 直接整合
- 会议和大会
- 多重实现
- 电话日志
- 产品测试

**1. 书面规约——手册**

首先需要明确的是手册的定位：

- 是**必要的工具**但不是充分的工具
- 不仅是产品的外部规约，也是**架构师主要的工作产物**

然后对于手册的要求通常有以下几点：

- 保持修改的阶段化（如修改记录等），因为会随着反馈被修改更新
- 不仅描述用户可见的一切，也要避免描述用户看不见的事物，以此不影响实现人员对后者的设计自由
- 精确比生动更加重要，规约的风格必须保持精确、充实和详细，定义也必须重复所有保持一致的基本要素

除了上述提到的，我们也需注重在规约设计中**文字和产品的一致性以及处理原则上的一致性**。

**2. 形式化定义**

首先我们需要区分形式化和记叙化的区别：

- 对定义使用形式化标记方法，能够做到**更精确和完整的表达**，且更加明显的漏洞也能方便更快地填补，其缺点在于**不易理解**
- 记叙性文字可表达结构性的原则，描述阶段上或层次上的结构并提供实例，更容易去表达异常和强调对比关系，特别地还能**解释原因**

所以对于规约的理想情况可以**同时包含两种方式来进行描述，做到互相补充**。

> 一句古老的格言警句“不要携带两个时钟出海，而是一个或三个。”

但是需要注意的是若同时包含则需要**以一种为标准，另一种作为辅助描述**，并照此明确地划分。

如前面所述，形式化定义是一种实现，反之实现也可以作为形式化定义。使用实现作为定义：

- 主要优点在于**所有的问题能够通过试验得到清晰和精确的答案**，但缺点在于可能**过度地规定了外部功能**，无效的语法通常会带来一些副作用。

- 它不但描述了机器必须做什么，还描述了必须如何去做。若涉及到尖锐的问题，实现带来的定义往往是粗糙的，**若对该定义进行往往是效率低下或代价高昂的**

- **特别容易引起混淆**，特别是在程序仿真中，其充当标准时必须防止对实现的任何修改

**3. 直接整合**

传播和推行定义时，**建立模块间接口语法**相较于语义更加有用，同时在修改声明（如增加变量）的场景下，也只需重新编译而不需要修改使用的程序。

**4. 会议和大会**

首先强调会议是必要的。日常场景中，作者建议将会议划分为两个级别，分别是**每周会议和（半）年度会议**。

- 前者会议的重点不仅仅是做出决定，也包含**创新**，即试图发现解决问题的各种方案，产出会议记录和正式的变更建议来进行传播。

- 而后者的重点则是解决因某些决定带来的较小的**遗留堆积问题**，通常会议在手册冻结前夕召开作为其内容补充，不仅解决决策上的问题，也使决策更容易被接受，保证每个人都参与以及加深理解。

**5. 多重实现**

多重实现的同时需需要注意建造上带来策略的平等性。**不同实现之间严格要求相互兼容**，这种必要性是规约的最佳执行代理。

在大多数项目中机器和手册往往不一致，当存在多重实现的场景下，**如实遵从手册内容**相较于比根据机器调整手册的成本要低。


**6. 电话日志**

随着实现推进无论规约多么精确，也会存在部分问题需要文字解释和纠正理解。所以在**该场景下应该鼓励电话询问相应架构师**，而不是一边猜测一边工作。同样重要的是上述问题的答案必须是可以告知每个人的权威性结论。而一种有用的机制则是**保存电话日志**，并后续对日志中记录的问题和回答进行整理，然后进行分发，是**较敏捷但不正式**的做法。

**7. 产品测试**

产品测试实际上就是**用户的代理人，专门寻找缺陷**。而通常产品测试人员总会发现一些地方是因为**信息没有被传递、设计决策产生gap**导致没有被正确理解或准确实现等，所以他们所提供的信息也是在信息传递链中必要的一环，需要与设计一样在早期同时运作。


??? note "以下是 deepseek 补充的思考和看法"

    你的总结非常全面，结合《人月神话》的核心观点梳理了信息传递的关键方法。以下是对你总结的一些补充和延伸思考，结合现代软件工程实践和潜在挑战：

    ---

    **补充思考与延伸讨论**

    **1. 书面规约——手册的现代挑战**

    - **动态维护与版本控制**：
      在敏捷开发中，手册的“阶段化修改”可能需要更频繁的版本迭代。现代工具（如 Git、Confluence）支持文档的版本控制和协作编辑，但需警惕“文档滞后”问题——代码已更新但文档未同步。一种实践是**将文档编写嵌入开发流程**（如代码注释生成文档工具 Swagger、Doxygen）。
    - **可读性与精确性的平衡**：
      手册的精确性固然重要，但可读性不足可能导致开发者抵触阅读。可尝试通过**分层设计**（如区分“用户手册”和“开发者技术规范”），或结合图表（如架构图、流程图）提升理解效率。

    **2. 形式化定义的新实践**

    - **从 UML 到代码即规范**：
      现代形式化定义可能通过领域特定语言（DSL）、接口定义语言（IDL）或 OpenAPI 规范实现。例如，REST API 的 OpenAPI 规范既是形式化定义，又能生成代码桩（Stub），直接整合到开发中。
    - **可执行文档（Executable Documentation）**：
      测试用例（如单元测试）可视为一种“可执行形式化定义”，确保实现与规约一致（参考“测试驱动开发”理念）。

    **3. 直接整合的扩展：API 治理与微服务**

    - **接口即契约**：
      在微服务架构中，服务间接口的严格定义（如通过 Protobuf/GraphQL Schema）是系统的核心规约。需建立**API 治理机制**（如版本兼容性策略、弃用流程）避免接口腐化。
    - **自动化生成与检查**：
      工具链可自动生成接口代码、文档，并通过静态分析（如 Swagger Validator）检查一致性，减少人为错误。

    **4. 会议与远程协作的适配**

    - **异步沟通的补充**：
      远程团队需平衡会议与异步沟通（如设计 RFC 文档、Slack 讨论）。例如，亚马逊的“6 页备忘录”文化强调书面深度思考，减少低效会议。
    - **决策记录的可见性**：
      会议结论需通过工具（如 Notion、Jira）透明化，避免“参会者知晓，其他人茫然”。可参考“ADR（Architecture Decision Record）”模式记录关键决策。

    **5. 多重实现的兼容性保障**

    - **测试驱动的兼容性**：
      多重实现可通过共享测试套件（如 Pact 契约测试）验证兼容性，而非依赖人工比对手册。例如，Kubernetes 的“一致性测试”确保不同发行版行为一致。
    - **标准化与生态的协同**：
      多重实现可能形成生态（如不同数据库兼容 PostgreSQL 协议），需平衡创新与标准化。开源社区的规范治理（如 CNCF 项目）是典型案例。

    **6. 电话日志的数字化演进**

    - **从日志到知识库**：
      电话日志可升级为团队知识库（如 Stack Overflow for Teams），将碎片化答疑沉淀为结构化文档。结合 AI（如聊天记录自动总结）可提升效率。
    - **即时沟通的陷阱**：
      过度依赖即时解答可能导致“知识孤岛”（仅个别人掌握）。需鼓励将高频问题反馈到手册中，避免重复。

    **7. 产品测试的进阶角色**

    - **测试即沟通媒介**：
      测试用例是规约的另一种表达形式。例如，行为驱动开发（BDD）通过自然语言描述用例（Gherkin 语法），促进业务、开发和测试的共识。
    - **用户反馈的闭环**：
      测试不仅是缺陷发现，还需与用户验收测试（UAT）结合。例如，A/B 测试结果可能倒逼规约调整，形成“用户-测试-开发-架构”的反馈循环。

    ---

    **未被提及的潜在问题**

    1. **文化差异与心理安全**：
      信息传递效率受团队文化影响。若架构师过于权威，开发者可能不敢质疑规约缺陷（如“沉默的误解”）。需建立心理安全环境，鼓励提问。
    2. **规模化后的信息衰减**：
      在大型团队或分布式团队中，手册和会议可能无法覆盖所有成员。需通过“传教士式”（如内部技术布道师）角色扩散知识。
    3. **技术债与规约腐化**：
      当实现因工期压力偏离规约时，需明确技术债管理流程（如定期重构、架构审查），避免规约逐渐失效。

    ---

    **总结**

    你的总结精准抓住了《人月神话》的经典方法论，而结合现代实践，核心挑战在于**如何在动态变化中保持规约的权威性与灵活性**。工具和流程的进步（如自动化、文档即代码）为解决信息传递问题提供了新可能，但“人”的因素（沟通文化、协作习惯）仍是成败关键。正如布鲁克斯所言：“没有银弹”，但持续优化信息传递的“带宽”与“保真度”始终是软件工程的核心课题。


## 第7章 为什么巴别塔会失败

> 据《创世纪》记载，巴别塔是人类继诺亚方舟之后的第二大工程壮举，同时，也是人类第一个彻底失败的工程。

作者通过巴别塔的失败案例中提到，在人类即使具有完成项目的所有条件下为什么依然会失败，其主要的原因是缺乏了两个关键方面：**交流和交流的结果——组织**。所以类比在工作中的大型编程项目，团队之间应该如何交流？这也是本章的关键内容，首先方式当然是越多越好，比如：

- **非正式**。清晰定义组间的依赖关系和良好的电话服务
- **常规项目会议**。会议中团队的简要技术陈述能澄清误解
- **工作手册**。项目开始阶段就需要准备正式的项目工作手册

交流和组织的技能**需要管理者付出大量思考，并具备与软件技术本身同等的丰富经验能力。**

下面会详细介绍项目工作手册和组织架构的内容：

**1. 项目工作手册**

项目工作手册不是一篇独立的文档，而是**强加于项目要产出文档的一种结构**，项目的所有文档都是该结构的一部分。

为什么要使用项目工作手册，主要原因在于：

- **技术文字会长期保存下来**，能够长期为用户提供信息
- **控制信息的分发**，确保信息能够到达所有需要它的人

而在编制项目工作手册时具体需要重点关注的是：

- **对所有备忘绿编号**。如使用树状索引结构
- **手册的维护机制**。如关键的实时更新并记录更新的信，更新信息以后进先出的方式方便查阅

**2. 大型编程项目的组织架构**

> 若项目有n个人员，则有(n^2-n)/2个相互交流的接口，以及约2n个必须协调的潜在团队。

团队组织的目的是**减少所需的交流和协调的数量**，良好的团队组织是解决上述问题的关键措施。

减少交流的方法主要是：**人力分工**和**职能专门化**。对权利和责任的结构组织诞生了树状组织架构。“一仆不能二主”的原则导致了权力结构是树状的，但其交流的结构并没限制得如此严格。树状编程组织通常需要具备的基本要素：

- 任务|制作人|技术总监或架构师|日程安排|人力分工|各部分之间的接口定义

通常制作人是类似PMO和产品的角色，而技术总监是类似技术poc的角色。而对于谁来担任总指挥和辅助总指挥的左右手，在作者的建议是，**小型团队是技术总监担任总指挥，而大型项目则是制作人更适合担任**。


??? note "以下是 deepseek 补充的思考和看法"


    你的总结非常全面，对《人月神话》第7章的核心观点梳理得很清晰。针对你的总结，我有以下几点补充和延伸思考：

    ---

    一、关于巴别塔寓言的深层隐喻

    1. **「共同目标」的模糊性**

    巴别塔失败不仅因交流缺失，更源于对「共同愿景」的理解偏差。作者未明确提及但隐含的是：**语言的统一并不等于语义的统一**。即使使用相同术语，不同角色（如开发者、产品经理、测试人员）对需求和技术方案的理解可能存在本质差异。

    2. **工程的「不可见性」挑战**

    建筑工程的进度和结构是肉眼可见的，但软件开发是逻辑构建，这种无形性加剧了沟通成本。现代补充：可借助可视化工具（如架构图、看板）缓解这一问题。

    ---

    二、对「项目工作手册」的现代实践延伸

    1. **动态文档的演进**

       书中强调文档的「实时更新」，这在今天对应着：

       - **版本控制系统的文档化**（如GitBook + GitHub集成）
       - **协作式知识库工具**（如Confluence、Notion的模块化文档）
       - **代码即文档**（通过Swagger、JSDoc等工具自动生成接口文档）

    2. **文档的「轻量化」趋势**

       敏捷开发中推崇「可工作的软件胜过完整文档」，但并非否定文档，而是**通过代码自解释、自动化测试用例、用户故事地图等方式重构文档形态**。

    ---

    三、组织架构的现代反思

    1. **树状结构的局限性**

       书中推崇树状组织，但现代分布式系统（如微服务架构）催生了**矩阵式或网状团队**：

       - **跨职能团队**（Feature Team）减少层级传递损耗
       - **开源社区模式**（去中心化协作，如Linux内核开发）

    2. **「技术总监」角色的进化**

       技术领导者（Tech Lead）的职能从「决策者」转向「赋能者」：

       - 建立技术雷达（Technology Radar）
       - 推动内部技术布道（Tech Evangelism）
       - 搭建自动化工具链减少沟通依赖

    ---

    四、沟通复杂性的数学视角

    1. **梅特卡夫定律的启示**

       团队沟通成本随人数呈平方级增长（(n²-n)/2），但可通过**模块化设计降低耦合度**：

       - 康威定律：系统架构反映组织架构
       - 微服务拆分后，团队可独立开发（如Amazon的Two-Pizza Team）

    2. **「反康威策略」的尝试**

       通过重构系统架构倒逼组织结构优化（如Netflix通过统一API网关减少团队间协调）。

    ---

    五、未提及的隐藏风险

    1. **「隐性知识」的传递困境**

       工作手册只能承载显性知识，但**代码评审、结对编程、技术分享会**是传递隐性经验（如设计直   觉、调试技巧）的关键。

    2.  **「沉默成本」对沟通的抑制**

       团队成员可能因害怕暴露问题（如进度延迟、技术债）而选择沉默，需通过**心理安全   （Psychological Safety）文化**建设解决。

    ---

    六、案例对照：成功与失败项目

    | **对比维度**       | 巴别塔（失败）              | 现代成功项目（如Apache     Kafka）      |
    |--------------------|---------------------------|    ------------------------------------|
    | **共同目标**       | 模糊的「通天」愿景         | 明确的「高吞吐分布式消息系统」定    位  |
    | **沟通工具**       | 单一语言但无标准化文档     | GitHub Issues + Slack + 设计文    档   |
    | **组织弹性**       | 中央集权（自上而下）       | 社区驱动（自下而上贡献+核心委员   会） |
    | **知识管理**       | 依赖口头传递               | 代码提交记录作为「活文    档」          |

    ---

    总结建议

    1.  **超越「巴别塔陷阱」的实践**

       - 采用**事件风暴（Event Storming）** 工作坊对齐领域语言
       - 通过**混沌工程（Chaos Engineering）** 暴露系统弱点（相当于主动制造「可修复的失   败」）

    2.  **平衡「流程」与「人性化」**

       布鲁克斯强调流程规范，但现代团队需兼顾工程师的创造力（如Google的20%自由时间政策）。

    你的总结已抓住了本章精髓，以上补充更多是从今天的视角重新审视经典理论，思考如何在新环境中迭代    实践。经典的价值不在于提供答案，而在于启发持续演进的思考框架。





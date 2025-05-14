# Bonus Unit 3. Agents in Games with Pokemon

## Agents in Games 概述

**1. 游戏中的LLM应用现状**

目前游戏行业已开始采用大型语言模型(LLM)创造更具沉浸感的体验，主要表现在以下技术展示和游戏中：

| 项目名称 | 开发方 | 核心技术 | 主要特点 |
|---------|-------|---------|---------|
| **Covert Protocol** | NVIDIA与Inworld AI | NVIDIA Avatar Cloud Engine | 私家侦探角色扮演，NPC实时回应玩家询问 |
| **NEO NPCs** | 育碧 | 生成式AI | NPC能感知环境、记忆过去互动并有意义地交流 |
| **Mecha BREAK** | 集成NVIDIA ACE | GPT-4o | 玩家可使用自然语言与角色互动，NPC通过网络摄像头识别玩家 |
| **Suck Up!** | Proxima Enterprises | 生成式AI | 玩家扮演吸血鬼，通过说服AI驱动的NPC邀请自己进入民宅 |

**2. 从LLM到Agent的进化**

虽然LLM已经改善了NPC交互的自然性，但Agent技术更进一步，实现了以下突破：

| LLM驱动的NPC | Agent驱动的NPC |
|-------------|--------------|
| 回复更自然多样 | 可自主做决策、规划行动 |
| 保持静态，等待玩家互动 | 能主动采取行动（寻求帮助、设陷阱、主动回避） |
| 仅对玩家输入做出反应 | 可与游戏环境直接交互，执行目标导向行为 |

Agent赋予NPC三大关键能力：
- **自主性**：基于游戏状态独立决策
- **适应性**：根据玩家行动调整策略
- **持久性**：记住过去交互以指导未来行为

**3. 当前Agent的局限性**

尽管潜力巨大，基于Agent的AI目前仍面临实时应用挑战：
- 推理和规划过程引入延迟，不适合节奏快的游戏（如《毁灭战士》或《超级马里奥》）
- 需要大量token用于"思考"和"行动"
- 游戏通常需要约30FPS运行，意味着Agent需每秒执行30次操作，目前的Agent技术尚无法实现

因此，回合制游戏（如宝可梦）成为理想应用场景，为AI提供充分思考和决策时间。

## 构建宝可梦对战Agent

![](https://img.zhengyua.cn/blog/202505121056184.png)

**1. 系统组件概述**

构建宝可梦对战Agent需要四个关键组件：

| 组件 | 描述 | 功能 |
|------|------|------|
| **Poke-env** | Python库 | 训练基于规则或强化学习的宝可梦机器人 |
| **Pokémon Showdown** | 在线对战模拟器 | Agent将在此平台进行战斗 |
| **LLMAgentBase** | 自定义Python类 | 连接LLM与Poke-env对战环境 |
| **TemplateAgent** | 启动模板 | 用于创建自定义对战Agent |

**2. Poke-env核心功能**

Poke-env是由Haris Sahovic开发的Python接口：
- 原设计用于训练强化学习机器人，现已重新用于Agent AI
- 允许Agent通过简单API与Pokémon Showdown交互
- 提供`Player`类，Agent将继承此类以与图形界面通信

**3. LLMAgentBase类详解**

LLMAgentBase是扩展Poke-env的`Player`类的Python类：
- 充当LLM与宝可梦对战模拟器之间的桥梁
- 处理输入/输出格式化并维护对战上下文
- 提供一组标准工具（定义在`STANDARD_TOOL_SCHEMA`中）：
  - `choose_move`：选择攻击动作
  - `choose_switch`：切换宝可梦

核心方法与功能：

| 方法 | 功能 |
|------|------|
| **choose_move(battle)** | 每回合调用的主要方法，返回基于LLM输出的动作 |
| **_format_battle_state(battle)** | 将当前对战状态转换为字符串发送给LLM |
| **_find_move_by_name(battle, move_name)** | 根据名称查找技能，用于LLM响应中的`choose_move` |
| **_find_pokemon_by_name(battle, pokemon_name)** | 定位特定宝可梦进行切换 |
| **_get_llm_decision(battle_state)** | 抽象方法，需在自定义Agent中实现 |

```python
STANDARD_TOOL_SCHEMA = {
    "choose_move": {
        ...
    },
    "choose_switch": {
        ...
    },
}

class LLMAgentBase(Player):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.standard_tools = STANDARD_TOOL_SCHEMA
        self.battle_history = []

    def _format_battle_state(self, battle: Battle) -> str:
        active_pkmn = battle.active_pokemon
        active_pkmn_info = f"Your active Pokemon: {active_pkmn.species} " \
                           f"(Type: {'/'.join(map(str, active_pkmn.types))}) " \
                           f"HP: {active_pkmn.current_hp_fraction * 100:.1f}% " \
                           f"Status: {active_pkmn.status.name if active_pkmn.status else 'None'} " \
                           f"Boosts: {active_pkmn.boosts}"

        opponent_pkmn = battle.opponent_active_pokemon
        opp_info_str = "Unknown"
        if opponent_pkmn:
            opp_info_str = f"{opponent_pkmn.species} " \
                           f"(Type: {'/'.join(map(str, opponent_pkmn.types))}) " \
                           f"HP: {opponent_pkmn.current_hp_fraction * 100:.1f}% " \
                           f"Status: {opponent_pkmn.status.name if opponent_pkmn.status else 'None'} " \
                           f"Boosts: {opponent_pkmn.boosts}"
        opponent_pkmn_info = f"Opponent's active Pokemon: {opp_info_str}"

        available_moves_info = "Available moves:\n"
        if battle.available_moves:
            available_moves_info += "\n".join(
                [f"- {move.id} (Type: {move.type}, BP: {move.base_power}, Acc: {move.accuracy}, PP: {move.current_pp}/{move.max_pp}, Cat: {move.category.name})"
                 for move in battle.available_moves]
            )
        else:
             available_moves_info += "- None (Must switch or Struggle)"

        available_switches_info = "Available switches:\n"
        if battle.available_switches:
              available_switches_info += "\n".join(
                  [f"- {pkmn.species} (HP: {pkmn.current_hp_fraction * 100:.1f}%, Status: {pkmn.status.name if pkmn.status else 'None'})"
                   for pkmn in battle.available_switches]
              )
        else:
            available_switches_info += "- None"

        state_str = f"{active_pkmn_info}\n" \
                    f"{opponent_pkmn_info}\n\n" \
                    f"{available_moves_info}\n\n" \
                    f"{available_switches_info}\n\n" \
                    f"Weather: {battle.weather}\n" \
                    f"Terrains: {battle.fields}\n" \
                    f"Your Side Conditions: {battle.side_conditions}\n" \
                    f"Opponent Side Conditions: {battle.opponent_side_conditions}"
        return state_str.strip()

    def _find_move_by_name(self, battle: Battle, move_name: str) -> Optional[Move]:
        normalized_name = normalize_name(move_name)
        # Prioritize exact ID match
        for move in battle.available_moves:
            if move.id == normalized_name:
                return move
        # Fallback: Check display name (less reliable)
        for move in battle.available_moves:
            if move.name.lower() == move_name.lower():
                print(f"Warning: Matched move by display name '{move.name}' instead of ID '{move.id}'. Input was '{move_name}'.")
                return move
        return None

    def _find_pokemon_by_name(self, battle: Battle, pokemon_name: str) -> Optional[Pokemon]:
        normalized_name = normalize_name(pokemon_name)
        for pkmn in battle.available_switches:
            # Normalize the species name for comparison
            if normalize_name(pkmn.species) == normalized_name:
                return pkmn
        return None

    async def choose_move(self, battle: Battle) -> str:
        battle_state_str = self._format_battle_state(battle)
        decision_result = await self._get_llm_decision(battle_state_str)
        print(decision_result)
        decision = decision_result.get("decision")
        error_message = decision_result.get("error")
        action_taken = False
        fallback_reason = ""

        if decision:
            function_name = decision.get("name")
            args = decision.get("arguments", {})
            if function_name == "choose_move":
                move_name = args.get("move_name")
                if move_name:
                    chosen_move = self._find_move_by_name(battle, move_name)
                    if chosen_move and chosen_move in battle.available_moves:
                        action_taken = True
                        chat_msg = f"AI Decision: Using move '{chosen_move.id}'."
                        print(chat_msg)
                        return self.create_order(chosen_move)
                    else:
                        fallback_reason = f"LLM chose unavailable/invalid move '{move_name}'."
                else:
                     fallback_reason = "LLM 'choose_move' called without 'move_name'."
            elif function_name == "choose_switch":
                pokemon_name = args.get("pokemon_name")
                if pokemon_name:
                    chosen_switch = self._find_pokemon_by_name(battle, pokemon_name)
                    if chosen_switch and chosen_switch in battle.available_switches:
                        action_taken = True
                        chat_msg = f"AI Decision: Switching to '{chosen_switch.species}'."
                        print(chat_msg)
                        return self.create_order(chosen_switch)
                    else:
                        fallback_reason = f"LLM chose unavailable/invalid switch '{pokemon_name}'."
                else:
                    fallback_reason = "LLM 'choose_switch' called without 'pokemon_name'."
            else:
                fallback_reason = f"LLM called unknown function '{function_name}'."

        if not action_taken:
            if not fallback_reason:
                 if error_message:
                     fallback_reason = f"API Error: {error_message}"
                 elif decision is None:
                      fallback_reason = "LLM did not provide a valid function call."
                 else:
                      fallback_reason = "Unknown error processing LLM decision."

            print(f"Warning: {fallback_reason} Choosing random action.")

            if battle.available_moves or battle.available_switches:
                 return self.choose_random_move(battle)
            else:
                 print("AI Fallback: No moves or switches available. Using Struggle/Default.")
                 return self.choose_default_move(battle)

    async def _get_llm_decision(self, battle_state: str) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement _get_llm_decision")
```

**4. 自定义Agent实现**

基于LLMAgentBase，开发者可创建自己的Agent：

```python
class TemplateAgent(LLMAgentBase):
    """使用模板AI API进行决策"""

    def __init__(self, api_key=None, model="model-name", *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.model = model
        self.template_client = TemplateModelProvider(api_key=...)
        self.template_tools = list(self.standard_tools.values())

    async def _get_llm_decision(self, battle_state: str) -> Dict[str, Any]:
        """发送状态到LLM并获取函数调用决策"""
        system_prompt = ("你是一个...")
        user_prompt = f"..."

        try:
            response = await self.template_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            message = response.choices[0].message
            return {"decision": {"name": function_name, "arguments": arguments}}
        except Exception as e:
            print(f"调用过程中意外错误: {e}")
            return {"error": f"意外错误: {e}"}
```

这个模板需要开发者填充系统提示、用户提示以及解析逻辑，以创建具有竞争力的Agent。

## 部署与对战

**1. 对战方式**

完成Agent开发后，有两种方式参与对战：

**方式一：与直播Agent对战**
- 访问Pokémon Showdown Space
- 选择用户名
- 找到当前直播Agent的用户名
- 搜索该用户名并发送对战邀请

**方式二：部署自己的Agent**
1. 复制专用Hugging Face Space
2. 将自定义Agent代码添加到`agent.py`
3. 在`app.py`中注册Agent
4. 从下拉菜单选择Agent
5. 输入Pokémon Showdown用户名
6. 点击"发送对战邀请"
7. 接受对战并享受比赛

## 游戏Agent发展趋势与前景

**1. 可能的改进方向**

完成基础Agent后，可以考虑以下方向进行改进：
- 增强战略思维能力
- 实现记忆机制或反馈循环以提高性能
- 进行实验以提高对战竞争力

**2. 游戏Agent的未来展望**

随着技术发展，游戏Agent有望实现：
- 实时推理能力的提升，减少延迟问题
- 更复杂的环境感知与互动
- 自主学习与策略优化
- 在更多游戏类型中的应用（超越回合制限制）

**3. 游戏体验的革命性变化**

智能Agent将改变游戏体验的核心方面：
- 从"脚本化体验"到"涌现式叙事"
- NPC从静态角色到能动参与者
- 游戏世界从固定规则到动态生态系统
- 玩家体验从预设路径到无限可能

## 总结

在这个附加单元中，我们探索了AI Agent在游戏中的应用，特别是构建了一个能在回合制宝可梦对战中竞争的智能体。通过学习游戏中LLM应用的最新进展，理解Agent与简单LLM的区别，以及构建实际宝可梦对战Agent的全过程，您已经掌握了将智能体技术应用于游戏环境的基础知识。

这一领域仍处于早期发展阶段，面临延迟等技术挑战，但已展现出巨大潜力，特别是在回合制游戏中。随着Agent技术的进步，我们可以期待更智能、更自主的游戏角色，为玩家创造更丰富、更具沉浸感的游戏体验。
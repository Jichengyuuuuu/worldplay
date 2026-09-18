# Worldplay

[English](./README.md) | **中文文档**

[在线试玩](https://worldplay-agent-worlds.applejade.chatgpt.site/)

**创建一个世界，让各怀目标的 Agent 行动起来。你也可以加入其中，改变结果。**

Worldplay 是一个优先在本地运行的多智能体世界 harness。网页试玩和 CLI 共用场景格式与裁定引擎：Agent 提出行动，运行时检查条件、更新资源，并记录实际发生的结果。

## 快速开始

需要 Node.js 22.9+，推荐 24。无需安装 npm 依赖。

```bash
git clone https://github.com/Jichengyuuuuu/worldplay.git
cd worldplay
npm start
# http://localhost:4173
npm test
```

三个内置场景可以直接以**规则演示模式**运行。该模式使用确定性策略，便于体验界面和引擎，不是 AI 模拟。一句话生成世界和模型驱动的角色决策需要连接你自己的模型服务。

## 三个世界

- **权力交接**：五位候选人在继任投票前争取支持，使用共享筹码和个人支持分。
- **拯救 AI 创业公司**：四位利益相关者在 30 天内争取收入与生存空间。
- **失联飞船**：四名船员在氧气耗尽前修复系统、发送求救信号。

场景定义位于 `dist/lib/scenarios.js`。自定义场景支持 2–8 个角色、1–6 项状态、2–10 种行动和 2–30 轮演化。行动可配置资源成本、效果、前置条件、一次性限制及支持分。开局前可以编辑初始状态、角色和场景 JSON。

## 连接模型

将 `.env.example` 复制为 `.env`，填写 `MODEL_BASE_URL`、`MODEL_API_KEY` 和 `MODEL_NAME` 后重启。本地网页会自动使用服务端代理，密钥不进入浏览器。请只配置你愿意向其发送场景上下文的服务商。

也可以在网页模型设置中连接兼容 OpenAI `/chat/completions` 的接口，服务商需支持 JSON 输出和浏览器跨域请求。直连密钥仅存于页面内存。在线静态试玩不提供平台付费的模型服务，模型配置不会进入存档。

每个角色分别调用模型，只接收其观察和可见历史；其他角色的秘密与无权查看的私信会被过滤。调用串行执行，每次最多 60 秒、5,000 个输出 token。响应格式错误会阻止整轮状态提交，但已发生的模型调用仍可能计费。仓库不附带密钥，真实模型的表现需另行验证。

## CLI 与 Agent 接入

```bash
node bin/worldplay.mjs list
node bin/worldplay.mjs init startup
node bin/worldplay.mjs observe ceo
node bin/worldplay.mjs step
node bin/worldplay.mjs inject "大客户要求提前交付"
node bin/worldplay.mjs replay
node bin/worldplay.mjs export
node bin/worldplay.mjs create "四个角色经营一家海边旅馆" --file .runs/hotel.json
```

所有命令支持 `--file SAVE_PATH`。`act ACTION_JSON` 为一个角色提交下一轮行动：

```json
{"actorId":"ceo","action":"pitch","speech":"先约定可验收的交付边界。","target":"sales","visibility":"private"}
```

`edit ACTOR PATCH_JSON` 修改角色；`fork SNAPSHOT_INDEX NEW_PATH` 从历史快照创建分支，不覆盖原存档。可用 `npm link` 在本地安装 `worldplay` 命令，目前尚未发布 npm 包。让自己的 Agent 加载 `skills/worldplay/SKILL.md`，即可遵循观察与行动协议。

## 世界如何运行

1. 生成或加载场景，校验角色、状态和规则。
2. 为每个角色构建独立观察：世界事实、自己的设定、可见消息。
3. 每个角色提交一次行动，用户可以接管并覆盖该角色的决定。
4. 每轮轮换执行顺序，检查前置条件与成本，应用合法效果。
5. 结算环境成本、检查结束条件，保存事件和快照。

这是一套轮换优先级的顺序裁定机制，不是同时行动的战略均衡求解器。消息会影响模型上下文；关系分只是通信积累，不是心理预测。自由文本事件补充背景，确认后的数值效果才会直接更新状态。修改人格会影响模型决策，规则演示不会理解自由文本。

## 存档与回放

网页使用 localStorage，仅在当前浏览器保存进度；CLI 将 JSON 原子写入 `.runs/`。两者使用相同的导入、导出格式。完整存档包含角色秘密。

回放读取已记录的快照，不重新生成模型输出。分支可能产生不同结果，修改不会重写既有历史。v0.1 没有账号系统或共享多人状态。

这是可信本地环境中的沙盘。网页视角过滤和 CLI 观察无法向持有源码或存档的人隐藏秘密，也不构成安全多人服务、预测系统或经过验证的决策训练工具。

## 项目结构

- `dist/lib/engine.js`：校验、观察、裁定、历史与分支。
- `dist/lib/scenarios.js`：三个可编辑场景。
- `dist/lib/model.js`：模型适配器与场景生成。
- `dist/app.js`、`dist/style.css`：网页试玩界面。
- `server.mjs`：本地网页服务与可选模型代理。
- `bin/worldplay.mjs`：使用同一引擎的 CLI。
- `test/`：状态完整性、信息边界、回放与模型适配器测试。

## 第一版边界

当前没有 GraphRAG、外部图服务、现实预测、自动优化、任意代码执行、欺骗意图识别或生产级身份认证。生成的场景经过格式校验，但不保证可解。默认场景展示行动与状态机制；复杂地点和物品模拟可通过后续行动类型扩展。

## 创业公司危机试玩

以 CEO 身份进入第 0 轮。三项预设交易围绕团队留任、缩小交付范围和过桥融资展开。你可以私聊查看条件、接受交易，运行时按期限检查承诺。缩小范围的验收成功计为真实订单；融资对赌失败会记录失去经营权。重复接受不会重复发放资源。

关键事件发生后自动运行暂停，结局展示已记录的承诺，并支持从开局创建分支。三个 Demo 的引导均可逐步跳过或全部跳过，也可在当前浏览器设置跳过所有引导。跳过不推进时间，不替你作决定。

这些交易由明确规则裁定，自由发言不会自动建立合同。模型模式仍负责角色下一轮决策。旧存档保留原玩法，新开一局即可体验危机流程。

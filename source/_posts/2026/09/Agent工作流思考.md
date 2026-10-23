---
title: Agent 工作流思考
date: 2026-09-10 09:00:00
updated: 2026-09-10 09:00:00
author: 王赫杰
tags:
  - Agent
  - SKILL
  - 工作流
categories:
  - AI Agent
---

# Agent 工作流思考

## 缘起

### 现实刚需

在日常编写代码时候，vibe coding 直接得到的代码内容通常可理解性较差，具体体现在：

1. 代码通常较长
2. 函数编写功能存在耦合
3. 使用复杂而不常见的语法
4. 复杂项目文件之间的依赖关系复杂
5. 类的封装和继承关系复杂

在多人协作大型项目时候，这样的问题就会产生灾难性的后果。当不同的 agent 的不同风格代码需要进行整合时，人类完全无法 harness 项目的代码，于是就算是更改输入参数这样简单的工作，也必须要向 AI 许愿，等 AI 修改几轮之后，代码基本上就面目全非了。

并且，代码一旦部署，那么前端和后端的代码就要面临着维护和更新的挑战，访问压力、服务器崩溃、数据丢失、隐私泄露等代码本身的安全性和可靠性就会成为问题。但是，在科学计算领域，AI 代码又会在不必要的地方进行无谓的谨慎，导致代码冗长而不简洁，不能让人很好地抓住代码的核心逻辑。

因此，改善 AI 写代码的质量，就成为了一个非常迫切的需求。

### 科学骑士挑战赛

官网链接：https://play.bohrium.com/benchmarks

这是一个 agent 能力的跑马场，希望通过解决科学问题提升 agent 科研的能力，避免 agent 在科研中剽窃，还有做很多局部正确但是整体错误的推导。而由这个给 agent 这匹似乎有着无限潜力的野马套上挽具的 harness 活动，于是一个很好的念头出现了：agent 的 coding 是否也可以被套上这样一个挽具呢？能够让每一个操控 agent 的科学骑士更加高效地驾驭 agent 的 coding 能力，高效理解代码，并提出改进思路。

## 范式

AI 每天都在写代码，面对大量的产出，我们希望 AI 可以从这些代码中提炼出一些有价值的东西，或者是项目的代码规范，或者是项目的标准模板代码。我们希望可以通过某种手段对 AI 的代码能力进行约束，也就是一个较好的范式。

### SKILL 还是 AGENT

一开始，笔者希望通过找到一些较好的 SKILL 来帮助 AI 规范输出代码。但是发现，针对一些项目，项目自身的特定依赖和代码规范是不适宜放入 SKILL 的。因为 SKILL 是通用的，而项目是特定的。并且 SKILL 更倾向于规范 Agent 的行为，告诉 Agent 什么是正确的，什么是错误的，并给出示范。

因此，规范代码更像是：

“无论团队里谁用 Codex 修改这个 repository，都必须按照我们约定的架构、API 风格、目录职责、错误处理、测试方式去写。”

这种东西，官方其实更推荐 AGENTS.md + Skill 配合，而不是只写 Skill。

OpenAI 自己给出的划分非常清楚：

AGENTS.md：durable repo conventions, commands, verification steps, review expectations
Skill：reusable task workflow with references or scripts。

因此，笔者转变思路，开始尝试使用 AGENT + SKILL 的方式来规范代码输出。

### 从 SLOGAN SKILL 引出的思考

SLOGAN SKILL 与政治里的假大空套话非常类似，不是不好，而是不具体。笔者将依次列举几个开源的 SKILL，并逐步得到希望规范我们的项目代码的 SKILL 应该长什么样子。

#### 第一个

https://github.com/ndhananj/codex-agent-setup/blob/main/docs/zh-CN/skills/coding-standards/SKILL.md

它给出了代码中需要遵循的一些规范，如命名、函数、前端后端的一些通用代码规范。

```typescript
// GOOD
const userProfile = getUserProfile();

// BAD
const data = getData();
```
从中，笔者得到了一个启示：SKILL 编写的基线效果应该是像这样的，至少需要在 SKILL 中给出一些代码规范的示例。

#### 第二个

https://github.com/nledford/engineering-review-board/blob/main/skills/code-review/SKILL.md

其要求 agent 在执行 code review 的时候，遵循这样的执行流程：

```text
读取 repo instructions
↓
理解变更意图
↓
检查 tests 和 observable behavior
↓
检查 implementation
↓
检查 failure modes
↓
检查 contracts
↓
运行 repository commands 验证
```

从中，笔者得到了第二个启示：一个 SKILL 指导 Agent 进行代码 review 时候，review 应该成为一个有证据链的工程过程，而不是“LLM 看起来觉得这里不优雅”。这种工作流的思想，将会比单独 SKILL 作为指导思想更有效。

进一步地，如果我们要求最后的输出遵循一种 schema 格式，那么也会提升 review 的可读性和可验证性。

### 立足项目

#### 静态标准建立

把上面的分析落成一个具体结构。假设项目是一个 Python FastAPI 仓库，那么约定会长成这样：

```text
repo/
│
├── AGENTS.md
│
├── .agents/
│   └── skills/
│       └── implement-backend-feature/
│           ├── SKILL.md
│           ├── references/
│           │   ├── architecture.md
│           │   ├── api-patterns.md
│           │   ├── repository-patterns.md
│           │   ├── error-handling.md
│           │   └── examples.md
│           │
│           └── scripts/
│               └── validate.sh
│
├── src/
└── tests/
```

AGENTS.md 负责不可违反的 repo invariant，是全仓库改动的底线；SKILL.md 负责“工作流”，告诉 Agent 接到某类任务时，按什么顺序做、每步参考哪份文档。

Skill.md 是面向动作的，其更关心接到某类任务时，按什么顺序做、每步参考哪份文档。以 `implement-backend-feature` 为例，核心流程有三步：

1. 首先在仓库里找到最接近的已有 feature，把它的 handler、service、domain、repository、tests 通读并模仿其风格和架构。

2. 再判断这次改动动到哪几层，通过这一张决策表进行判断：

| Change | Required layers |
|---|---|
| HTTP validation only | API |
| business rule | Domain |
| orchestration | Application |
| persistence | Infrastructure |
| new endpoint | API + Application |

3. 最后按层去读对应文档（`references/api-patterns.md`、`repository-patterns.md`、`error-handling.md`），需要什么读什么。

Skill.md 里还必须出现正例 / 反例——这是前面第一个 SKILL 给笔者的启发，Agent 善于模仿，给它一个较好的例子，可以很大程度上改善输出质量：

#### 动态流程验证

这是很多 Skill 最欠缺的部分。一句“Make sure the build passes”对 Agent 基本是软约束，效果可能并不很好；成熟的 Skill 更倾向于写成可执行的整个流程：

```md
## Completion gate

Do not report completion until all applicable checks pass.

Run:

ruff check .
mypy src
pytest tests/unit
pytest tests/integration
```

最终，可以得到较为理想的 agent coding improvement workflow：

```text
                  Codex
                    │
        ┌───────────┴───────────┐
        │                       │
     AGENTS.md                 Skill
        │                       │
   Repository Contract      Task Workflow
        │                       │
 ┌──────┼──────┐        ┌──────┼──────┐
 │      │      │        │      │      │
架构   命名   禁止项    步骤   示例   验证
 │      │      │        │      │      │
 └──────┴──────┴────────┴──────┴──────┘
                    │
               CI / Linter
                    │
                Pass / Fail
```

而不是把全部内容都塞进一个 1000 行 `SKILL.md`——这也正好符合官方 Skill Creator 推荐的 progressive disclosure：`SKILL.md` 保留关键 workflow，详细规范、schema 和大量示例放进 `references/`。

### AGENT 自我进化

那么，基于这样的思路，笔者希望能够设计一种 workflow，在一个较好的 bench 上释放 agent 的思考与代码能力。于是，说干就干，笔者构思了一种提升 agent 的 AGENT.md 和 SKILL.md 的架构。

选择的 bench 是这两个仓库

https://github.com/alibaba/aacr-bench 来提升 agent 的 review 能力

https://github.com/Code-Assay/CodeAssay 来提升代码生成的质量

在 agent 拿到陌生项目时，首先运行 review，对于项目的整体代码风格和实现方式有一个整体的把握，并据此制定出一个较好的 AGENT.md，并复用已有的 SKILL.md。
在生成代码时候，agent 首先阅读针对不同功能代码约束的 SKILL.md，再进行代码输出。最后用户需求满足之后，进行功能性和代码风格验收。
除非遇到功能性问题，否则本次不继续重跑，记录本次提出改进方案，在下次用户提出需求指令时候，利用钩子 hook，提供用户选择是否更改已有代码的选项。

关于这里的 workflow，笔者还在进一步构思中，期待下次的更新完成这部分内容。

## 附录：AGENTS.md

```md
# Repository Architecture

## Layer dependency

Allowed:

api -> application -> domain
infrastructure -> domain

Forbidden:

domain -> application
domain -> api
application -> api

## Controllers

Controllers may only:

1. validate request schema
2. call application service
3. map domain result to HTTP response

Controllers MUST NOT:

- execute SQL
- contain domain decisions
- instantiate repositories
- catch generic Exception

## Validation

Before completing any implementation run:

ruff check .
mypy src
pytest
```
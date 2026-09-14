---
name: skill-maturity-evidence-reviewer
description: Assess whether a Codex Skill has enough structural, boundary, dependency, repository, and real-world evidence for a requested maturity level. Use before promoting draft, experimental, stable, or deprecated status.
license: MIT
---

# Skill 成熟度证据审查

## 触发条件

当 Skill 要进入正式 Registry、提升成熟度、标记弃用，或需要解释为什么仍处于 `draft`、`experimental` 或 `stable` 时使用。

## 输入

接收目标成熟度、Skill 内容、来源与许可结论、依赖清单、结构检查、行为用例、仓库运行记录和真实业务结果。未执行的验证必须明确标出。

## 执行步骤

1. 检查触发条件、输入、步骤、输出、边界、失败处理和验证方法是否完整。
2. 核对内部依赖已注册、外部依赖可获得，权限和费用边界清楚。
3. 将证据分为结构验证、合成行为、仓库实际运行和真实业务结果。
4. 按成熟度模型判断最高可支持级别，不用测试数量代替行为质量。
5. 输出通过证据、缺失证据、回退条件和下一次评估入口。

## 输出

输出建议成熟度、证据矩阵、失败与边界结果、阻塞项和复验计划。建议必须与 Registry 中的 `evaluation.status` 一致。

## 权限与边界

不得伪造测试、把未执行写成通过，或为了发布降低标准。没有真实业务证据时不能仅凭结构测试把业务 Skill 提升为稳定。

## 失败处理

关键输入缺失时保留当前成熟度或降为更低的可证明级别。工具不可用时记录未执行原因，并提供具体复验步骤。

## 验证方法

使用结构合格但无行为证据、合成行为通过、仓库真实运行通过和真实业务通过四类用例。证据保存在 `evals/skill-maturity-evidence-reviewer/`。

---
name: zeve-skill-release-auditor
description: Audit a Zeve OS skill release for naming, registry, dependency, evaluation, distribution, and changelog consistency. Use before tagging or publishing a marketplace release.
license: MIT
---

# Zeve Skill 发布审计

## 触发条件

当用户需要“在发布前审计 Skill 命名、注册、依赖、评估、分发与变更记录的一致性”时使用。若输入来源、权限或任务目标不满足边界要求，先说明缺口并采用安全的降级输出。

## 输入

需要目标版本、候选变更、四份 Registry、插件清单及验证记录。若只提供部分材料，先标出审计范围，不能把未检查项写成通过。

## 执行步骤

1. 确认版本范围与候选资产清单，检查所有 Skill ID 是否遵守 `zeve` 前缀规则。
2. 核对 Registry、源目录、插件镜像、代理引用和显式依赖是否一致。
3. 检查每项资产的许可证、评估记录、成熟度依据和变更日志。
4. 运行仓库规定的自动检查并区分失败、警告与未执行项。
5. 生成发布门禁结论，列出阻断项、负责人和可复验命令。

## 输出

输出发布审计表，包含检查项、证据、状态、阻断级别和修复建议；最后给出“可发布”或“不可发布”的明确结论。

## 权限与边界

只读取和审计仓库资产；不替用户弱化规则、不伪造测试结果、不自动推送远端或发布制品。

## 失败处理

验证工具不可用时记录未执行原因并提供替代检查；关键证据缺失时结论必须为不可发布。

## 验证方法

使用成功、缺失输入和边界风险三类合成用例验证；逐项检查输出结构、事实边界和失败降级。证据保存在 `evals/zeve-skill-release-auditor/`。

---
name: skill-wave-reviewer
description: Review a deterministic batch of candidate Codex Skills against provenance, license, redistribution, structure, dependency, behavior, and availability gates. Use for scheduled marketplace evidence waves and incremental re-review; do not promote candidates from declarations alone.
license: MIT
---

# Skill 批次证据审查

## 触发条件

当 Marketplace 需要按治理批次逐项核实候选 Skill，或新的作者、许可证、来源、依赖、运行结果到达后需要重审对应条目时使用。单纯统计数量或直接安装候选时不触发。

## 输入

接收确定性批次、全量治理目录、最新 Inventory、飞书只读审计、正式 Registry 和可验证的新证据。每个条目必须有稳定逻辑 ID；路径只能使用去敏别名。

## 执行步骤

1. 锁定批次和来源快照，确认每个逻辑 Skill 只出现一次。
2. 逐项记录可访问源包、作者声明、许可证声明、来源分类、运行状态、结构问题和重复关系。
3. 分别判断所有权、适用许可证、再分发资格、结构、依赖和行为六个门槛；声明与验证事实分开。
4. 给出可纳管、来源缺失、运行结构阻塞、来源许可阻塞或仅外部参考的结论。
5. 证据不足时写明下一证据动作；不得用本地存在、名称或 MIT 字样替代权威证据。
6. 汇总批次覆盖率、可纳管数、阻塞原因和实际变更数，并运行漂移检查。

## 输出

输出每项的证据、门槛结果、正式化决定、原因、下一证据动作和是否执行变更；同时输出批次汇总与全量索引。新证据只重审受影响条目。

## 权限与边界

默认只读。不得修改、复制、合并、删除或安装原 Skill，不得写入飞书。只有所有权、许可证、再分发、依赖和行为证据全部通过时，才能进入正式纳管流程；正式写入还要遵循仓库发布规则。

## 失败处理

源包找不到时保留 `blocked-source-package-missing`；运行结构失败时保留 `blocked-runtime-structure`；外部资产缺少再分发证据时保留 `external-reference-only`。生成文件漂移或覆盖不完整时停止发布并重新构建。

## 验证方法

使用本仓库 18 个批次、895 个非正式逻辑 Skill 运行验证，检查每项恰好一条审查记录、零自动变更、阻塞原因完整和确定性重建。证据保存在 `evals/skill-wave-reviewer/`。

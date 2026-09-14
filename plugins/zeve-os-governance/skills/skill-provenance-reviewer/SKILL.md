---
name: skill-provenance-reviewer
description: Review authorship, source, license, and redistribution evidence for a candidate Codex Skill. Use before formal marketplace intake or when ownership is uncertain; never infer ownership from a local file or product name.
license: MIT
---

# Skill 来源与许可审查

## 触发条件

当候选 Skill 需要核实作者、原始来源、许可证或再分发资格，或治理目录把条目标记为 `ownership-review`、`external-reference` 时使用。纯粹统计文件数量时不触发。

## 输入

接收候选名称、可访问的源文件、来源声明、作者声明、许可证文本、版本和分发目标。缺少的证据保持“未知”，不得从本地路径、名称、安装状态或描述推断原创归属。

## 执行步骤

1. 分开记录观察到的文件、声明的作者、可验证的原始来源和许可证证据。
2. 比对名称、版本、内容哈希与来源链接，标记证据冲突和无法追溯的派生副本。
3. 阅读许可证原文或权威许可记录，判断复制、修改和再分发是否分别允许。
4. 给出 `verified-original`、`verified-third-party`、`declared-unverified` 或 `unknown` 的来源结论。
5. 列出进入正式 Registry 前仍需补齐的证据、负责人和复验方式。

## 输出

输出证据表、来源结论、许可结论、再分发结论、阻塞项和下一步。所有结论都引用具体证据，不把声明写成验证事实。

## 权限与边界

默认只读。不得复制候选 Skill、修改原文件、写入飞书、安装外部资产或声明未证实的原创和许可证。涉及法律解释时只记录许可证条款与技术影响，不代替法律意见。

## 失败处理

来源链接失效、作者不明或许可证缺失时，将结论保持为 `unknown` 并阻止正式纳管。不同副本证据冲突时分别保留，不能选一个方便的版本覆盖其他证据。

## 验证方法

使用仓库原创资产、许可证明确的外部资产和仅存在本地副本的未知资产三类用例，验证通过、外部参考和阻塞三条路径。证据保存在 `evals/skill-provenance-reviewer/`。

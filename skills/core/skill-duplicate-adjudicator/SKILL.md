---
name: skill-duplicate-adjudicator
description: Distinguish duplicate Skill records, identical file copies, related variants, and naming collisions, then propose a reversible evidence-based disposition. Use during marketplace deduplication; do not merge or delete assets automatically.
license: MIT
---

# Skill 重复关系裁定

## 触发条件

当同一名称出现在多个位置、飞书存在重名记录、内容哈希相同，或同名内容存在差异时使用。没有至少两个候选对象时不触发。

## 输入

接收候选记录、规范化名称、路径别名、内容哈希、版本、来源审查结果和运行时状态。路径必须使用隐私安全别名，不能把本机绝对路径写入公开资产。

## 执行步骤

1. 先区分记录重复、完全相同的文件副本、同源版本变体、同名异义和未知关系。
2. 比较哈希、版本、作者、许可证、依赖、运行状态和支持文件，避免只按名称判断。
3. 为每个成员保留独立证据，提出保留主记录、保持并列、改名评估或所有者复核的建议。
4. 标明建议是否需要外部系统写入，以及执行前必须获得的负责人决定。
5. 输出可逆的执行顺序与执行后的复验条件。

## 输出

输出重复组分类、成员证据、建议主记录、保留项、冲突项、所需决定和复验方法。证据不足时输出“未裁定”。

## 权限与边界

只分析和建议。不得自动合并、删除、改名、移动、覆盖 Skill，不得修改飞书记录。内容哈希相同只说明 `SKILL.md` 字节相同，不证明支持文件、许可证或用途相同。

## 失败处理

缺少哈希、版本或来源证据时保持多个成员，不做破坏性处置。名称相同但内容不同则升级为内容变体审查，不能标为安全重复。

## 验证方法

用完全相同副本、同名不同内容和飞书重名记录三类用例验证分类与边界。证据保存在 `evals/skill-duplicate-adjudicator/`。

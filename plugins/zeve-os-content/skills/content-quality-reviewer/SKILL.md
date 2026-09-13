---
name: content-quality-reviewer
description: Review draft content against its strategy, evidence, audience, brand, channel, and risk constraints. Use before approval or publication.
license: MIT
---

# 内容质量审查

## 触发条件

当用户需要“依据策略、证据、受众、品牌、渠道与风险约束审查内容草稿”时使用。若输入来源、权限或任务目标不满足边界要求，先说明缺口并采用安全的降级输出。

## 输入

需要内容草稿、对应策略简报、事实来源、渠道规格和品牌规则。

## 执行步骤

1. 核对草稿是否实现目标并服务目标受众。
2. 逐条检查主张与来源证据，标记无法支持的表达。
3. 检查结构、清晰度、语气、行动指令和渠道规格。
4. 识别误导、隐私、版权、歧视或过度承诺风险。
5. 按阻断、重要、建议三级输出可执行修改。

## 输出

输出审查表、证据缺口、风险等级、修改建议和最终结论；引用具体段落而不重写整篇。

## 权限与边界

不把个人偏好当作硬性规则，不虚构合规结论，不自行发布被审内容。

## 失败处理

缺少策略或来源时只做有限审查，并清楚标注不能验证的维度。

## 验证方法

使用成功、缺失输入和边界风险三类合成用例验证；逐项检查输出结构、事实边界和失败降级。证据保存在 `evals/content-quality-reviewer/`。

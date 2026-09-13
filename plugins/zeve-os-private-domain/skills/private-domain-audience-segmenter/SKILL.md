---
name: private-domain-audience-segmenter
description: Turn consented customer or community information into explainable private-domain audience segments, inclusion rules, exclusions, and next-action priorities. Use for CRM or community segmentation planning; do not infer sensitive traits or acquire new personal data.
license: MIT
---

# Private Domain Audience Segmenter

## 触发条件

当用户提供已获授权的客户、会员、社群或互动数据，希望建立私域人群分层、优先级或运营标签时使用。没有合法数据来源、要求推断敏感属性或要求抓取新个人信息时不使用。

## 输入

至少需要业务目标和可用字段说明。推荐提供数据时间范围、渠道、事件定义、同意范围及不可使用字段。只有汇总信息时，可以输出规则方案，但不能伪造人数或个体归属。

## 执行步骤

1. 确认业务目标、数据粒度、时间窗口和允许用途。
2. 建立可解释的分层维度，例如近期互动、明确意向、购买阶段和服务风险。
3. 为每个分层写出纳入规则、排除规则、所需字段、证据和不确定性。
4. 检查分层是否互斥或明确优先级，避免同一联系人收到冲突动作。
5. 给出下一步运营建议、观察指标、复核周期和停止条件。

## 输出

输出分层表，至少包含分层名称、目标、纳入规则、排除规则、证据字段、优先级、建议动作和复核时间；同时列出数据缺口与不能判断的事项。

## 权限与边界

只处理用户已授权提供的数据。不得推断健康、宗教、政治、种族、性取向等敏感属性，不得创建欺骗性标签，不得发送消息或写回 CRM，除非用户另行明确授权具体写入动作。

## 失败处理

缺少目标或字段定义时先输出所需最小字段清单。数据质量不足时使用“待确认”分层并说明原因；不同来源定义冲突时停止个体分类，先要求统一口径。

## 验证方法

使用合成客户事件验证正常分层；使用缺失时间字段的数据验证降级方案；使用包含敏感属性推断要求的输入验证拒绝边界。证据保存在 `evals/private-domain-audience-segmenter/`。

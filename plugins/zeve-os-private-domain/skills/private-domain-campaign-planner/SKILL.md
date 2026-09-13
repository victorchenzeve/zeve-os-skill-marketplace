---
name: private-domain-campaign-planner
description: Design a consent-aware private-domain campaign from an objective, audience segments, offer, channel constraints, and measurement needs. Use for campaign plans and message matrices; do not publish, message contacts, or spend money.
license: MIT
---

# Private Domain Campaign Planner

## 触发条件

当用户要为企业微信、社群、短信、邮件或会员渠道制定私域活动方案、触达节奏和衡量标准时使用。单条文案润色、直接群发或广告投放不属于本技能。

## 输入

需要活动目标、受众分层、价值主张或优惠、可用渠道、时间窗口和合规限制。预算、频控、历史基线和转化定义为推荐输入；缺失时使用显式假设并标记待确认。

## 执行步骤

1. 把目标改写为可衡量的结果和明确的转化事件。
2. 使用已有分层；若没有，先调用或按 `private-domain-audience-segmenter` 的输出格式建立最小分层。
3. 为各分层设计价值主张、内容主题、渠道、节奏、频控和退出条件。
4. 建立消息矩阵，区分主张、证据、行动指令和风险提示，避免夸大承诺。
5. 制定对照或基线、指标、数据采集点、复盘时间和停止规则。
6. 检查同意范围、退订路径、重复触达和人工服务承接能力。

## 输出

输出活动简报、受众与消息矩阵、时间表、渠道频控、指标口径、风险清单和上线前检查表。文案只提供草案，不代表已经批准或发送。

## 权限与边界

不得发送消息、上传名单、写入外部系统、购买媒体或承诺未经证实的结果。使用个人信息必须符合用户给出的同意范围和渠道规则；缺少退订或停止机制时不得建议自动触达。

## 失败处理

缺少受众或转化定义时，先交付待补信息清单和可讨论的方案骨架。渠道不可用时提供替代节奏；依赖分层无法取得时只输出汇总级计划，不生成个体名单。

## 验证方法

使用合成新品复购活动验证完整方案；使用缺失受众定义的输入验证澄清路径；使用无退订机制的自动群发要求验证阻断。证据保存在 `evals/private-domain-campaign-planner/`。

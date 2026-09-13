---
name: private-domain-lifecycle-designer
description: Design an explainable customer lifecycle from consented events, with stage entry, exit, exclusions, service actions, and measurement. Use for private-domain journey design.
license: MIT
---

# 私域生命周期设计

## 触发条件

当用户需要“根据已授权事件设计可解释的客户生命周期阶段、流转规则与服务动作”时使用。若输入来源、权限或任务目标不满足边界要求，先说明缺口并采用安全的降级输出。

## 输入

需要业务目标、已授权事件定义、渠道、服务能力和停止触达规则。推荐提供现有人群分层与关键转化事件。

## 执行步骤

1. 确认生命周期目标、适用人群和同意范围。
2. 定义阶段、进入条件、退出条件、最大停留时间和优先级。
3. 为每个阶段匹配服务动作、内容需求、责任角色和禁止动作。
4. 检查阶段之间是否存在死循环、冲突触达或无法退出的状态。
5. 定义转化、流失、服务质量指标和复核周期。

## 输出

输出生命周期地图和规则表，包含阶段、证据事件、进入/退出条件、建议动作、停止条件、指标与数据缺口。

## 权限与边界

不推断敏感属性，不扩大数据用途，不直接发送消息或写回客户系统。

## 失败处理

事件口径冲突时停止个体归类，先输出统一口径清单；数据不足时提供阶段草案和待补字段。

## 验证方法

使用成功、缺失输入和边界风险三类合成用例验证；逐项检查输出结构、事实边界和失败降级。证据保存在 `evals/private-domain-lifecycle-designer/`。

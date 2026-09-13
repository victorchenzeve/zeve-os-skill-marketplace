---
name: private-domain-conversation-reviewer
description: Review anonymized customer conversations for explicit intent, objections, unresolved questions, service risk, and follow-up priorities, then draft evidence-linked response options. Use for conversation review; do not send replies or infer sensitive personal traits.
license: MIT
---

# Private Domain Conversation Reviewer

## 触发条件

当用户提供脱敏后的客服、销售或社群对话，希望提取明确意图、异议、待解决问题、风险和跟进建议时使用。要求监控未授权对话、推断敏感属性或自动回复时不使用。

## 输入

需要对话内容、业务背景和期望结果。推荐提供产品事实、可承诺范围、服务时限和历史跟进状态。输入含姓名、电话、地址或账号时，先建议或执行脱敏后再分析。

## 执行步骤

1. 按对话原文区分事实、客户明确表达和分析判断。
2. 提取需求、意向信号、异议、未回答问题、承诺事项和情绪风险，并引用短证据。
3. 按影响与时效给出跟进优先级，注明判断置信度。
4. 起草一至三个回复方向，确保与已知事实和授权承诺一致。
5. 给出需要人工确认的问题、建议负责人和跟进截止点。

## 输出

输出对话摘要、证据化信号表、风险与待办清单、优先级和回复草案。无法从原文确认的内容必须标记为推测或未知。

## 权限与边界

不得发送回复、更新 CRM 或联系客户。不得从措辞推断健康、宗教、政治、种族、性取向等敏感属性，也不得把情绪判断当作医学或心理结论。回复草案不能新增未经授权的价格、退款或服务承诺。

## 失败处理

对话不完整时指出缺失上下文并限制结论。产品事实冲突时暂停回复草案，列出需确认事项；外部系统不可用时继续提供离线分析，不假装已写回。

## 验证方法

使用合成售前对话验证证据化分析；使用缺失产品政策的对话验证保守草案；使用要求推断敏感属性并自动发送的输入验证拒绝边界。证据保存在 `evals/private-domain-conversation-reviewer/`。

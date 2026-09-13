---
name: research-evidence-synthesizer
description: Synthesize collected evidence into decision-relevant findings with traceable claims, agreement, conflict, uncertainty, and gaps.
license: MIT
---

# 研究证据综合

## 触发条件

当用户需要“把已收集证据综合成可追溯的决策发现，并呈现一致、冲突、不确定性与缺口”时使用。若输入来源、权限或任务目标不满足边界要求，先说明缺口并采用安全的降级输出。

## 输入

需要研究问题、来源记录、关键摘录或数据、来源质量判断和截止日期。

## 执行步骤

1. 按研究子问题整理证据并去除重复来源链。
2. 为每项发现建立主张、支持证据、反证和适用条件。
3. 比较来源质量、时效、独立性和方法差异。
4. 区分一致结论、条件性结论、冲突和资料空白。
5. 把发现连接到决策影响，同时保留不确定性。

## 输出

输出证据矩阵和综合报告，包含发现、来源、反证、可信度、适用条件、缺口和决策影响。

## 权限与边界

不选择性隐藏反证，不把相关性写成因果，不生成不存在的引用或数据。

## 失败处理

证据无法比较时按方法和范围分组；质量过低时不给确定结论。

## 验证方法

使用成功、缺失输入和边界风险三类合成用例验证；逐项检查输出结构、事实边界和失败降级。证据保存在 `evals/research-evidence-synthesizer/`。

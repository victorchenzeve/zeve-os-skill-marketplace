---
name: private-domain-retention-experiment-planner
description: Plan bounded retention experiments for consented private-domain audiences, including hypothesis, cohorts, metrics, guardrails, and stop rules. Use before running a retention campaign.
license: MIT
---

# 私域留存实验策划

## 触发条件

当用户需要“为已授权私域人群设计有假设、对照、指标和停止规则的留存实验”时使用。若输入来源、权限或任务目标不满足边界要求，先说明缺口并采用安全的降级输出。

## 输入

需要留存问题、人群规则、可用渠道、基线指标、资源约束和禁止触达条件。

## 执行步骤

1. 把业务问题改写为可证伪假设并确定主要指标。
2. 定义实验组、对照组、排除条件、分配方式和污染风险。
3. 设计最小干预、触达节奏、观察窗口与成本上限。
4. 设置退订、投诉、服务压力等护栏和提前停止规则。
5. 生成结果判读规则，区分胜出、无结论和负面结果。

## 输出

输出实验卡片，包含假设、人群、干预、对照、指标、护栏、停止条件、判读和复盘安排。

## 权限与边界

不承诺统计显著性，不伪造基线或样本量，不自动抽样、触达或产生费用。

## 失败处理

没有基线时先设计基线采集；人群不可分割时提出准实验或前后对比并标明偏差。

## 验证方法

使用成功、缺失输入和边界风险三类合成用例验证；逐项检查输出结构、事实边界和失败降级。证据保存在 `evals/private-domain-retention-experiment-planner/`。

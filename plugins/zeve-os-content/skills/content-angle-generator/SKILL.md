---
name: content-angle-generator
description: Generate distinct, evidence-aware content angles from an approved strategy brief. Use to expand creative options without inventing facts or copying source material.
license: MIT
---

# 内容角度生成

## 触发条件

当用户需要“基于已批准策略生成差异化且有事实依据的内容角度”时使用。若输入来源、权限或任务目标不满足边界要求，先说明缺口并采用安全的降级输出。

## 输入

需要内容策略简报、可引用事实、渠道和希望生成的角度数量。推荐提供禁用主题与品牌语气。

## 执行步骤

1. 提取受众任务、核心主张、证据和限制。
2. 从问题、误区、过程、对比、案例、清单等框架生成候选角度。
3. 合并语义重复项，并为每个角度写出差异化理由。
4. 检查事实支持、渠道适配、风险和与品牌语气的一致性。
5. 按相关性、证据强度和制作成本排序。

## 输出

输出角度表，包含标题种子、核心张力、证据、适用格式、目标动作、风险与优先级。

## 权限与边界

不照搬受版权保护的表达，不虚构热点、数据、见证或产品能力。

## 失败处理

策略简报缺失时先生成最小简报问题；角度高度重复时减少数量并解释原因。

## 验证方法

使用成功、缺失输入和边界风险三类合成用例验证；逐项检查输出结构、事实边界和失败降级。证据保存在 `evals/content-angle-generator/`。

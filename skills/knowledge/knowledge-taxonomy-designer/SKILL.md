---
name: knowledge-taxonomy-designer
description: Design a maintainable taxonomy for traceable knowledge records, including controlled terms, aliases, placement rules, and change governance.
license: MIT
---

# 知识分类设计

## 触发条件

当用户需要“为可追溯知识记录设计可维护的分类、术语、别名、归类规则与变更治理”时使用。若输入来源、权限或任务目标不满足边界要求，先说明缺口并采用安全的降级输出。

## 输入

需要知识库目标、代表性记录样本、主要用户任务、现有术语和维护责任。

## 执行步骤

1. 从用户任务和记录样本识别稳定概念与检索维度。
2. 建立层级、受控术语、别名和禁止混用词。
3. 为单一归类、多重标签和例外情况写出判定规则。
4. 用边界样本测试重叠、孤儿节点和过深层级。
5. 定义新增、合并、弃用术语的审查与迁移流程。

## 输出

输出分类树、术语表、归类规则、示例、冲突清单和版本维护流程。

## 权限与边界

不把临时项目名固化为通用概念，不覆盖原始来源元数据，不直接迁移生产知识库。

## 失败处理

样本不足时先交付试行分类并标注验证需求；利益相关方术语冲突时保留别名和决策点。

## 验证方法

使用成功、缺失输入和边界风险三类合成用例验证；逐项检查输出结构、事实边界和失败降级。证据保存在 `evals/knowledge-taxonomy-designer/`。

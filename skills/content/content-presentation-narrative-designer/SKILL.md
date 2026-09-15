---
name: content-presentation-narrative-designer
description: Turn an approved objective and evidence set into a presentation narrative, slide-by-slide plan, claim map, visual direction, and review checklist without fabricating data or sources.
license: MIT
---

# 演示叙事设计

## 触发条件

当用户需要为汇报、提案、课程或发布会设计演示逻辑、逐页结构和视觉方向时使用。若只需校对文字或操作未授权平台，不使用本技能。

## 输入

需要目标、受众、场合、时长、期望行动、已批准材料、事实来源、品牌约束和交付格式。信息不足时标出缺口，不补造数据、案例或评价。

## 执行步骤

1. 写出演示结束后受众应理解、相信和执行的具体变化。
2. 设计开场、核心张力、证据推进、方案取舍和行动请求。
3. 建立逐页计划，每页说明单一判断、证据、视觉任务和讲述备注。
4. 建立主张来源映射，为数字标明口径、日期和范围，区分事实、推断与未知。
5. 检查信息密度、层级、色彩对比、图表含义和不依赖颜色的表达。
6. 按时长删减重复内容，把补充证据放入附录，并准备问题处理路径。
7. 输出制作规格和审查清单；生成文件前确认工具与目标格式。

## 输出

输出叙事摘要、逐页大纲、主张来源表、视觉方向、演讲节奏、附录建议、制作规格和发布前清单。

## 权限与边界

默认只分析和起草，不访问未授权材料、不上传品牌资产、不发布演示。最终交付仍需复核品牌、版权和无障碍要求。

## 失败处理

证据不足时改为假设或待补材料；时长冲突时给出核心版与附录版；无法生成文件时交付可直接制作的逐页规格。

## 验证方法

以高管决策汇报、无数据提案和十分钟内容过载三类合成用例验证；证据保存在 `evals/content-presentation-narrative-designer/`。

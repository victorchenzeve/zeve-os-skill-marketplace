# 泽玮 OS Skill Marketplace

用于维护技能、插件、代理及依赖的代码仓库。仓库逻辑名称为 `泽玮-os-skill-marketplace`。

## 快速开始

需要 Node.js 24 或更新版本，无第三方运行依赖。

```sh
npm run validate
npm test
npm run check
```

`validate` 检查注册表格式、版本、重复 ID、文件路径、技能目录、插件成员及依赖环；`test` 运行隔离的有效与无效样例；`check` 执行两者。

## 目录职责

| 目录 | 用途 |
| --- | --- |
| `registry/` | 技能、插件、代理和依赖的正式索引 |
| `skills/core/` | 通用基础能力 |
| `skills/private-domain/` | 私域运营能力 |
| `skills/business/` | 业务与商业能力 |
| `skills/content/` | 内容生产能力 |
| `skills/knowledge/` | 知识管理能力 |
| `skills/research/` | 研究与分析能力 |
| `plugins/` | 组合多个技能的内部插件包 |
| `templates/` | 技能、插件、代理和盘点记录模板 |
| `schemas/` | 注册表 JSON Schema，Draft 2020-12 |
| `tests/` | 自动化完整性与错误场景测试 |
| `evals/` | 技能行为评估用例与结果记录 |
| `scripts/` | 注册表校验工具 |
| `governance/` | 标准、成熟度、版本、依赖和决策规范 |
| `inventory/` | 已安装、外部来源及自建技能的盘点记录 |

注册表扩展名为 `.yaml`，内容采用 YAML 1.2 的 JSON 子集，便于零依赖读写。Schema 可供编辑器或其他工具使用；内置校验器仅实现这些 Schema 当前使用的关键字，不是通用 JSON Schema 引擎。

## 纳入一个技能

1. 将 `templates/skill/` 复制到 `skills/<分类>/<技能ID>/`，填写 `SKILL.md`。
2. 在 `registry/skills.yaml` 的 `skills` 数组添加记录：

```json
{
  "id": "example-skill",
  "name": "示例技能",
  "description": "描述明确的单一能力",
  "version": "0.1.0",
  "path": "skills/core/example-skill",
  "category": "core",
  "maturity": "draft",
  "status": "active",
  "tags": []
}
```

3. 有依赖时，在 `registry/dependencies.yaml` 添加边，如 `{"from":"plugin:example-plugin","to":"skill:example-skill","reason":"提供基础能力"}`。所有端点必须已经注册。
4. 按 `evals/README.md` 添加评估记录，更新变更日志，运行 `npm run check`。

插件使用 `templates/plugin/plugin.json` 的内部格式，注册到 `plugins.yaml`；代理使用 `templates/agent/AGENT.md`，注册到 `agents.yaml`，其 `skills` 数组引用技能 ID。注册表记录格式以 `schemas/` 为准。

插件与代理的完整注册示例、修改移除流程以及提交检查见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 初始状态

四份注册表为空，`plugins/zewei-os-private-domain/` 是预留位置；尚未导入、安装或发布任何技能。本仓库已按用户请求执行只读盘点，结果见 [盘点报告](inventory/REPORT.md)。盘点不改变技能内容或安装状态，后续不会后台自动扫描。

重新盘点与数据文件说明见 [Inventory 使用说明](inventory/README.md)。仓库尚未选定开源许可证；引入第三方内容前需要核查来源及许可。

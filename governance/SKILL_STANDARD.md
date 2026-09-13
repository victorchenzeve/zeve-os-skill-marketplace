# 技能标准

每个正式纳管技能放在 `skills/<分类>/<id>/SKILL.md`；ID 使用小写字母、数字及连字符，以字母开头，注册后保持稳定。

`SKILL.md` 包含 `name`、`description` 前置元数据，以及触发条件、输入、执行步骤、输出、权限与边界、失败处理、验证方法。具体内容参照 `templates/skill/SKILL.md`。

注册记录必须包含 ID、名称、描述、版本、路径、分类、成熟度、状态及标签。名称可以使用中文；路径使用仓库相对路径和正斜杠，不允许越出仓库或通过符号链接引用外部内容。

分类仅限 `core`、`private-domain`、`business`、`content`、`knowledge`、`research`。单一技能应有明确目标；组合能力放入插件。

新增资产需补齐来源和许可信息、评估用例及依赖。自动化校验覆盖注册表结构与引用完整性；语义质量、前置元数据和权限边界由评估与人工审阅确认。

## 可分发资产

正式 Skill 的前置元数据必须声明已核实的许可证；首发原创资产使用 `license: MIT`。需要在 Codex UI 展示时添加 `agents/openai.yaml`，名称、说明和默认提示应与 `SKILL.md` 保持一致。

被插件包含的正式 Skill 仍以 `skills/<分类>/<id>/` 为唯一源。插件目录中的 `skills/` 是发行镜像，只能通过 `npm run plugin:sync` 更新；`npm run marketplace:verify` 必须检查镜像、Registry、内部清单、Codex 清单和 Marketplace 条目一致。

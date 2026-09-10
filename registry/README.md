# 正式注册表

| 文件 | 记录对象 |
| --- | --- |
| `skills.yaml` | 已按仓库标准纳管的技能 |
| `plugins.yaml` | 内部插件包及其技能成员 |
| `agents.yaml` | 代理说明及其技能成员 |
| `dependencies.yaml` | 正式资产之间的显式依赖边 |

四份注册表使用 YAML 1.2 的 JSON 子集，当前结构版本为 `1.0.0`。格式定义见 `schemas/`，运行 `npm run validate` 校验。

当前只进行存量技能盘点，注册表保持空表。已安装技能不会因为出现在 Inventory 中就自动注册。完整盘点入口为 [inventory/REPORT.md](../inventory/REPORT.md)。

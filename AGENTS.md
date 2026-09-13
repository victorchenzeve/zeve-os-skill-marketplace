# 仓库协作约定

本仓库维护泽玮 OS 的技能、插件、代理及其依赖关系。修改前先阅读 README.md 和 governance/ 下相关规范。

- `skills/` 保存正式纳管的技能；`inventory/` 只保存盘点记录，不代表安装或启用。
- 注册表是已纳管资产的唯一索引。新增、移动、删除资产时同步修改 `registry/`。
- 注册表文件使用 YAML 1.2 支持的 JSON 写法；不要改用缩进式 YAML，内置工具以 JSON 解析。
- 不自动复制本机技能、不提交密钥、用户数据、第三方完整代码或未经核实的许可证声明。
- `plugins/<id>/plugin.json` 是本仓库内部格式；Codex 安装清单必须另存为 `.codex-plugin/plugin.json`，并与 Registry 和发行镜像同步。
- 每个技能必须有 `SKILL.md`，并说明触发条件、输入、步骤、输出、边界和验证方法。
- 从 2026-09-14 起，Skill 或其他正式资产 ID 如需英文品牌前缀，统一使用 `zeve`；禁止新增 `zewei` 前缀。中文品牌名继续使用“泽玮 OS”。
- 行为变更同步更新版本和 CHANGELOG.md；架构取舍记录到 governance/DECISION_LOG.md。
- 交付前运行 `npm run check`，检查 `git diff --check`。修改插件成员后先运行 `npm run plugin:sync`。不要仅为通过检查删除资产或弱化规则。
- 默认不推送、不发布、不安装外部资产；按用户明确授权处理这些操作。

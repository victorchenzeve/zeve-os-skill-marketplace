# 泽玮 OS Skill Marketplace

泽玮 OS 的可分发 Codex 技能与插件市场。仓库同时维护正式资产、注册表、依赖、评估证据、安装工具和只读 Inventory。

当前版本：`1.0.0`。首发包含 4 个正式 Skill、1 个 Codex 插件和 1 个代理。

## 正式资产

| ID | 类型 | 用途 | 成熟度 |
| --- | --- | --- | --- |
| `marketplace-asset-curator` | Skill | Marketplace 资产纳管审查 | experimental |
| `private-domain-audience-segmenter` | Skill | 合规私域人群分层 | experimental |
| `private-domain-campaign-planner` | Skill | 私域活动矩阵、节奏与指标 | experimental |
| `private-domain-conversation-reviewer` | Skill | 脱敏客户对话复盘 | experimental |
| `zewei-os-private-domain` | Plugin | 组合三项私域运营能力 | experimental |
| `private-domain-operator` | Agent | 私域运营任务说明与边界 | experimental |

`experimental` 表示已经完成结构、安装和合成用例验证，尚未用真实业务结果证明稳定性。

## 安装 Codex 插件

从本地仓库安装：

```sh
codex plugin marketplace add <本仓库目录>
codex plugin add zewei-os-private-domain@zewei-os
```

安装后新建一个 Codex 任务，使插件 Skill 进入新的任务上下文。仓库发布到 Git 后，也可以把第一条命令的本地路径替换为 Git 仓库地址或 `owner/repo`。

## 安装单个 Skill

Node.js 24 或更新版本可以直接运行仓库 CLI：

```sh
node scripts/marketplace-cli.mjs list
node scripts/marketplace-cli.mjs install private-domain-audience-segmenter
node scripts/marketplace-cli.mjs install zewei-os-private-domain
```

最后一条命令会把插件包含的三个 Skill 安装到 `%CODEX_HOME%/skills`。使用 `--target <目录>` 可以安装到隔离目录；已有非托管目录默认不会被覆盖。卸载会依据安装回执和内容哈希保护本地修改。

发行包安装后也可使用：

```sh
zewei-skill-marketplace list
zewei-skill-marketplace install zewei-os-private-domain
```

完整安装、升级、卸载和制品校验说明见 [DISTRIBUTION.md](DISTRIBUTION.md)。

## 验证与打包

```sh
npm run check
npm run marketplace:list
npm run release:build
```

`release:build` 在 `dist/` 生成 npm tarball、`SHA256SUMS` 和 `release.json`。`dist/` 是本地构建产物，不提交 Git；Git Tag 推送后，Release 工作流会生成同样的可下载制品。

## 目录职责

| 目录 | 用途 |
| --- | --- |
| `.agents/plugins/` | Codex Marketplace 入口 |
| `skills/` | 正式纳管 Skill 的唯一源文件 |
| `plugins/` | 内部插件记录和可安装 Codex 插件包 |
| `agents/` | 正式代理说明 |
| `registry/` | Skill、插件、代理和依赖的唯一正式索引 |
| `evals/` | 行为评估输入、结果和证据 |
| `governance/` | 标准、成熟度、版本、依赖和决策规则 |
| `inventory/` | 只读盘点记录，不代表正式纳管或许可 |
| `schemas/` | 注册表和清单 Schema |
| `scripts/` | 校验、安装、同步、盘点和发行工具 |
| `templates/` | 新资产模板 |
| `tests/` | 注册表、Inventory、安装和安全边界测试 |

插件内的 Skill 是从 `skills/` 生成的发行镜像。修改正式 Skill 后运行 `npm run plugin:sync`，并用 `npm run marketplace:verify` 检查镜像漂移。

## 维护边界

新增或升级资产前阅读 [AGENTS.md](AGENTS.md)、[贡献指南](CONTRIBUTING.md)和 `governance/`。第三方资产必须核实来源和许可证；本地存在或出现在 Inventory 中不代表可以重新分发。

仓库原创代码与首发资产采用 MIT 许可证；盘点记录和第三方元数据的边界见 [LICENSE_SCOPE.md](LICENSE_SCOPE.md)。

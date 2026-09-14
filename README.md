# 泽玮 OS Skill Marketplace

泽玮 OS 的可分发、可安装 Codex Skill Marketplace。仓库维护正式资产、注册表、依赖、评估证据、安装工具和只读 Inventory。

当前版本：`1.2.0`。正式纳管 **25 个 Skill、5 个领域插件、5 个代理**。

## 正式资产

| 领域 | Skill | Plugin | Agent |
| --- | ---: | --- | --- |
| Core | 2 | — | — |
| 私域运营 | 5 | `zeve-os-private-domain` | `private-domain-operator` |
| 业务决策 | 5 | `zeve-os-business` | `business-operator` |
| 内容运营 | 5 | `zeve-os-content` | `content-operator` |
| 知识治理 | 4 | `zeve-os-knowledge` | `knowledge-operator` |
| 研究工作台 | 4 | `zeve-os-research` | `research-operator` |

所有正式资产均为本仓库原创并采用 MIT 许可。两个 Core 治理 Skill 已在真实仓库审计和发行流程中验证为 `stable`；23 个领域 Skill 已通过合成结构与边界用例，保持 `experimental`，等待真实业务结果证明稳定性。每项资产的来源、许可和评估证据均登记在 [Registry](registry/README.md)。

## 从远程 Marketplace 安装

远程版本发布后可直接使用 Git 仓库：

```sh
codex plugin marketplace add <owner>/zeve-os-skill-marketplace
codex plugin list --marketplace zeve-os --available
codex plugin add zeve-os-content@zeve-os
```

可安装插件：`zeve-os-private-domain`、`zeve-os-business`、`zeve-os-content`、`zeve-os-knowledge`、`zeve-os-research`。安装或升级后新建 Codex 任务，使插件 Skill 进入新的任务上下文。

## 安装单个 Skill 或整组插件

Node.js 24 或更新版本：

```sh
node scripts/marketplace-cli.mjs list
node scripts/marketplace-cli.mjs install content-strategy-brief
node scripts/marketplace-cli.mjs install zeve-os-content
```

发行包安装后使用 `zeve-skill-marketplace`。安装器默认写入 `%CODEX_HOME%/skills`，也支持 `--target <目录>`。它用所有权回执和内容哈希保护已有目录与本地修改，并自动迁移 1.0 版回执。

## 验证与打包

```sh
npm run plugin:sync
npm run check
npm run release:build
npm run release:smoke
```

`release:build` 在 `dist/` 生成 npm tarball、`SHA256SUMS` 和 `release.json`；`release:smoke` 从该 tarball 隔离安装 CLI 和五个插件。Git Tag 推送后，Release 工作流重复这些检查并生成可下载制品。每周治理任务还会检查注册、候选队列和发行流程漂移。

## 目录职责

| 目录 | 用途 |
| --- | --- |
| `.agents/plugins/` | Codex Marketplace 入口 |
| `skills/` | 正式纳管 Skill 的唯一源文件 |
| `plugins/` | 内部记录与可安装 Codex 插件包 |
| `agents/` | 正式代理说明 |
| `registry/` | Skill、插件、代理和依赖的唯一正式索引 |
| `evals/` | 行为评估输入、结果和证据 |
| `governance/` | 标准、成熟度、版本、依赖和决策规则 |
| `inventory/` | 只读盘点记录，不代表正式纳管或许可 |
| `schemas/` | 注册表和清单 Schema |
| `scripts/` | 校验、安装、同步、盘点和发行工具 |

插件中的 Skill 是从 `skills/` 自动生成的发行镜像。飞书与本机盘点差异进入 `inventory/candidates/queue.json`，不会自动改表或导入 Skill。第三方资产必须先核实来源和许可证；本地存在或出现在 Inventory 中不代表可以重新分发。当前完成度与外部证据门槛见 [OPERATING_STATUS.md](OPERATING_STATUS.md)，安装、升级、卸载和制品校验见 [DISTRIBUTION.md](DISTRIBUTION.md)。

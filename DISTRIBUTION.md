# 分发与安装

## Codex Marketplace 安装

本仓库根目录包含 `.agents/plugins/marketplace.json`，Codex 可以把本地目录或远程 Git 仓库作为 Marketplace 来源。

```sh
codex plugin marketplace add <owner>/zeve-os-skill-marketplace
codex plugin list --marketplace zeve-os --available
codex plugin add zeve-os-private-domain@zeve-os
codex plugin add zeve-os-business@zeve-os
codex plugin add zeve-os-content@zeve-os
codex plugin add zeve-os-knowledge@zeve-os
codex plugin add zeve-os-research@zeve-os
```

卸载示例：`codex plugin remove zeve-os-content@zeve-os`。远程来源使用 `codex plugin marketplace upgrade zeve-os` 刷新；安装或升级后新建任务加载新的 Skill 上下文。

## 独立 Skill 安装器

```sh
node scripts/marketplace-cli.mjs list
node scripts/marketplace-cli.mjs install <skill-id-or-plugin-id>
node scripts/marketplace-cli.mjs uninstall <skill-id-or-plugin-id>
```

默认目标为 `%CODEX_HOME%/skills`。`--target <目录>` 用于隔离安装。安装器写入 `.zeve-os-marketplace.json` 回执；首次操作会兼容读取并迁移 1.0 版 `.zewei-os-marketplace.json`。已有非托管目录或安装后本地修改不会被覆盖或删除，除非用户显式使用 `--force`。

## 发行制品

运行 `npm run release:build`，得到：

- `dist/zeve-os-skill-marketplace-<version>.tgz`
- `dist/SHA256SUMS`
- `dist/release.json`

接收者先核对 SHA-256，再执行：

```sh
npm install --global ./zeve-os-skill-marketplace-<version>.tgz
zeve-skill-marketplace verify
zeve-skill-marketplace list
```

## 发布检查

1. 更新资产版本、仓库版本和变更日志。
2. 同步插件技能镜像并运行完整检查。
3. 构建 tarball，运行 `npm run release:smoke`，在隔离目录验证 CLI 和五个插件的安装。
4. 创建 `vMAJOR.MINOR.PATCH` 标签并推送远端；GitHub Release 工作流上传制品。

# 分发与安装

## Codex Marketplace 安装

本仓库根目录包含 `.agents/plugins/marketplace.json`，Codex 可以把本地目录或 Git 仓库作为 Marketplace 来源。

```sh
codex plugin marketplace add <本仓库目录>
codex plugin list --marketplace zewei-os --available
codex plugin add zewei-os-private-domain@zewei-os
```

卸载插件：

```sh
codex plugin remove zewei-os-private-domain@zewei-os
```

更新本地 Marketplace 后，重新执行插件安装命令。远程 Git Marketplace 可以使用 `codex plugin marketplace upgrade zewei-os` 刷新来源。安装或升级后使用新任务加载新的 Skill 上下文。

## 独立 Skill 安装器

源码仓库中运行：

```sh
node scripts/marketplace-cli.mjs list
node scripts/marketplace-cli.mjs install <skill-id-or-plugin-id>
node scripts/marketplace-cli.mjs uninstall <skill-id-or-plugin-id>
```

默认目标为 `%CODEX_HOME%/skills`。`--target <目录>` 用于自定义或隔离安装。安装器在目标目录写入 `.zewei-os-marketplace.json` 回执；卸载只处理该回执拥有的 Skill，并在删除前核对目录哈希。

如果目标目录已经存在且不受本 Marketplace 管理，或安装后发生本地修改，命令会停止。只有用户明确选择覆盖或删除本地修改时才使用 `--force`。

## 发行制品

```sh
npm run release:build
```

输出：

- `dist/zewei-os-skill-marketplace-<version>.tgz`
- `dist/SHA256SUMS`
- `dist/release.json`

接收者可先核对 SHA-256，再安装 tarball：

```sh
npm install --global ./zewei-os-skill-marketplace-<version>.tgz
zewei-skill-marketplace verify
zewei-skill-marketplace list
```

## 发布检查

1. 更新资产版本、仓库版本和 `CHANGELOG.md`。
2. 运行 `npm run plugin:sync`，确认插件镜像来自正式 Skill。
3. 运行 `npm run check` 和 `git diff --check`。
4. 运行 `npm run release:build`，在隔离目录安装 tarball 并执行 `verify`。
5. 创建 `vMAJOR.MINOR.PATCH` Git Tag。推送 Tag 后，GitHub Release 工作流生成并上传制品。

发布到远端、npm 或其他外部平台仍需仓库所有者对具体目的地明确授权。

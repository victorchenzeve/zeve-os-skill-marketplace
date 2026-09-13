# 1.0.0 分发验收

执行日期：2026-09-13。环境：Windows、Node.js 24、Codex CLI。所有安装均使用仓库 `.tmp/` 下的隔离目录，没有修改用户真实 Codex 安装。

## 仓库质量门

- `npm run plugin:sync`：通过，私域插件同步 3 个正式 Skill。
- `npm run check`：通过，包括 Registry、Inventory、Marketplace 校验和 35 项测试。
- `git diff --check`：通过。

## 独立 CLI 路径

1. 生成 `zewei-os-skill-marketplace` npm tarball、`SHA256SUMS` 和发行元数据。
2. 在全新 npm prefix 从 tarball 安装 1 个包。
3. 运行已安装的 `zewei-skill-marketplace verify`：通过。
4. 安装与卸载 `zewei-os-private-domain`：3 个成员 Skill 均正确写入和移除。
5. 冲突、共享所有权、本地修改保护与安装/卸载预检由自动化测试覆盖。

## Codex Marketplace 路径

1. 从解包后的 npm 发行包执行 `codex plugin marketplace add`：成功识别 Marketplace `zewei-os`。
2. 执行 `codex plugin add zewei-os-private-domain@zewei-os`：成功安装并启用版本 `0.1.0`。
3. 通过 Codex `skills/list` 重新加载：发现 3 个插件 Skill，加载错误为 0。`codex plugin remove` 也成功完成卸载。

## 制品

`npm run release:build` 生成 tarball、`SHA256SUMS` 和 `release.json`。最终文件名、大小和 SHA-256 以本地 `dist/release.json` 为准；`dist/` 不提交 Git。

## 工具限制

官方 Python 快速校验脚本依赖 `PyYAML`，当前环境未预装。没有为通过校验引入未授权的外部包；仓库自身校验、Codex 官方安装器和运行时发现链路均已成功验证相同的发布结构。

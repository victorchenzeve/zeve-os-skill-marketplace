# 1.4.0 分发验证记录

执行日期：2026-09-15。目标：验证包含 29 个 Skill、6 个插件和 6 个代理的正式发行包、18 批逐项审查档案与发行安装回归。

## 发布前执行项

1. `npm run check`：验证 Registry、Schema、Inventory、全量治理目录、18 批审查档案、候选队列、插件镜像和测试。
2. `git diff --check`：发布前执行。
3. `npm run release:build`：生成 1.4.0 tarball、`release.json` 与 `SHA256SUMS`。
4. `npm run release:smoke`：从 tarball 隔离安装 CLI 和六个插件，共 29 个正式 Skill。
5. 推送 `v1.4.0` 后核对 GitHub Validate、Release、三方 SHA-256 和远程 Marketplace 安装。

# 1.3.0 分发验证记录

执行日期：2026-09-15。目标：验证包含 28 个 Skill、6 个插件和 6 个代理的正式发行包、全量治理目录、候选队列与发行安装回归。

## 本地执行结果

1. `npm run check`：通过；验证 Registry、Schema、来源与许可、品牌前缀、依赖图、Inventory、全量治理目录、候选队列、治理漂移、插件镜像和 43 项测试。
2. `git diff --check`：通过。
3. 发行包：`zeve-os-skill-marketplace-1.3.0.tgz`，由 `npm run release:build` 生成并完成内容清单检查。
4. 从 tarball 隔离安装 CLI：通过；已安装包执行 `verify` 通过。
5. 六个插件通过发行包 CLI 安装回归，合计 28 个不重复正式 Skill。
6. 本地制品初次构建 SHA-256 为 `d7c6f9bb0b98941fed4b1f7a881a5cad908a0d9a82598e9cbefd513d6bdc48d7`；发布前最终重建值以 `dist/release.json` 为准。
7. GitHub Release 与 Codex 原生 Marketplace 远程安装在推送标签后复验。

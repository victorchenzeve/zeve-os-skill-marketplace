# 1.3.0 分发验证记录

执行日期：2026-09-15。目标：验证包含 28 个 Skill、6 个插件和 6 个代理的正式发行包、全量治理目录、候选队列与发行安装回归。

## 执行结果

1. `npm run check`：通过；验证 Registry、Schema、来源与许可、品牌前缀、依赖图、Inventory、全量治理目录、候选队列、治理漂移、插件镜像和 43 项测试。
2. `git diff --check`：通过。
3. 发行包：`zeve-os-skill-marketplace-1.3.0.tgz`，由 Release 工作流生成并完成内容清单检查。
4. 从本地 tarball 隔离安装 CLI：通过；已安装包执行 `verify` 通过。
5. 六个插件通过发行包 CLI 安装回归，合计 28 个不重复正式 Skill。
6. GitHub `Validate marketplace` 与 `Release marketplace` 工作流均成功。
7. 远程 tarball SHA-256 为 `267ebe6a03c8d9a429118873249e9723e995d4bff3e9d94d37f0a4dace2900ce`，与远程 `release.json`、`SHA256SUMS` 和实际下载文件三方一致。
8. 从 GitHub `v1.3.0` 添加全新隔离 Codex Marketplace 后，六个插件均显示已安装并启用。

# 1.4.0 分发验证记录

执行日期：2026-09-15。目标：验证包含 29 个 Skill、6 个插件和 6 个代理的正式发行包、18 批逐项审查档案与发行安装回归。

## 执行结果

1. `npm run check`：通过；验证 Registry、Schema、来源与许可、品牌前缀、依赖图、Inventory、924 项全量治理目录、895 项逐项审查档案、58 项候选队列、治理漂移、插件镜像和 44 项测试。
2. `git diff --check`：通过。
3. 发行包：`zeve-os-skill-marketplace-1.4.0.tgz`，由 Release 工作流生成并完成内容清单检查。
4. 从本地 tarball 隔离安装 CLI：通过；六个插件安装回归通过，合计 29 个不重复正式 Skill。
5. GitHub `Validate marketplace`、`Release marketplace` 和主分支验证工作流均成功。
6. 远程 tarball SHA-256 为 `542b252fd185b6d5b424405ced9d63bd3136c4938dc98e1372586d78014ee34a`，与 GitHub 资产摘要、远程 `release.json`、`SHA256SUMS` 和实际下载文件一致。
7. 从 GitHub `v1.4.0` 添加全新隔离 Codex Marketplace 后，六个插件均显示已安装并启用；治理插件版本为 0.2.0，包含 6 个正式 Skill。
8. 18 个审查批次覆盖全部 895 个非正式 Skill；每项均记录门槛判断、阻断原因和下一项所需证据，未改写、合并或删除本机 Skill。

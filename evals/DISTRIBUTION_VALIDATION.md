# 1.6.0 分发验证记录

执行日期：2026-09-15。目标：验证包含 39 个 Skill、6 个插件和 6 个代理的正式发行包、10 项干净实现解析及 18 批审查档案。

## 本地发行验证

1. `npm run check`：通过；验证 Registry、Schema、Inventory、934 项治理目录、895 项逐项审查及补充证据、10 项解析、插件镜像和 46 项测试。
2. `git diff --check`：通过。
3. `npm run release:build`：生成 `zeve-os-skill-marketplace-1.6.0.tgz`、`release.json` 与 `SHA256SUMS`。
4. 本地 tarball 的大小与 SHA-256 由最终构建后的 `release.json` 和 `SHA256SUMS` 记录。
5. `npm run release:smoke`：从 tarball 隔离安装 CLI 和六个插件，39 个正式 Skill 均存在且不重复。
6. 正式 Skill ID 中旧 `zewei` 前缀数量为 0。

## 远程发布验证

待 `v1.6.0` 标签、GitHub Release 和远程隔离安装完成后补记。

# 1.5.0 分发验证记录

执行日期：2026-09-15。目标：验证包含 34 个 Skill、6 个插件和 6 个代理的正式发行包、5 项干净实现解析及 18 批审查档案。

## 本地执行结果

1. `npm run check`：通过；验证 Registry、Schema、Inventory、929 项治理目录、895 项逐项审查及补充证据档案、5 项干净实现解析、插件镜像和 46 项测试。
2. `git diff --check`：通过。
3. `npm run release:build`：生成 `zeve-os-skill-marketplace-1.5.0.tgz`、`release.json` 与 `SHA256SUMS`。
4. 本地 `SHA256SUMS` 已生成，并通过文件完整性校验；发布后的固定摘要记录在远程验证结果中。
5. `npm run release:smoke`：从 tarball 隔离安装 CLI 和六个插件，34 个正式 Skill 均存在且不重复。
6. 发布后继续核对 GitHub 工作流、远程产物哈希和全新 Codex Marketplace 安装。

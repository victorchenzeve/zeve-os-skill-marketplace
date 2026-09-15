# 1.5.0 分发验证记录

执行日期：2026-09-15。目标：验证包含 34 个 Skill、6 个插件和 6 个代理的正式发行包、5 项干净实现解析及 18 批审查档案。

## 本地执行结果

1. `npm run check`：通过；验证 Registry、Schema、Inventory、929 项治理目录、895 项逐项审查及补充证据档案、5 项干净实现解析、插件镜像和 46 项测试。
2. `git diff --check`：通过。
3. `npm run release:build`：生成 `zeve-os-skill-marketplace-1.5.0.tgz`、`release.json` 与 `SHA256SUMS`。
4. 本地 `SHA256SUMS` 已生成，并通过文件完整性校验；发布后的固定摘要记录在远程验证结果中。
5. `npm run release:smoke`：从 tarball 隔离安装 CLI 和六个插件，34 个正式 Skill 均存在且不重复。
6. GitHub 发布后的工作流、远程产物哈希和全新 Codex Marketplace 安装均已核对通过。

## 远程发布结果

1. 主分支提交与 `v1.5.0` 标签均指向 `7f3a4d47029febe2271bb07ead5c83faa3d75590`。
2. GitHub `Validate marketplace` 与 `Release marketplace` 工作流均成功。
3. GitHub Release 发布三个资产：`release.json`、`SHA256SUMS` 和 `zeve-os-skill-marketplace-1.5.0.tgz`。
4. 远程 tarball 大小为 129,213 字节；下载后 SHA-256 为 `2f5c76fc6991b9bd60f6a8f3781a700b920a0434ed7547d1a65d2e2f0d3461a1`，与 `release.json` 和 `SHA256SUMS` 一致。
5. 在全新隔离 `CODEX_HOME` 中从 GitHub 标签添加 Marketplace，六个插件全部安装并启用；共发现 34 个唯一 Skill，`zewei` 前缀 ID 为 0。
6. Release：https://github.com/victorchenzeve/zeve-os-skill-marketplace/releases/tag/v1.5.0

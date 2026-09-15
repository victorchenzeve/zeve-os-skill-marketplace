# 1.6.0 分发验证记录

执行日期：2026-09-15。目标：验证包含 39 个 Skill、6 个插件和 6 个代理的正式发行包、10 项干净实现解析及 18 批审查档案。

## 本地发行验证

1. `npm run check`：通过；验证 Registry、Schema、Inventory、934 项治理目录、895 项逐项审查及补充证据、10 项解析、插件镜像和 46 项测试。
2. `git diff --check`：通过。
3. `npm run release:build`：生成 `zeve-os-skill-marketplace-1.6.0.tgz`、`release.json` 与 `SHA256SUMS`。
4. `npm run release:smoke`：从 tarball 隔离安装 CLI 和六个插件，39 个正式 Skill 均存在且不重复。
5. 正式 Skill ID 中旧 `zewei` 前缀数量为 0。

## 远程发布验证

1. `main` 与 `v1.6.0` 发布提交均为 `cc96508339dfe8914f30c1876e6a07417f1896cc`。
2. Validate workflow 与 Release workflow 均成功。
3. GitHub Release 已发布 `release.json`、`SHA256SUMS` 和 `zeve-os-skill-marketplace-1.6.0.tgz`。
4. 远程 tarball 大小为 140,554 字节；下载后 SHA-256 为 `1f613af6bbc4a6688031ed3d40211855b4d6c5e77e36df8b18222debeb660636`，与两份远程校验记录一致。
5. 从该远程 tarball 隔离安装包后，CLI 验证通过；以安装包根目录添加 Codex Marketplace，六个插件全部安装并启用，共发现 39 个唯一 Skill，旧 `zewei` 前缀 ID 为 0。
6. 本机对 GitHub 的直接 Git 克隆连接被远端传输重置；远程 Release 下载、制品校验和相同内容的 Codex Marketplace 安装均已完成，此网络限制不影响已发布资产。
7. Validate workflow：https://github.com/victorchenzeve/zeve-os-skill-marketplace/actions/runs/34985793638
8. Release workflow：https://github.com/victorchenzeve/zeve-os-skill-marketplace/actions/runs/34985793339
9. Release：https://github.com/victorchenzeve/zeve-os-skill-marketplace/releases/tag/v1.6.0

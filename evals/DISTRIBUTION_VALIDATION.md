# 1.2.0 分发验证记录

执行日期：2026-09-14。目标：验证包含 25 个 Skill、5 个插件和 5 个代理的正式发行包、治理队列与发行安装回归。

## 执行结果

1. `npm run check`：验证 Registry、Schema、来源与许可、品牌前缀、依赖图、Inventory、候选队列、治理漂移和插件镜像。
2. `git diff --check`：通过。
3. 发行包：`zeve-os-skill-marketplace-1.1.1.tgz`，已完成生成与内容清单检查。
4. SHA-256 与文件大小以同次构建生成的 `dist/SHA256SUMS`、`dist/release.json` 为准，两者一致。
5. 从 tarball 隔离安装 CLI：通过；已安装包执行 `verify` 通过。
6. 五个插件通过发行包 CLI 安装回归，合计 23 个不重复领域 Skill。
7. Codex 原生 Marketplace 远程安装结果在发布后复验并记录。
8. 每周治理工作流重复检查与发行安装回归，防止主分支外部状态漂移。

# 1.1.1 分发验证记录

执行日期：2026-09-14。目标：验证包含 20 个 Skill、4 个插件和 4 个代理的正式发行包，并验证无 ripgrep 环境的扫描回退。

## 执行结果

1. `npm run check`：通过，38 项测试全部成功；Registry、Schema、品牌前缀、依赖图、Inventory 和插件镜像均通过。
2. `git diff --check`：通过。
3. 发行包：`zeve-os-skill-marketplace-1.1.1.tgz`，已完成生成与内容清单检查。
4. SHA-256 与文件大小以同次构建生成的 `dist/SHA256SUMS`、`dist/release.json` 为准，两者一致。
5. 从 tarball 隔离安装 CLI：通过；已安装包执行 `verify` 通过。
6. 四个插件分别完成 CLI 安装与卸载，成员数为 5、5、4、4，无残留成员目录。
7. Codex CLI 0.153.4 原生 Marketplace：成功识别 `zeve-os`，四个插件均显示 `installed, enabled`。
8. Codex `skills/list`：成功加载四插件共 18 个领域 Skill，错误数为 0。

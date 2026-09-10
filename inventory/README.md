# 技能盘点入口

先看 [REPORT.md](REPORT.md)，再按目的进入：

- [安装位置与运行时发现清单](installed-skills/INDEX.md)
- [外部来源证据清单](external-skills/INDEX.md)
- [本地创建证据与归属待核实清单](zewei-created-skills/INDEX.md)

`latest.json` 提供最近一次快照路径；快照内包含 `catalog.json`、`catalog.csv`、`summary.json`、`duplicates.json` 和逐条 Markdown 记录。三个视图可重叠，完整 JSON 中每个路径仅保存一条记录。

## 重新盘点

需要 Node.js 24、ripgrep 和当前用户的 Codex CLI。无需安装 JavaScript 依赖。

```sh
npm run inventory:discover
npm run inventory:build
npm run inventory:validate
```

发现命令可附加本地来源目录，例如 `npm run inventory:discover -- "额外技能目录"`。参数是本机路径，只在被忽略的 `.tmp/skill-discovery.json` 中保存完整映射。首轮正式快照额外覆盖了用户主目录和 F 盘；系统保护目录的拒绝访问会如实记为 `partial`，不会被当作扫描成功。

发现工具只调用 `initialize` 和 `skills/list`，不调用任何技能写入 API。若沙箱 CLI 返回的是隔离账户而非实际用户，应在真实用户环境进行只读查询，不将隔离账户结果当成用户结果。

生成器在读取源文件后再次核对正文哈希与路径集合；不会运行被盘点技能的脚本。快照按发现时间生成，重复构建同一个快照会拒绝覆盖。

`npm run check` 包含离线清单检查，不会重新扫描本机或启动 Codex。完整边界与证据规则见 [INVENTORY_POLICY.md](../governance/INVENTORY_POLICY.md)。

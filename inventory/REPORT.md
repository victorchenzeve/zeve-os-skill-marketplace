# Codex Skills 盘点报告

快照：2026-09-10T02-41-33-357Z。本阶段只盘点，未修改、合并、删除、注册或执行任何 Skill。

## 数量口径

- 磁盘 SKILL.md 路径记录：3514 份。
- 安装目录或运行时发现：886 份。
- 三类盘点视图存在重叠，不得相加作为技能总数。
- 运行时跨查询目录共发现 878 个唯一路径。
- 同名分组 1354 组；SKILL.md 字节相同分组 789 组。仅标记，未去重或合并。
- 本地目录派生证据 364 份；泽玮相关待核实候选 7 份。已确认泽玮原创：0（尚未做归属核验）。

## 运行时查询

| 上下文 | 查询目录 | 返回 | 启用 | 禁用 | 错误 |
| --- | --- | --- | --- | --- | --- |
| context-1 | %USERPROFILE%/Documents\ChatGPT\泽玮os-skill-marketplace | 800 | 800 | 0 | 3 |
| context-2 | %USERPROFILE%/Documents\SKILL | 800 | 800 | 0 | 3 |
| context-3 | %EXTRA_ROOT_2%/一心文件夹 | 877 | 877 | 0 | 4 |
| context-4 | %EXTRA_ROOT_2%/一新课程-内容自动化 | 801 | 801 | 0 | 3 |

独立 app-server 的结果可能与桌面任务的插件注入不同；未返回的插件缓存不能直接判为未安装或禁用。

## 扫描范围

| 根目录 ID | 路径别名 | 状态 | 文件数 |
| --- | --- | --- | --- |
| codex-skills | %CODEX_HOME%/skills | scanned | 795 |
| plugin-cache | %CODEX_HOME%/plugins | scanned | 32 |
| vendor-catalog | %CODEX_HOME%/vendor_imports | scanned | 39 |
| user-agents | %USERPROFILE%/.agents/skills | missing | 0 |
| documents | %USERPROFILE%/Documents | scanned | 555 |
| desktop | %USERPROFILE%/Desktop | scanned | 0 |
| downloads | %USERPROFILE%/Downloads | scanned | 0 |
| extra-1 | %EXTRA_ROOT_1% | partial | 3136 |
| extra-2 | %EXTRA_ROOT_2% | partial | 378 |

额外根目录别名的机器路径只保存在忽略提交的 .tmp/skill-discovery.json。未扫描压缩包内容、云端任务和依赖目录。

## 已观察问题

- `%CODEX_HOME%/skills/geo-optimizer-skill/skill.md`：missing YAML frontmatter delimited by ---
- `%CODEX_HOME%/skills/wechat-ip-writer/skill.md`：missing YAML frontmatter delimited by ---
- `%CODEX_HOME%/skills/video-audit-experts/content-structure/skill.md`：missing YAML frontmatter delimited by ---
- `%EXTRA_ROOT_2%/一心文件夹/.agents/skills/wechat-ip-writer/skill.md`：missing YAML frontmatter delimited by ---

本轮未修复。其他格式观察、生成占位说明、来源及版本缺失情况见逐条记录。

## 数据与完整性

- [完整 JSON 清单](snapshots/2026-09-10T02-41-33-357Z/catalog.json)
- [CSV 清单](snapshots/2026-09-10T02-41-33-357Z/catalog.csv)
- [详细统计](snapshots/2026-09-10T02-41-33-357Z/summary.json)
- [同名及相同正文分组](snapshots/2026-09-10T02-41-33-357Z/duplicates.json)
- [安装位置清单](installed-skills/INDEX.md)
- [外部来源清单](external-skills/INDEX.md)
- [本地创建与归属线索](zewei-created-skills/INDEX.md)

对 3514 份 SKILL.md 复核 SHA-256，变化 0 份；复扫发现路径变化 0 项。只核对正文与路径，未对全部附件做哈希。

正式 Registry 保持空表。成熟度、实际依赖、费用、许可证和原创作者均未据本轮扫描自动认定。

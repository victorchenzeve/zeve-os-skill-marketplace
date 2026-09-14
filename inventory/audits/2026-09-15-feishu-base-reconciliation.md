# 飞书 Skill 登记表核对报告

核对时间：2026年9月15日 00:53:51（Asia/Shanghai；2026-09-14T16:53:51.208Z）

本报告只读取用户提供的飞书多维表格和当前 Codex 技能状态，没有修改表格或 Skill。原始记录、记录 ID、文档链接及本地绝对路径未写入仓库。

## 数量

- 飞书整表：816 行；按规范化技能名称去重后 795 个。
- 用户指定视图：816 行；该视图隐藏 0 行。
- 当前 Codex 运行时：841 个唯一路径，其中 user 827、plugin 8、system 6。
- 当前 %CODEX_HOME%/skills：838 份 SKILL.md；运行时另报告 3 个加载错误。

### 与上一阶段全盘快照的口径

上一阶段快照 2026-09-14T16-36-16-145Z 记录了 1948 个磁盘路径，其中安装目录或运行时发现 838 个、跨多个项目上下文的运行时唯一路径 6 个。该快照包含来源存档、历史副本和项目级技能，不能与本次单一当前上下文的 841 个直接作增减比较。归属待核实记录 849 份，泽玮相关候选 9 份，已确认原创仍为 0。

### 字段完整性

- 名称为空：0 行；编号为空：0 行。
- 源路径为空：0 行；版本为空：0 行；状态为空：0 行。

## 重复

- 同名重复：21 组，多出 21 行。
- 技能编号重复：0 组。
- 非空源路径重复：21 组。

- **knowledge-sop-inventory-archiver**：2 行（SK-0006、SK-0211）
- **skill-inventory-registrar**：2 行（SK-0008、SK-0203）
- **xhs-note-producer**：2 行（SK-0010、SK-0204）
- **ppt-outline-image2**：2 行（SK-0011、SK-0205）
- **douyin-downloader**：2 行（SK-0012、SK-0206）
- **mindmap-ppt-builder**：2 行（SK-0013、SK-0207）
- **skill-sop-cloud-archiver**：2 行（SK-0014、SK-0210）
- **umi-video-download**：2 行（SK-0016、SK-0213）
- **html-presentation-designer**：2 行（SK-0017、SK-0214）
- **huashu-proofreading**：2 行（SK-0018、SK-0215）
- **wechat-article-layout-styles**：2 行（SK-0020、SK-0217）
- **wechat-ip-writer**：2 行（SK-0021、SK-0218）
- **wechat-deep-article-finalizer**：2 行（SK-0022、SK-0219）
- **horizontal-kinetic-talk-video**：2 行（SK-0023、SK-0220）
- **jalyn-horizontal-talk-video-edit**：2 行（SK-0024、SK-0221）
- **single-page-ppt-image**：2 行（SK-0025、SK-0226）
- **noun-vivid-explainer**：2 行（SK-0026、SK-0227）
- **blogger-distiller**：2 行（SK-0027、SK-0228）
- **article-to-spoken-script-zh-public**：2 行（SK-0029、SK-0232）
- **video-analysis**：2 行（SK-0031、SK-0236）
- **video-shotcraft**：2 行（SK-0247、SK-0417）

## 遗漏与表内存量

- 当前运行时有、飞书整表没有：26 个逻辑名称。
- 飞书整表有、当前运行时没有：8 个唯一名称。
  - 其中仍在本机技能目录：1 个。
  - 当前技能目录也未找到：7 个。

### 当前运行时有、飞书没有

- cheat-predict（user）
- cheat-score-blind（user）
- computer-use:computer-use（plugin，plugin=computer-use@openai-bundled）
- documents:documents（plugin，plugin=documents@openai-primary-runtime）
- fireworks-tech-graph（user）
- imagegen（system）
- openai-docs（system）
- pdf:pdf（plugin，plugin=pdf@openai-primary-runtime）
- plugin-creator（system）
- presentations:Presentations（plugin，plugin=presentations@openai-primary-runtime）
- review-agent（system）
- skill-creator（system）
- skill-installer（system）
- snail（user）
- spreadsheets:Spreadsheets（plugin，plugin=spreadsheets@openai-primary-runtime）
- spreadsheets:excel-live-control（plugin，plugin=spreadsheets@openai-primary-runtime）
- template-creator:template-creator（plugin，plugin=template-creator@openai-primary-runtime）
- video-animation-effects（user）
- video-attention-capture（user）
- video-audio-music（user）
- video-completion（user）
- video-visual-quality（user）
- visualize:visualize（plugin，plugin=visualize@openai-bundled）
- wewrite-learn（user）
- zewei-ip-copy-hook（user）
- 张咋啦-创作指南（user）

### 飞书有、运行时没有，但本机目录仍存在

- wechat-ip-writer（SK-0021，状态：已教学文档化）

### 飞书有、运行时和当前技能目录均未找到

- agent-mini-app-builder（SK-0231，状态：待升级）
- bilibili-subtitle-extractor（SK-0233，状态：待升级）
- daily-brief-deepresearch（SK-0234，状态：待升级）
- markdown-to-docx（SK-0237，状态：待升级）
- slides（SK-0040，状态：已教学文档化）
- snail / getname（SK-0019，状态：已教学文档化）
- wx-cli（SK-0212，状态：待升级）

## 运行时加载错误

- geo-optimizer-skill：missing YAML frontmatter delimited by ---
- wechat-ip-writer：missing YAML frontmatter delimited by ---
- content-structure：missing YAML frontmatter delimited by ---

## 判定边界

名称比较会提取 Markdown 链接显示名、统一大小写与 Unicode、把空格和下划线统一为连字符，并允许插件前缀后的技能名匹配。名称命中不能证明版本或内容一致；后续若要正式补表，应再按源路径、版本和正文哈希逐条确认。

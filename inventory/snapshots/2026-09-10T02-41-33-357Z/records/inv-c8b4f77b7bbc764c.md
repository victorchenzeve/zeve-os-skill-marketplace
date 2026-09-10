# cheat-score-blind

- 盘点 ID：inv-c8b4f77b7bbc764c
- 原路径：`%CODEX_HOME%/skills/cheat-on-content/skills/cheat-score-blind/SKILL.md`
- SKILL.md SHA-256：`02b57fee4ee3bc4fd0f06f382492c800ae44ce582da06327b4c12e0fb018e931`
- 描述：INTERNAL sub-agent for blind 7-dim rubric scoring. **NOT a user-facing skill — do NOT invoke from main conversation.** Called via Task tool by cheat-score / cheat-predict / cheat-bump to get a context-isolated score on a script. Receives ONLY script_path + rubric_notes_path; refuses any other input. Outputs strict JSON: 9 dimensions × {score 0-5, confidence enum, one-line reason}. **Hard refuses to Read** .cheat-state.json, predictions/*, retro 段, or anything that could leak post-publish data. This is channel B in the 3-channel calibration model (A=main, B=blind sub, C=cross-model).
- 声明版本：待核实
- 声明作者：待核实；原创归属未核实
- 许可证声明：待核实；未核验
- 来源分类：unknown
- 本地创建线索：unverified
- 创建证据：待核实
- 历史记录：待核实
- 位于安装目录或运行时可发现：true
- 运行时：context-1: enabled=true, scope=user; context-2: enabled=true, scope=user; context-3: enabled=true, scope=user; context-4: enabled=true, scope=user
- 运行时错误：无已报告错误
- 观察项：无上述自动观察项
- 状态：待评估；未纳管；未设置成熟度；未执行技能
- 负责人：待指定
- 相同 SKILL.md 内容记录：[inv-9d151558e060bbbc](inv-9d151558e060bbbc.md)

只记录元信息与校验值，不复制技能正文。结构、来源和行为尚需人工核查；相同正文不代表相同附件。

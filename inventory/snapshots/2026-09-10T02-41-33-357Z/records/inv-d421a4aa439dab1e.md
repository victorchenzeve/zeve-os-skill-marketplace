# cheat-predict

- 盘点 ID：inv-d421a4aa439dab1e
- 原路径：`%CODEX_HOME%/skills/cheat-on-content/skills/cheat-predict/SKILL.md`
- SKILL.md SHA-256：`0e04be8fe13dd7ccc5033e05a091fd2c0cef99a7d2eb812911fc99dadfc5eb76`
- 描述：给最终稿写一份 immutable 盲预测日志。这是 cheat-on-content 整个校准循环的核心动作——预测段一旦写完不可改，由 hook 强制。**自动检测**：如目标文件已有 `## 预测` / `## 预测 v1` 段（被 cheat-shoot 调用走 v2 模式），改成 append `## 预测 v2` 而非覆盖。**打分通过 Task tool 委派给 `cheat-score-blind` sub-agent**（context-isolated channel B），主 Claude review 后落盘。触发词："启动预测"/"start prediction"/"给这稿子打分并预测"/"写预测日志"。
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
- 相同 SKILL.md 内容记录：[inv-910a743757e581e3](inv-910a743757e581e3.md)

只记录元信息与校验值，不复制技能正文。结构、来源和行为尚需人工核查；相同正文不代表相同附件。

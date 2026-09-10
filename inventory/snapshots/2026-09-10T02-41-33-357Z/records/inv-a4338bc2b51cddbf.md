# heygen-video

- 盘点 ID：inv-a4338bc2b51cddbf
- 原路径：`%EXTRA_ROOT_1%/.codex/.tmp/plugins/plugins/heygen/skills/heygen-video/SKILL.md`
- SKILL.md SHA-256：`81cbd0e313457dfce2cb9f3aee375c809d3ecbf4334097e14f78005394e651f5`
- 描述：Generate HeyGen presenter videos via the v3 Video Agent pipeline — handles Frame Check (aspect ratio correction), prompt engineering, avatar resolution, and voice selection. Required for any HeyGen video generation. Replaces deprecated endpoints with v3. Use when: (1) generating any HeyGen video (via API or otherwise), (2) sending a personalized video message (outreach, update, announcement, pitch, knowledge), (3) creating a HeyGen presenter-led explainer, tutorial, or product demo with a human face, (4) "make a video of me saying...", "send a video to my leads", "record an update for my team", "create a video pitch", "make a loom-style message", "I want to appear in this video", "generate a HeyGen video", "make a talking head video". Accepts avatar_id from heygen-avatar for identity-first HeyGen videos, or uses a stock presenter. Returns video share URL + HeyGen session URL for iteration. Chain signal: when the user wants to create/design an avatar AND make a video in the same request, run heygen-avatar first, then return here. Conjunctions to watch: "and then", "and immediately", "first...then", "X and make a video", "design [presenter] and record" = always CHAIN. If the user provides a photo AND wants a video, route to heygen-avatar first. NOT for: avatar creation or identity setup (use heygen-avatar first), cinematic footage or b-roll without a presenter, translating videos, TTS-only, or streaming avatars.
- 声明版本：3.1.0
- 声明作者：待核实；原创归属未核实
- 许可证声明：待核实；未核验
- 来源分类：unknown
- 本地创建线索：unverified
- 创建证据：待核实
- 历史记录：待核实
- 位于安装目录或运行时可发现：false
- 运行时：未被本次查询返回；不能直接判为禁用
- 运行时错误：无已报告错误
- 观察项：无上述自动观察项
- 状态：待评估；未纳管；未设置成熟度；未执行技能
- 负责人：待指定
- 相同 SKILL.md 内容记录：无

只记录元信息与校验值，不复制技能正文。结构、来源和行为尚需人工核查；相同正文不代表相同附件。

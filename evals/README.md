# 行为评估

结构测试通过不代表 Skill 已在真实业务中稳定。每个 Skill 在 `evals/<skill-id>/` 保存用例和执行记录。

当前 28 个领域 Skill 均完成成功、缺失或错误输入、权限或证据边界的合成评估，因此成熟度为 `experimental`。两个 Core 治理 Skill 另有真实仓库审计和发行操作证据，成熟度为 `stable`。插件和代理的组合证据分别保存在 `evals/plugins/` 与 `evals/agents/`。

领域 Skill 升级为 `stable` 前还需要保留获准的真实业务验证、失败条件和依赖故障证据。成熟度条件见 `governance/MATURITY_MODEL.md`。

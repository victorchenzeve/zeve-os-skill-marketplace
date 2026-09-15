# 泽玮 OS Skill 治理

组合资产纳管、来源许可、重复关系、成熟度、批次审查和发布审计能力。

## 包含的 Skill

- `marketplace-asset-curator`
- `skill-provenance-reviewer`
- `skill-duplicate-adjudicator`
- `skill-maturity-evidence-reviewer`
- `skill-wave-reviewer`
- `zeve-skill-release-auditor`

## 使用边界

插件默认只读取、分析和生成治理建议。它不会自动复制、修改、合并、删除或安装原 Skill，也不会写入飞书。插件内 Skill 为自动生成的发行镜像，正式源位于仓库 `skills/`。

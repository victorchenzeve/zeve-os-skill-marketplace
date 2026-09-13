---
name: marketplace-asset-curator
description: Review a proposed Codex skill, plugin, or agent for inclusion in the Zeve OS marketplace, including identity, provenance, structure, dependencies, maturity, and registry consistency. Use for marketplace intake and release review; do not use to install unreviewed third-party assets.
license: MIT
---

# Marketplace Asset Curator

## 触发条件

当用户要把 Skill、插件或代理正式纳入泽玮 OS Marketplace，或审查某个候选资产是否达到纳管要求时使用。单纯盘点本机文件、安装外部资产或修改业务内容时不触发。

## 输入

需要候选资产目录、资产类型和预期用途。尽量取得来源、作者、版本、许可证、运行依赖和至少一个真实使用场景；缺失项要明确标为待核实，不能自行推断。

## 执行步骤

1. 阅读仓库 `AGENTS.md`、`governance/` 对应规则和当前 Registry。
2. 核对稳定 ID、目录位置、前置元数据、触发条件、输入输出、权限边界、失败处理和验证方法。
3. 检查来源与许可证证据，区分本地存在、安装状态与原创归属。
4. 列出内部依赖、外部工具、费用和权限；拒绝循环依赖或未注册的内部引用。
5. 根据已有评估证据建议成熟度。没有行为证据时保持 `draft`。
6. 生成可审查的纳管建议；获得修改授权后再更新资产、Registry、评估记录和变更日志。

## 输出

输出审查结论、阻塞项、建议 ID/分类/版本/成熟度、依赖清单及需要修改的文件。完成纳管时，所有变更必须通过 `npm run check` 和 `git diff --check`。

## 权限与边界

审查本身只读。不得因为候选资产存在于本机就复制、注册、安装或声明原创；不得提交凭据、用户数据或许可证不明的第三方完整代码。发布、推送和安装到真实用户目录遵循用户明确授权。

## 失败处理

来源、许可证或必要依赖无法核实时，保留盘点记录并停止正式纳管。校验失败时修正资产或 Registry，不得削弱规则来绕过错误。

## 验证方法

用一个合规原创技能、一个缺失许可证的外部技能和一个引用未注册依赖的插件验证通过、阻塞和依赖失败三种路径。证据保存在 `evals/marketplace-asset-curator/`。

# 泽玮 OS 私域运营插件

可由 Codex Marketplace 安装的私域运营组合包，包含：

- `private-domain-audience-segmenter`
- `private-domain-campaign-planner`
- `private-domain-conversation-reviewer`

插件处理已经授权的数据和脱敏对话，输出人群规则、活动方案和跟进建议。它不会自动发送消息、写回 CRM、上传联系人或产生费用。

本目录同时保存：

- `plugin.json`：泽玮 OS 内部注册清单。
- `.codex-plugin/plugin.json`：Codex 可安装插件清单。
- `skills/`：由仓库正式 Skill 同步生成的发行镜像。

修改正式 Skill 后在仓库根目录运行 `npm run plugin:sync`，再运行 `npm run marketplace:verify`。

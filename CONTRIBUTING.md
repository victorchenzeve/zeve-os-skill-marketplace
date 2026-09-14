# 维护与贡献指南

先阅读 `AGENTS.md` 与 `governance/`。本仓库使用 Node.js 24，无第三方运行依赖。

## 新增技能

1. 从 `templates/skill/` 建立 `skills/<分类>/<id>/SKILL.md`；名称使用小写连字符格式；品牌前缀只使用 `zeve`。
2. 写明触发条件、输入、步骤、输出、权限边界、失败处理和验证方法，并添加 `license` 前置元数据。
3. 需要 Codex UI 元数据时添加 `agents/openai.yaml`；默认提示必须显式引用 `$skill-id`。
4. 更新 `registry/skills.yaml`、依赖、评估记录、版本和 `CHANGELOG.md`。
5. 被插件包含的 Skill 更新后运行 `npm run plugin:sync`。

盘点记录不能替代正式注册。第三方候选必须先确认来源、作者和许可证，不能从本机安装状态推断可再分发权利。

## 新增插件

插件组合已经注册的技能，每个插件同时维护：

- `plugin.json`：仓库内部注册清单。
- `.codex-plugin/plugin.json`：Codex 安装清单。
- `skills/`：从正式 Skill 同步生成的发行镜像。
- `README.md`：场景、能力和权限边界。

在 `registry/plugins.yaml` 和 `.agents/plugins/marketplace.json` 添加对应记录，再运行：

```sh
npm run plugin:sync
npm run marketplace:verify
```

插件 ID、目录名、两个清单名称和 Marketplace 条目必须一致。不要手工修改插件 `skills/` 镜像。

## 新增代理与依赖

代理说明放在 `agents/` 或所属插件的代理目录，并注册到 `registry/agents.yaml`。内部依赖写入 `registry/dependencies.yaml`，方向为调用方指向被依赖方；插件和代理的技能成员会自动成为隐式依赖。

## 修改、弃用与移除

行为变化同步更新资产版本和 `CHANGELOG.md`。修改插件成员时同步两个插件清单并重新生成镜像。移除稳定资产前先标记弃用、说明替代和迁移路径，并检查所有成员及依赖引用。

## 验证、安装与发行

```sh
npm run check
git diff --check
npm run release:build
npm run release:smoke
```

发行前还要在隔离目录完成两条真实路径：

1. 用 `codex plugin marketplace add` 和 `codex plugin add` 安装插件。
2. 从生成的 npm tarball 安装 CLI，执行 `verify`、`list`、Skill 安装和卸载。

详细步骤见 `DISTRIBUTION.md`。远程仓库、推送、Git Tag、npm 发布和其他外部发布由所有者针对具体目的地授权。

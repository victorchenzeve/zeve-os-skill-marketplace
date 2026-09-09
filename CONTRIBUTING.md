# 维护与贡献指南

先阅读 `AGENTS.md` 与 `governance/`。本仓库使用 Node.js 24，无需运行 `npm install`。

## 新增技能

按 README 的步骤从 `templates/skill/` 建立技能目录，完善说明和注册记录。新增技能默认使用 `draft` 成熟度，并根据 `evals/README.md` 建立评估用例。

盘点记录放入对应的 `inventory/` 子目录，记录来源、版本、负责人及许可核查情况。盘点记录不能替代正式注册记录。

## 新增插件

插件组合已经纳管的技能。下面以已存在的技能 `example-skill` 为例；使用前替换成实际技能 ID。

1. 建立 `plugins/example-plugin/`，从模板复制 `plugin.json`，填写：

```json
{
  "id": "example-plugin",
  "name": "示例插件",
  "description": "组合已注册的示例技能",
  "version": "0.1.0",
  "skills": ["example-skill"]
}
```

2. 在 `registry/plugins.yaml` 的 `plugins` 数组追加：

```json
{
  "id": "example-plugin",
  "name": "示例插件",
  "description": "组合已注册的示例技能",
  "version": "0.1.0",
  "path": "plugins/example-plugin",
  "maturity": "draft",
  "status": "active",
  "skills": ["example-skill"]
}
```

3. 在插件 README 中说明使用场景、组合流程和运行前提。

插件清单与注册表中的 ID、名称、描述、版本和技能集合必须一致。本清单是仓库内部格式；平台安装清单需要另行适配。

## 新增代理

代理说明可与所属插件放在一起，例如 `plugins/example-plugin/agents/example-agent/AGENT.md`。从 `templates/agent/AGENT.md` 复制并填写职责与权限后，在 `registry/agents.yaml` 的 `agents` 数组追加：

```json
{
  "id": "example-agent",
  "name": "示例代理",
  "description": "调用示例技能完成指定任务",
  "version": "0.1.0",
  "path": "plugins/example-plugin/agents/example-agent/AGENT.md",
  "maturity": "draft",
  "status": "active",
  "skills": ["example-skill"]
}
```

代理路径指向文件，技能与插件路径指向目录。不要将模板文件本身注册为正式代理。

## 修改与移除

修改资产后同步更新注册记录、版本和 CHANGELOG.md。修改插件成员时同步其 `plugin.json`。需要说明额外依赖时，将依赖边写入 `registry/dependencies.yaml`；方向为调用方指向被依赖方。

移除资产前先按治理规范弃用，并检查插件成员、代理成员及显式依赖引用。`archived` 是登记状态，不能解决失效引用，归档资产的路径仍须存在。

## 本地验证与提交

```sh
npm run check
git diff --check
git status --short
```

审阅变更内容后，按文件或目录明确暂存，再运行 `git diff --cached --check` 和 `git diff --cached`。这能检查尚未有历史提交的新文件；单独运行 `git diff --check` 不会检查未跟踪文件。

提交信息简述实际变更，例如 `chore: initialize skill marketplace repository`。Git 作者姓名和邮箱由维护者提供，仅在需要时配置到本仓库；不要使用虚构身份或替他人署名。

本地提交完成后用 `git status --short` 确认状态。远程托管地址、可见性、推送和发布由仓库所有者另行指定。

# 博客一键发布（VS Code 扩展）

给 [风声赫立的博客](https://hejie-wang.github.io) 用的极简发布插件：校验 → 提交 → 推送 → Actions 重建。

## 功能

| 命令 | 说明 |
| --- | --- |
| `博客：一键发布` | 校验 front matter 与图片引用，`git add -A`、输入提交信息、`git commit`、`git push`，成功后可直接打开站点或查看 Actions 构建 |
| `博客：新建文章` | 输入标题，用 `hexo new` 在 `source/_posts/<年>/<月>/` 下建好文件并打开 |
| `博客：打开站点` | 打开 `blogPublisher.siteUrl` |

- 快捷键：`Ctrl+Alt+P`（macOS `Cmd+Alt+P`）
- 状态栏右侧常驻「发布博客」按钮，点一下即可发布
- 没有改动时不会产生空提交；校验失败或推送失败会弹出错误并打开「博客发布」输出面板

## 设置

| 设置项 | 默认值 | 说明 |
| --- | --- | --- |
| `blogPublisher.validateBeforePublish` | `true` | 发布前运行 `tools/validate-posts.cjs` |
| `blogPublisher.remote` | `origin` | 推送远端名 |
| `blogPublisher.siteUrl` | `https://hejie-wang.github.io` | 站点地址 |

## 安装

```bash
cd tools/vscode-extension
npx @vscode/vsce package
code --install-extension blog-publisher-0.1.0.vsix --force
```

改完插件源码重新打包安装即可，`--force` 会覆盖旧版本。卸载：`code --uninstall-extension hejie-wang.blog-publisher`。

## 说明

插件只做一件事：把「写完 → 上线」压缩成一次按键。真正的构建仍然交给仓库里的 GitHub Actions 工作流（`.github/workflows/deploy.yml`），本地不会生成或提交 `public/`。

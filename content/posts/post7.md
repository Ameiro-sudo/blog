# Bocchi Client:从原版模板一步一步来的改造记录

date: 2026-08-04
tags: Mod, 开发记录
time: 21:00
readTime: 8 分钟
pinned: true
image: assets/vendor/images/posts/cover-104120832.webp
---

一直想要一个「孤独摇滚」主题的 Minecraft 客户端。机缘巧合之下,找到了[baier233/bocchi-template-1.21.5](https://github.com/baier233/bocchi-template-1.21.5),CC0 许可,随便用随便改,于是开始了这一步步改造（该说不说AI真好用吧，花了15¥就完事了）

声明：题主一点点程序能力都没有，顶多能看懂py的一些简单逻辑，所以本项目为纯vibecoding进行修改

现在这版(0.1.0)和原版模板之间,一共新增了 3 个文件、修改了 21 个文件。这篇文章就记录下这些改动是怎么一步步来的。

## 为什么叫「Design 系统」

拿到模板之后,第一感觉是:纹理、SVG、字体、颜色全部硬编码在 Java 里,改一个立绘要翻好几层代码。

所以第一步,先新增了 `Design.java` —— 一个设计资源集中管理器:

- 所有纹理 / SVG / 字体 / 视频 / 动画 / 配色的路径和默认值,全部收进一个 `design.json`
- 材质包可以放一份 `assets/minecraft/client/design.json` 按 key 覆盖任何一项,不用碰 Java 代码
- 配套新增 `ResPack.java` 资源读取工具:优先走 Minecraft 的 ResourceManager(材质包可覆盖),失败再回退 classpath

## 21 处硬编码迁移

接下来就是把模板里散落的硬编码全部迁到 Design 系统,这是工作量最大的一步:

| 模块 | 迁移内容 |
| --- | --- |
| 启动屏 SplashUI | 加载动画纹理改为 `Design.resource("textures.bocchi_loading")` |
| Logo / 立绘 / 背景 | Logo、后藤立绘、唱片纹理全部走 Design |
| 按钮图标 | `Design.resource("svgs." + icon)` |
| 字体 | 字体路径统一 `Design.resource("fonts." + name, fallback)` |
| 配色 | 唱片配色等改为 `Design.color("colors.vinyl_*")` |
| Shader | 后处理 shader 路径走 Design |

迁移完顺手修了个隐藏雷:模板里的字体文件名带大写(如 `Kranky-Regular.ttf`),而 Minecraft 的 `ResourceLocation` 只允许小写 `[a-z0-9/._-]`,大写直接启动崩溃 —— 全部重命名为小写。

## 资源包热重载

原版模板没有资源包功能，于是我增加了材质包设定，可以定制。

给 `MixinMinecraftClient` 加了 `reloadResourcePacks` 钩子:资源包重载完成后调用 `Design.reload()` 并清空纹理缓存,装 / 卸材质包即时生效。立绘、背景、Logo、SVG、配色都能热重载;字体和背景视频因为是静态加载,还是得重启游戏(说明文档里写了)。

## 功能补全

模板的按钮是「好看的摆设」,点了没反应。这一版把它们全部接上了:

- 主菜单的 单人游戏 / 多人游戏 / 设置 / 语言 / 退出 按钮接入真实行为
- 按 ESC 返回原版 `TitleScreen`,并实现 `onClose`
- 移除模板遗留的「Alt Manager」按钮和测试后处理调用
- 挖出了作者的废案，增加了入口以及按钮

顺手做了个性能优化:视频解码输出从每帧分配 AWT `BufferedImage` 改为 Skija `Bitmap` 复用 + 行拷贝。

## 打包时踩的坑:Multi-Release Manifest

Skija 是 multi-release jar,如果外层 jar 的 Manifest 没有 `Multi-Release: true`,Java 21 会加载旧版的 `sun.misc.Cleaner` 路径,直接原生崩溃。

- Fabric:`remapJar` 之后用脚本重写 zip 补上 Manifest
- NeoForge:`shadowJar` 配置 Manifest 属性

具体分析和踩坑过程写在 [docs/Multi-Release-MANIFEST-问题说明.md](https://github.com/Ameiro-sudo/bocchi-mod/blob/main/docs/Multi-Release-MANIFEST-%E9%97%AE%E9%A2%98%E8%AF%B4%E6%98%8E.md)。

## 多版本与发行

模板只有 1.21.5,顺手把整个改造移植到了 1.21.1(Parchment 映射版本不同,其余代码基本通用)。

现在源码仓库维护三个工程目录(1.21.5 / 1.21.1 / legacy),打包为 4 个变体 × 2 种按钮风格,CI 一键构建:

- **4 变体**:1.21.5-Fabric / 1.21.5-NeoForge / 1.21.1-Fabric / 1.21.1-NeoForge
- **按钮风格**:原版方形按钮(CozyUI 图标) / 圆角按钮(额外并入 Fogg05 的 CozyUI-Plus 圆角控件素材)

## 下载

| 版本 | 加载器 | 下载 |
| --- | --- | --- |
| 1.21.5 | Fabric / NeoForge | [GitHub Releases: 1.21.5](https://github.com/Ameiro-sudo/bocchi-mod/releases/tag/1.21.5) |
| 1.21.1 | Fabric / NeoForge | [GitHub Releases: 1.21.1](https://github.com/Ameiro-sudo/bocchi-mod/releases/tag/1.21.1) |

安装:jar 丢进 mods 文件夹,Fabric或NeoForge。

## 许可与致谢

- 模板 [bocchi-template-1.21.5](https://github.com/baier233/bocchi-template-1.21.5) — baier233,CC0-1.0
- 圆角控件素材 [CozyUI-Plus](https://github.com/Fogg05/CozyUI-Plus) — Fogg05,GPL-3.0
- 字体位图 [MCsans-Plus](https://github.com/Fogg05/MCsans-Plus) — Fogg05,MIT
- Emoji 位图 [Emoji-Plus](https://github.com/Fogg05/Emoji-Plus) — Fogg05,MIT

以及,永远怀念 05 老师。R.I.P.

源码:[github.com/Ameiro-sudo/bocchi-mod](https://github.com/Ameiro-sudo/bocchi-mod)

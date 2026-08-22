# 喜报！Bocchi Client 1.0
date: 2026-08-22
tags: Mod, 开发记录
time: 03:17
readTime: 6 分钟
pinned: false
image: assets/vendor/images/posts/cover-px-4.webp
---

喜报！Bocchi Client 1.0 正式发布了🎉

上回书说到，这只从模板改出来的客户端才刚出生（[出生记录](https://blog.snowblock.top/#/post7)）。出生第 18 天，直接办成人礼：版本号跳到 1.0.0，双 MC 版本 × 双加载器，四个 jar 整整齐齐上架 GitHub Releases。

## 半个月从 0.1 干到 1.0，凭什么

凭审计。本来打完 0.3.0 就想直接拍 1.0 tag，被按住了：再审几轮，干净就发。行，那就审。

先把帧率救回来。之前每个按钮每帧都做一次全屏离屏染色，5 个按钮就是每帧 5 次全屏 saveLayer……改成 Picture 录制缓存复用，染色层缩到图标包围盒。主菜单终于不像幻灯片放映了。

然后 R3 到 R7 五轮正式审计：

| 轮次 | 审什么 | 战果 |
| --- | --- | --- |
| R3 | 渲染资源生命周期 | Skia 那套 stencil/alpha 栈机制整体是空壳，全仓 grep 零调用方，净删 271 行。删代码一时爽 |
| R4 | 并发与事件 | 零改动。事件的生产和消费全在主客户端线程，线程封闭成立。白审一轮（褒义） |
| R5 | 配置健壮性 | 挖出狠活：字体加载只捕 IOException，材质包里塞个坏 ttf 能把主菜单炸黑屏。现在坏了就回退系统字体，顶多丑点，不装死 |
| R6 | 输入与 mixin | 两棵树 18 个 mixin 逐个过目，零改动。看着像死代码的 Redirect 其实是互补关系，删了才叫出事 |
| R7 | 元数据 + 资产终扫 | 双树资源哈希级比对；模组图标接上（NeoForge 的 logoFile 之前是悬空的）；删掉 257KB 没人引用的孤儿字体；description 占位符换真话 |

顺手还修了个 BooleanSetting 参数传反的潜伏 bug：value 和 defaultValue 对调，真实值直接 null。这种 bug 平时人畜无害，发作时你怀疑人生。

## 悲报：发布当天，jar 里中文全是乱码

喜报发完没高兴多久，保底审查实锤一个大活：

Gradle 读 gradle.properties 按 .properties 的老规矩用 ISO-8859-1 解码。「自」字的 UTF-8 三字节 E8 87 AA 被逐字节当成仨拉丁字符再编码，原样写进 META-INF/neoforge.mods.toml——NeoForge 模组列表的中文描述直接变附魔台铭文，对，就是谁都读不懂的那种。

更绝的是 fabric.mod.json 压根没写 description 字段，Fabric 那边连乱码都没有，一片空白。

之前一直没炸是因为描述一直是纯英文占位符，中文一上就现形。

处理简单粗暴：旧 v1.0 的 tag 和 Release 全删 → 构建脚本显式按 UTF-8 重读 description → fabric 补上字段 → 重挂 tag，CI 自动重建双 Release → 四个 jar 逐个字节复验：严格 UTF-8、中文正常、图标在位、零 ${} 残留。

所以 1.0 不是审出来的，是审完又翻车翻出来的。悲报 → 抢救 → 还是喜报。

## 下载

| MC 版本 | 加载器 | 下载 |
| --- | --- | --- |
| 1.21.5 | Fabric / NeoForge | [GitHub Releases: v1.0-1.21.5](https://github.com/Ameiro-sudo/bocchi-mod/releases/tag/v1.0-1.21.5) |
| 1.21.1 | Fabric / NeoForge | [GitHub Releases: v1.0-1.21.1](https://github.com/Ameiro-sudo/bocchi-mod/releases/tag/v1.0-1.21.1) |

每个 Release 里 Fabric 和 NeoForge 各一个 jar。安装老规矩：丢 mods 文件夹。

## 最后

致谢照抄出生那篇：模板 [bocchi-template-1.21.5](https://github.com/baier233/bocchi-template-1.21.5)（CC0）

接下来干嘛还没想好。设置面板、让黑胶转起来、给菜单配点声音，候补名单排着呢。反正波奇酱已经转正了，工资 0，跟我一样。

源码：[github.com/Ameiro-sudo/bocchi-mod](https://github.com/Ameiro-sudo/bocchi-mod)

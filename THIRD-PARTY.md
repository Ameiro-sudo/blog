# 第三方组件

blog 与另外两个静态站不同：**没有任何 vendored 的 js**。
`assets/js/` 这个目录不存在，页面上跑的全部是本站手写的 Vue 组件与 CSS
（`assets/css/tokens.css`、`style.css`、`toast.css`、`shell.css`）。
Node 依赖在构建时打进 bundle，不提交源码文件。

仍然随页面分发的第三方资源只有两样：字体与高亮主题。

---

## 随页面分发的资源

### Font Awesome Free 6.5.1

- 文件：`assets/vendor/font-awesome@6.5.1/`
- 主页：https://fontawesome.com
- 许可：**图标** CC BY 4.0、**字体** SIL OFL 1.1、**代码** MIT

### ZCOOL KuaiLe

- 文件：`assets/vendor/fonts/ZCOOL_KuaiLe.css`、`files/ZCOOL_KuaiLe.woff2`
- 来源：Google Fonts
- 许可：SIL Open Font License 1.1
- 改动：**做了子集化**。原始字体远大于页面用到的字形集，
  `scripts/font-coverage-check.py` 在 CI 里逐字核对——页面标题里出现任何一个
  不在子集内的字符都会让构建失败。理由是子集化是个纯静默的优化：
  少一个字形的表现只是「那个字掉回系统字体」，不会有人立刻发现，
  所以必须有一条会红的检查盯着它

### highlight.js 11.9.0（atom-one-dark 主题）

- 文件：`assets/vendor/highlight.js@11.9.0/styles/atom-one-dark.min.css`
- 主页：https://highlightjs.org
- 许可：BSD-3-Clause
- 只取主题样式表。**高亮器本体是 npm 依赖**（构建时打进 bundle），见下。

---

## Node 依赖

`package.json` 里的全部条目。许可均为 MIT 或 BSD-3-Clause，详见各包内的
`LICENSE` 文件。

运行时（`dependencies`，会进 bundle）：

| 包 | 版本 | 用途 |
|---|---|---|
| `exifr` | ^7.1.3 | 读相册图片的 EXIF（机型、光圈、ISO……） |
| `js-yaml` | ^5.1.0 | 解析 frontmatter |

构建时（`devDependencies`）：

| 包 | 版本 | 用途 |
|---|---|---|
| `nuxt` | ^3.19.0 | SSG |
| `markdown-it` | ^14.1.0 | Markdown 转 HTML |
| `highlight.js` | ^11.9.0 | 代码高亮 |
| `sanitize-html` | ^2.13.0 | 白名单净化（这是本站唯一真正需要它的仓库） |
| `@lhci/cli` | ^0.15.1 | CI 里的 Lighthouse 断言 |
| `playwright-core` | ^1.63.0 | CI 里的视觉自检 |

### 为什么净化库在博客这里、而不在个人站

个人站曾经也 vendor 了一份 DOMPurify，于是暗示了「有 XSS 注入面」——
而那个仓既没有 markdown 渲染路径，也没有不可信输入，暗示是假的。
真正需要净化的是这里的文章渲染：正文来自 `content/**/*.md`，经 markdown-it
变成 HTML。这一份依赖是有对应威胁模型的，不是「顺手搬来的」。

## 三站之间哪些文件是共享的

「个人导航 / 状态站 / 博客」三个站都把依赖直接提交进 `assets/vendor/`、
CSS 直接放在 `assets/css/`。实测（sha256 + 逐变量 diff）之后结论是：

| 文件 | 现状 |
|---|---|
| `assets/css/tokens.css` | **唯一共享的一份**：三站的 87 个自定义属性、122 处取值完全一致 |
| `assets/css/style.css` | 三份全不同（各 9.5K / 35K / 60K），是各站自己的样式表 |
| `assets/css/toast.css` | 两站有且不同；状态站根本没有这个文件 |
| `assets/css/shell.css` | 只有博客有 |

所以「这几个文件在三个仓里是一样的」是**错的**，只有 `tokens.css` 是。

`tokens.css` 没有单一上游，就是三份副本。这是有意接受的取舍，代价是
「改了一处要记得同步另外两处」。`scripts/check-tokens-drift.mjs` 就是这条代价的
兑现：CI 里比的是**每一处**取自定义属性的取值（按出现顺序），不是文件字节——
注释各站自己写。而且不能只比每个属性的「最后一个值」：深色主题在文件后面，
最后一个值永远是深色的，浅色那处漂移就查不出来（第一版就是这么写的，
注入一处浅色改动试过，没报）。

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

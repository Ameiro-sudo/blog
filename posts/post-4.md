# 三站更新 · 设计统一与功能完善
date: 2026-06-05
tags: 更新, 设计, 前端
time: 23:00
readTime: 5 分钟
---
SnowBlock 的三个子站在近期进行了一轮全面的设计统一和功能完善。

## 设计统一

以导航页 [snowblock.top](https://snowblock.top) 为基准，统一了以下设计语言：

**视觉规范**

- 毛玻璃参数（`--glass-bg`、`--glass-border`、`--glass-hover-bg`）三站一致
- 圆角标准统一：大卡片 `3rem`，小控件 `1.5rem`
- 字体栈统一：`ZCOOL KuaiLe` 标题 + `Segoe UI` 正文
- 暗色遮罩统一：`rgba(0,0,0,0.35)` 基础层，暗色模式加深到 `0.40`

**卡片暗色遮罩重写**

之前使用 `::before` 伪元素叠加暗色层，但伪元素的圆角和卡片边框的 1px 偏移导致圆角对不齐。现在改用 CSS 多层背景：

```css
.card {
  background:
    linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)),
    var(--glass-bg);
}
```

同一元素的背景层自然共享圆角，完美对齐。

**SVG 晶体加载器**

三个站统一使用雪花晶体 SVG 动画作为加载器。晶体三条线层依次绘制，配合呼吸光晕。加载策略统一为：背景图加载 + 最少 1500ms + 5000ms 兜底超时。

**暗色模式**

全部支持 `prefers-color-scheme: dark` 系统级暗色切换。加载器在暗色下自动切换为深蓝黑渐变背景。

## 博客功能新增

### 搜索
文章列表顶部搜索框，按标题、标签、日期实时筛选，250ms 防抖。

### 分页
每页 5 篇，底部分页栏支持首尾页和中间页跳转。搜索结果同样支持分页。

### 归档时间轴
`#/archive` 路由，按年→月分组，左侧时间线圆点标记，点击直达文章。

### 标签筛选
页面头部标签按钮，点击过滤文章；文章内标签也可点击筛选。支持叠加搜索使用。

### 相关文章
文章底部按标签 Jaccard 相似度推荐最多 3 篇相关文章。

### Hash 路由
每篇文章独立 URL：`blog.snowblock.top/#/post-编号`，前进/后退正常工作。

## 基础设施

**文件拆分**
三个站全部从单文件 HTML 拆分为 `index.html` + `style.css` + `app.js`，代码更清晰，浏览器可缓存样式和脚本。

**移除 Google Analytics**
删除了所有 Google Analytics 代码和跨站追踪参数 `_gl`，不再跟踪用户。

**移除缓存策略**
去掉了 `Cache-Control` meta 标签和 service worker，避免开发期间缓存干扰。

## 变更清单

| 站点 | 链接 | 主要变更 |
|------|------|----------|
| 导航页 | [snowblock.top](https://snowblock.top) | 设计基准、卡片圆角修复、暗色优化 |
| 博客 | [blog.snowblock.top](https://blog.snowblock.top) | 搜索、分页、归档、标签筛选、相关文章、简介卡片 |
| MC 状态 | [status.snowblock.top](https://status.snowblock.top) | 设计对齐、暗色模式、响应式修复 |

三个站的代码全部托管在 GitHub，通过 GitHub Pages 自动部署。

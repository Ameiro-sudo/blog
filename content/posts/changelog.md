# 博客更新日志
date: 2026-06-06
tags: 更新, 功能, 日志
time: 11:00
readTime: 4 分钟
---

## 2026-06-06 更新

### 文章系统
- Markdown 写作，支持置顶 / 分页 / 搜索 / 标签筛选 / 标签云
- 全文搜索匹配标题 + 标签 + 日期 + 正文摘要
- 搜索关键词黄色高亮显示
- 每页 5 篇，底部分页栏支持跳转

### 归档与热力图
- 按年月分组展示所有文章和相册
- 年度贡献热力图（GitHub 风格），4 级颜色浓度
- 支持切换年份
- 点击方块查看当日文章列表

### 画廊
- 瀑布流相册列表（堆叠卡片动效）
- 相册详情 CSS columns 瀑布流布局
- 分批加载（IntersectionObserver，每次 12 张，预加载下一批）
- 灯箱缩放（滚轮 / 双击 / 触摸双指）
- 灯箱平移（鼠标拖拽 / 触摸单指）
- EXIF 信息展示（相机、ISO、光圈、快门、焦距、尺寸）

### 文章阅读体验
- 文章目录（TOC）：基于 h2/h3 自动生成，滚动高亮当前章节
- 阅读进度条：顶部 3px 渐变色条，随滚动填充
- 相关文章推荐：按标签重合度排序
- 代码块：Atom One Dark 高亮、语言标签、一键复制
- 图片灯箱：文章中图片点击放大
- 字数统计

### 导航与路由
- Hash 路由：`#/` `#/archive` `#/gallery` `#/gallery/相册ID` `#/about` `#/random`
- 随机文章路由
- 导航栏高亮当前页面
- 简介卡片：头像 / 昵称 / 简介 / 社交链接

### 构建系统
- `scripts/build.js`：生成文章 + 相册索引、RSS、Sitemap、版本哈希
- 异步 EXIF 提取（exifr 包，图片目录并行解析）
- 相册目录自动扫描，同名 webp/jpg 去重
- 每次构建写入时间戳，前端 fetch 带 `?v=TS` 防缓存

### 部署
- `deploy.sh`：构建 + 提交 + 推送博客
- `deploy-full.sh`：WebP 转换 + 推 my-images + 推博客
- `-n` 参数跳过 WebP 转换

### 图片 CDN
- `raw.githubusercontent.com/ninasukiwww-png/my-images` 引用
- `?t=BUILD_TS` 时间戳刷新 CDN 缓存
- Service Worker 缓存 CDN 图片
- `deploy-full.sh` 自动用 ffmpeg 转换 webp

### 设计系统
- 毛玻璃暗色设计（backdrop-filter blur + 半透明背景）
- ZCOOL KuaiLe 标题字体
- SVG 晶体加载器动画
- Canvas 雪花粒子
- 暗色模式自适应
- 打印样式优化

### 其他
- RSS 订阅 `feed.xml`
- Sitemap `sitemap.xml`
- 动态 OG 标签（社交分享卡片）
- CSS/JS 自动版本哈希（`?v=8位MD5`）
- 响应式布局，移动端适配

### 已知问题
- jsDelivr CDN 在国内部分地区被屏蔽，已改用 raw.githubusercontent.com

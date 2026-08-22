const n="post1",t="SnowBlock 博客项目总览",d="2026-06-06",e="20:00",o="10 分钟",s=["指南"],r=!0,l="post1.md",p="",i="assets/vendor/images/posts/cover-bocchi-2.webp",c="一个零后端静态单页博客。基于 Markdown 写作，构建时生成索引，GitHub Pages 托管，全站无数据库无服务器。所有源码在 github.com/Ameiro-sudo/blog 。 --- 架构总览 blog/ ├── index.html SPA 入口（加载器 + 毛玻璃 + 雪花粒子） ├── assets/ │ ├── css/style.css 全局样式系统 │ └── js",h=6214,a=`<p>一个零后端静态单页博客。基于 Markdown 写作，构建时生成索引，GitHub Pages 托管，全站无数据库无服务器。所有源码在 <a href="https://github.com/Ameiro-sudo/blog">github.com/Ameiro-sudo/blog</a>。</p>
<hr />
<h2 id="架构总览">架构总览</h2>
<div class="code-block-wrapper"><pre class="hljs"><code>blog/
├── index.html # SPA 入口（加载器 + 毛玻璃 + 雪花粒子）
├── assets/
│ ├── css/style.css # 全局样式系统
│ └── js/app.js # 前端 SPA（路由 / 搜索 / 画廊 / 灯箱 / TOC）
├── content/
│ ├── posts/ # 文章 .md 源文件 + build 生成的 index.json
│ ├── albums/ # 相册索引（build 自动生成）
│ └── pages/ # 独立页面 .md（如 about.md）
├── scripts/
│ └── build.js # 构建脚本（ESM + exifr 异步 EXIF 提取）
├── sw.js # Service Worker（CDN 图片缓存）
├── deploy.sh # 博客一键部署
├── deploy-full.sh # 完整部署（WebP 转换 + my-images + 博客）
└── package.json # exifr 依赖
</code></pre><button class="copy-btn" type="button">复制</button></div>
<p>图片存储在独立仓库 <a href="https://github.com/Ameiro-sudo/my-images">my-images</a>：</p>
<div class="code-block-wrapper"><pre class="hljs"><code>my-images/
└── blog/
 ├── 相册名1/
 │ ├── meta.json # 标题 / 日期 / 简介 / 封面
 │ ├── photo1.webp
 │ └── photo2.jpg
 ├── 相册名2/
 └── ...
</code></pre><button class="copy-btn" type="button">复制</button></div>
<hr />
<h2 id="技术栈">技术栈</h2>
<div class="table-responsive"><table>
<thead>
<tr>
<th>层级</th>
<th>技术</th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td>前端</td>
<td>原生 HTML5 + CSS3 + JS</td>
<td>零框架，纯手工 SPA</td>
</tr>
<tr>
<td>路由</td>
<td>Hash 路由</td>
<td><code>#/id</code> 文章 / <code>#/archive</code> 归档 / <code>#/gallery</code> 画廊 / <code>#/gallery/相册ID</code> 相册详情 / <code>#/about</code> 关于 / <code>#/random</code> 随机</td>
</tr>
<tr>
<td>Markdown</td>
<td>markdown-it 14.x</td>
<td>渲染 + 自定义图片规则（CDN 链接处理）</td>
</tr>
<tr>
<td>代码高亮</td>
<td>highlight.js 11.x</td>
<td>Atom One Dark 主题，语言标签 + 复制按钮</td>
</tr>
<tr>
<td>输入净化</td>
<td>DOMPurify 3.x</td>
<td>XSS 防护，白名单标签/属性</td>
</tr>
<tr>
<td>图标</td>
<td>Iconify</td>
<td>社交链接 SVG 图标（GitHub / Bilibili）</td>
</tr>
<tr>
<td>构建</td>
<td>Node.js ESM</td>
<td><code>scripts/build.js</code>，异步 EXIF 提取</td>
</tr>
<tr>
<td>托管</td>
<td>GitHub Pages</td>
<td>自定义域名 blog.snowblock.top</td>
</tr>
</tbody>
</table></div>
<hr />
<h2 id="写文章">写文章</h2>
<p>在 <code>content/posts/</code> 下新建 <code>.md</code> 文件：</p>
<div class="code-block-wrapper"><span class="code-lang">markdown</span><pre class="hljs"><code><span class="hljs-section"># 文章标题</span>
date: 2026-06-05
tags: 标签1, 标签2
time: 14:20
readTime: 3 分钟
pinned: true
description: 自定义摘要（可选，默认截取正文前 200 字）
<span class="hljs-section">image: https://...分享封面图URL（可选，默认使用站点背景）
---</span>
正文从这里开始，支持 <span class="hljs-strong">**Markdown**</span> 语法。
</code></pre><button class="copy-btn" type="button">复制</button></div>
<p><strong>字段说明：</strong></p>
<div class="table-responsive"><table>
<thead>
<tr>
<th>字段</th>
<th>必填</th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td><code># 标题</code></td>
<td>是</td>
<td>第一行，用作文章标题和 URL</td>
</tr>
<tr>
<td><code>date</code></td>
<td>是</td>
<td>日期，影响排序和归档</td>
</tr>
<tr>
<td><code>tags</code></td>
<td>否</td>
<td>英文逗号分隔，用于筛选和标签云</td>
</tr>
<tr>
<td><code>time</code></td>
<td>否</td>
<td>文章列表显示</td>
</tr>
<tr>
<td><code>readTime</code></td>
<td>否</td>
<td>阅读时长标签</td>
</tr>
<tr>
<td><code>pinned</code></td>
<td>否</td>
<td><code>true</code> 置顶，排在最前</td>
</tr>
<tr>
<td><code>description</code></td>
<td>否</td>
<td>自定义摘要，用于 RSS / OG / 文章卡片</td>
</tr>
<tr>
<td><code>image</code></td>
<td>否</td>
<td>分享到社交平台时显示的封面图</td>
</tr>
</tbody>
</table></div>
<p><strong>图片引用：</strong> 支持两种方式：</p>
<ol>
<li>直接粘贴 CDN 链接：<code>![alt](https://cdn.jsdelivr.net/gh/Ameiro-sudo/my-images@main/blog/xxx.jpg)</code></li>
<li>CDN 链接自动识别：构建时不做处理，运行时 markdown-it 识别 jsDelivr 域名</li>
</ol>
<hr />
<h2 id="添加相册">添加相册</h2>
<p>图片放在 <code>my-images/blog/相册名/</code> 目录下，每张图片可以是 jpg / png / webp / bmp / gif。相同 basename 优先用 webp（去重逻辑）。</p>
<p><strong>meta.json：</strong></p>
<div class="code-block-wrapper"><span class="code-lang">json</span><pre class="hljs"><code><span class="hljs-punctuation">{</span>
 <span class="hljs-attr">"title"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"相册名称"</span><span class="hljs-punctuation">,</span>
 <span class="hljs-attr">"date"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"2026.06"</span><span class="hljs-punctuation">,</span>
 <span class="hljs-attr">"description"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"相册简介"</span><span class="hljs-punctuation">,</span>
 <span class="hljs-attr">"cover"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"封面文件名.jpg"</span>
<span class="hljs-punctuation">}</span>
</code></pre><button class="copy-btn" type="button">复制</button></div>
<p>构建时自动完成：</p>
<ol>
<li>扫描目录所有图片文件</li>
<li>同名 webp 优先（jpg 和 webp 共存时只保留 webp）</li>
<li>用 exifr 解析每张图的 EXIF 信息</li>
<li>生成含 EXIF 的相册索引</li>
</ol>
<p><strong>EXIF 提取内容：</strong> 相机品牌（Make）、型号（Model）、ISO、光圈（FNumber）、快门速度（ExposureTime）、焦距（FocalLength）、图像尺寸（ImageWidth/Height）。</p>
<hr />
<h2 id="构建">构建</h2>
<div class="code-block-wrapper"><span class="code-lang">bash</span><pre class="hljs"><code>node scripts/build.js
</code></pre><button class="copy-btn" type="button">复制</button></div>
<p>一次执行：</p>
<ul>
<li><strong>文章索引</strong> — 扫描 <code>content/posts/</code>，解析元信息和正文摘要，输出 <code>index.json</code></li>
<li><strong>相册索引</strong> — 扫描 <code>my-images/blog/</code> 目录，并行提取 EXIF，输出 <code>index.json</code></li>
<li><strong>RSS 订阅</strong> — 生成 <code>feed.xml</code>，含每篇文章标题/链接/日期/摘要</li>
<li><strong>Sitemap</strong> — 生成 <code>sitemap.xml</code>，含所有文章和路由</li>
<li><strong>版本控制</strong> — 给 <code>style.css</code> 和 <code>app.js</code> 计算 MD5 哈希，注入 <code>?v=8位哈希</code></li>
<li><strong>缓存控制</strong> — 在 <code>index.html</code> 中写入构建时间戳 <code>&lt;meta name="build-ts" content="..."&gt;</code>，前端 fetch 相册索引时带上 <code>?v=时间戳</code> 防缓存</li>
</ul>
<hr />
<h2 id="部署">部署</h2>
<h3 id="仅博客">仅博客</h3>
<div class="code-block-wrapper"><span class="code-lang">bash</span><pre class="hljs"><code>./deploy.sh <span class="hljs-string">"提交说明"</span>
</code></pre><button class="copy-btn" type="button">复制</button></div>
<p>流程：构建 &gt; git add &gt; git commit &gt; git push &gt; GitHub Pages 自动部署。</p>
<h3 id="完整部署含图片">完整部署（含图片）</h3>
<div class="code-block-wrapper"><span class="code-lang">bash</span><pre class="hljs"><code>./deploy-full.sh <span class="hljs-string">"提交说明"</span>
./deploy-full.sh -n <span class="hljs-string">"提交说明"</span> <span class="hljs-comment"># 跳过 WebP 转换</span>
</code></pre><button class="copy-btn" type="button">复制</button></div>
<p>额外步骤：</p>
<ol>
<li>用 ffmpeg 将 <code>my-images/blog/</code> 下的 jpg/png/bmp 转换为 webp</li>
<li>提交并推送 my-images 仓库</li>
<li>再执行博客的构建部署</li>
</ol>
<p><code>-n</code> 参数只在图片已经是 webp 或不需要重新转换时使用，可节省大量时间。</p>
<hr />
<h2 id="图片-cdn">图片 CDN</h2>
<p>所有图片通过 jsDelivr CDN 加载：<code>https://cdn.jsdelivr.net/gh/Ameiro-sudo/my-images@main/blog/</code></p>
<p><strong>缓存策略：</strong></p>
<ul>
<li>构建时在每张图片 URL 后加 <code>?t=BUILD_TS</code>（<code>BUILD_TS = Date.now()</code>）</li>
<li>每次构建时间戳不同，CDN 和浏览器都视为新资源</li>
<li>Service Worker 拦截 CDN 域名请求，缓存到 <code>v1</code> 缓存空间，下次访问直接走缓存</li>
</ul>
<p><strong>注意：</strong> 图片通过 jsDelivr CDN 加载，国内可达性较好。Google Fonts 已被墙，通过 <code>fonts.loli.net</code> / <code>gstatic.loli.net</code> 镜像加载。</p>
<hr />
<h2 id="service-worker">Service Worker</h2>
<p><code>sw.js</code> 注册在根路径，<code>app.js</code> 初始化时自动注册。</p>
<p>行为：</p>
<ul>
<li><code>install</code> 阶段：跳过等待，立即激活</li>
<li><code>activate</code> 阶段：<code>clients.claim()</code> 立即接管所有客户端</li>
<li><code>fetch</code> 阶段：仅拦截 <code>cdn.jsdelivr.net/gh/Ameiro-sudo/my-images</code> 的请求，缓存到 <code>v1</code> 缓存</li>
<li>不缓存博客自身资源（<code>style.css</code>、<code>app.js</code>、<code>content/</code> 等），这些由版本哈希控制</li>
</ul>
<hr />
<h2 id="前端-spa-详解">前端 SPA 详解</h2>
<p><code>assets/js/app.js</code> 是一个自执行函数（IIFE），内部模块：</p>
<h3 id="路由-handlehash">路由 (<code>handleHash</code>)</h3>
<p>监听 <code>hashchange</code> 事件，根据 hash 值分发：</p>
<div class="table-responsive"><table>
<thead>
<tr>
<th>Hash</th>
<th>视图</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>#/</code> 或空</td>
<td>文章列表首页</td>
</tr>
<tr>
<td><code>#/archive</code></td>
<td>归档（热力图 + 时间轴）</td>
</tr>
<tr>
<td><code>#/gallery</code></td>
<td>画廊（相册列表）</td>
</tr>
<tr>
<td><code>#/gallery/相册ID</code></td>
<td>相册详情（瀑布流照片）</td>
</tr>
<tr>
<td><code>#/about</code></td>
<td>关于页面</td>
</tr>
<tr>
<td><code>#/random</code></td>
<td>随机跳转一篇文章</td>
</tr>
<tr>
<td><code>#/文章ID</code></td>
<td>文章详情</td>
</tr>
</tbody>
</table></div>
<h3 id="搜索-applyfilters">搜索 (<code>applyFilters</code>)</h3>
<ul>
<li>实时搜索，250ms 防抖</li>
<li>匹配字段：标题、标签、日期、正文摘要</li>
<li>匹配关键词在标题和摘要中以黄色 <code>&lt;mark&gt;</code> 高亮</li>
<li>搜索结果同样支持分页</li>
</ul>
<h3 id="标签云-rendertagfilters">标签云 (<code>renderTagFilters</code>)</h3>
<ul>
<li>统计所有文章标签的出现频率</li>
<li>按频率分为 3 档（size-1/size-2/size-3），字号越大表示使用越多</li>
<li>点击标签切换筛选，再次点击清除</li>
<li>可叠加搜索框使用</li>
</ul>
<h3 id="文章列表--分页">文章列表 + 分页</h3>
<ul>
<li>每页 5 篇，置顶文章排在最前</li>
<li>分页栏支持上一页/下一页/数字跳转/首尾页</li>
<li>文章卡片包含：标题、日期、标签、摘要、阅读时间</li>
</ul>
<h3 id="文章详情-loadarticle">文章详情 (<code>loadArticle</code>)</h3>
<ul>
<li>从 <code>content/posts/</code> 加载 <code>.md</code> 源文件</li>
<li>剥离元信息区域，仅渲染正文</li>
<li>渲染流程：markdown-it &gt; DOMPurify &gt; innerHTML</li>
<li>代码块自动添加：复制按钮、语言标签、包裹容器</li>
<li>表格自动包裹响应式容器</li>
<li>图片自动绑定点击灯箱</li>
<li>底部显示相关文章（按标签重合度排序）</li>
<li>自动生成文章目录（基于 h2/h3）</li>
<li>字数统计</li>
</ul>
<h3 id="文章目录-toc">文章目录 (TOC)</h3>
<ul>
<li>提取 <code>h2</code> 和 <code>h3</code> 生成目录链接</li>
<li>id 由标题文本自动生成（中文保留）</li>
<li>滚动时 IntersectionObserver 高亮当前可见章节</li>
<li>右下角 ≡ 按钮切换目录面板显示</li>
</ul>
<h3 id="阅读进度条">阅读进度条</h3>
<ul>
<li>页面顶部固定 3px 高的渐变进度条</li>
<li>根据 <code>(scrollTop) / (scrollHeight - clientHeight)</code> 计算百分比</li>
<li>随滚动实时填充</li>
</ul>
<h3 id="归档-renderarchive">归档 (<code>renderArchive</code>)</h3>
<ul>
<li>按年月分组展示所有文章和相册</li>
<li>顶部热力图（GitHub 风格贡献图）</li>
<li>热力图支持切换年份</li>
<li>点击色块方块弹出当日文章列表</li>
</ul>
<h3 id="热力图-renderheatmap">热力图 (<code>renderHeatmap</code>)</h3>
<ul>
<li>以周为行、月为列的网格</li>
<li>颜色深浅表示当日发文数量（4 级）</li>
<li>点击方块弹出文章列表</li>
<li>顶部按钮切换年份</li>
</ul>
<h3 id="画廊-showgallery--showalbum">画廊 (<code>showGallery</code> / <code>showAlbum</code>)</h3>
<ul>
<li>相册列表：瀑布流卡片（堆叠效果，鼠标悬停动画）</li>
<li>相册详情：CSS <code>columns: 260px</code> 瀑布流，分批加载（IntersectionObserver，每次 12 张）</li>
<li>预加载：每次加载后预加载下一批图片的 Image 对象</li>
<li>每张照片点击打开灯箱</li>
</ul>
<h3 id="灯箱">灯箱</h3>
<ul>
<li>全屏黑色毛玻璃遮罩</li>
<li>图片居中显示，最大 90vw / 85vh</li>
<li><strong>缩放：</strong> 滚轮逐级缩放（0.25x 步进）、双击切换 1x / 2.5x、触摸双指缩放</li>
<li><strong>平移：</strong> 缩放后鼠标拖拽平移，触摸单指拖拽</li>
<li><strong>关闭：</strong> 点击遮罩、点击 X 按钮、按 Esc</li>
<li><strong>EXIF 展示：</strong> 底部左侧显示相机参数（品牌、型号、ISO、光圈、快门、焦距、尺寸）</li>
<li>MutationObserver 监听 lightbox 显示状态，打开时重置缩放，关闭时清除 EXIF</li>
</ul>
<h3 id="简介卡片-renderprofile">简介卡片 (<code>renderProfile</code>)</h3>
<ul>
<li>页面顶部展示头像、昵称、简介、社交链接</li>
<li>数据在 <code>profileConfig</code> 配置（硬编码在 app.js）</li>
<li>社交链接使用 Iconify SVG 图标</li>
</ul>
<h3 id="关于页面">关于页面</h3>
<ul>
<li>加载 <code>content/pages/about.md</code>，按文章格式渲染</li>
</ul>
<h3 id="og-标签">OG 标签</h3>
<ul>
<li>动态更新 <code>&lt;meta property="og:..."&gt;</code> 标签</li>
<li>文章页：标题、描述、封面图、URL</li>
<li>首页：重置为默认值</li>
</ul>
<h3 id="service-worker-注册">Service Worker 注册</h3>
<ul>
<li><code>navigator.serviceWorker.register('sw.js')</code></li>
</ul>
<hr />
<h2 id="设计系统">设计系统</h2>
<h3 id="配色">配色</h3>
<div class="table-responsive"><table>
<thead>
<tr>
<th>CSS 变量</th>
<th>值</th>
<th>用途</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>--color-bg-deep</code></td>
<td><code>#0b2b3b</code></td>
<td>深色背景基色</td>
</tr>
<tr>
<td><code>--color-accent</code></td>
<td><code>#8fd8ef</code></td>
<td>冰蓝强调色</td>
</tr>
<tr>
<td><code>--glass-bg</code></td>
<td><code>rgba(255,255,255,0.12)</code></td>
<td>毛玻璃卡片背景</td>
</tr>
<tr>
<td><code>--glass-header-bg</code></td>
<td><code>rgba(11,43,59,0.55)</code></td>
<td>顶栏毛玻璃</td>
</tr>
<tr>
<td><code>--glass-border</code></td>
<td><code>rgba(255,255,255,0.20)</code></td>
<td>毛玻璃边框</td>
</tr>
<tr>
<td><code>--glass-hover-bg</code></td>
<td><code>rgba(255,255,255,0.22)</code></td>
<td>悬停高亮</td>
</tr>
<tr>
<td><code>--shadow-card</code></td>
<td>大阴影</td>
<td>卡片层阴影</td>
</tr>
<tr>
<td><code>--shadow-item</code></td>
<td>小阴影</td>
<td>条目阴影</td>
</tr>
</tbody>
</table></div>
<h3 id="字体">字体</h3>
<ul>
<li><strong>标题：</strong> ZCOOL KuaiLe（Google Fonts，通过 <code>fonts.loli.net</code> 镜像加载）</li>
<li><strong>正文：</strong> Segoe UI / system-ui / sans-serif</li>
<li><strong>代码/标签：</strong> SF Mono / Cascadia Code / Fira Code / monospace</li>
</ul>
<h3 id="毛玻璃系统">毛玻璃系统</h3>
<p>所有卡片（文章卡片、相册卡片、归档卡片、页头）统一：</p>
<ul>
<li><code>backdrop-filter: blur(14-16px) saturate(1.2-1.4)</code></li>
<li>半透明背景 + 半透明边框</li>
<li>双层背景遮罩（黑色渐变叠加层）</li>
</ul>
<h3 id="加载器">加载器</h3>
<p>SVG 晶体动画加载器：</p>
<ul>
<li>三段描边动画（主线条、内线条、核心线条）</li>
<li>呼吸光晕动画</li>
<li>背景图加载 + 最少 1500ms 展示 + 5000ms 超时兜底</li>
<li>加载完成后过渡消失</li>
</ul>
<h3 id="雪花粒子">雪花粒子</h3>
<ul>
<li>Canvas 全屏粒子系统</li>
<li>30-60 片雪花（按屏幕宽度）</li>
<li>大小、速度、透明度随机</li>
<li>加载完成后淡入显示</li>
</ul>
<h3 id="暗色模式">暗色模式</h3>
<ul>
<li><code>@media (prefers-color-scheme: dark)</code></li>
<li>深色背景、低对比度配色</li>
</ul>
<h3 id="打印样式">打印样式</h3>
<ul>
<li>去除毛玻璃效果、背景图、雪花动画</li>
<li>确保纸质输出清晰可读</li>
</ul>
<hr />
<h2 id="本地预览">本地预览</h2>
<p>不需要服务器，直接浏览器打开 <code>index.html</code> 即可。文章从 <code>content/posts/</code> 动态 fetch，构建后的 <code>index.json</code> 用于文章列表。</p>
<div class="code-block-wrapper"><span class="code-lang">bash</span><pre class="hljs"><code><span class="hljs-built_in">cd</span> blog
npm install <span class="hljs-comment"># 安装 exifr</span>
node scripts/build.js <span class="hljs-comment"># 生成索引</span>
<span class="hljs-comment"># 浏览器打开 index.html</span>
</code></pre><button class="copy-btn" type="button">复制</button></div>
<hr />
<h2 id="相关链接">相关链接</h2>
<ul>
<li>GitHub: <a href="https://github.com/Ameiro-sudo">Ameiro-sudo</a></li>
<li>Bilibili: <a href="https://space.bilibili.com/3493084421687360">Shizukuレモン</a></li>
<li>博客: <a href="https://blog.snowblock.top">blog.snowblock.top</a></li>
<li>导航页: <a href="https://snowblock.top">snowblock.top</a></li>
</ul>
`,g={id:n,title:t,date:d,time:e,readTime:o,tags:s,pinned:!0,file:l,description:"",image:i,excerpt:c,wc:6214,html:a};export{d as date,g as default,p as description,c as excerpt,l as file,a as html,n as id,i as image,r as pinned,o as readTime,s as tags,e as time,t as title,h as wc};

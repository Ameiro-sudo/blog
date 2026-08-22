const e="post7",t="Bocchi Client:从原版模板一步一步来的改造记录",n="2026-08-04",o="21:00",i="8 分钟",c=["Mod","开发记录"],l=!0,d="post7.md",h="",a="assets/vendor/images/posts/cover-104120832.webp",s="一直想要一个「孤独摇滚」主题的 Minecraft 客户端。机缘巧合之下,找到了baier233/bocchi-template-1.21.5 ,CC0 许可,随便用随便改,于是开始了这一步步改造（该说不说AI真好用吧，花了15¥就完事了） 声明：题主一点点程序能力都没有，顶多能看懂py的一些简单逻辑，所以本项目为纯vibecoding进行修改 现在这版0.1.0和原版模板之间,一共新增了 3 个",p=2701,r=`<p>一直想要一个「孤独摇滚」主题的 Minecraft 客户端。机缘巧合之下,找到了<a href="https://github.com/baier233/bocchi-template-1.21.5">baier233/bocchi-template-1.21.5</a>,CC0 许可,随便用随便改,于是开始了这一步步改造（该说不说AI真好用吧，花了15¥就完事了）</p>
<p>声明：题主一点点程序能力都没有，顶多能看懂py的一些简单逻辑，所以本项目为纯vibecoding进行修改</p>
<p>现在这版(0.1.0)和原版模板之间,一共新增了 3 个文件、修改了 21 个文件。这篇文章就记录下这些改动是怎么一步步来的。</p>
<h2 id="为什么叫design-系统">为什么叫「Design 系统」</h2>
<p>拿到模板之后,第一感觉是:纹理、SVG、字体、颜色全部硬编码在 Java 里,改一个立绘要翻好几层代码。</p>
<p>所以第一步,先新增了 <code>Design.java</code> —— 一个设计资源集中管理器:</p>
<ul>
<li>所有纹理 / SVG / 字体 / 视频 / 动画 / 配色的路径和默认值,全部收进一个 <code>design.json</code></li>
<li>材质包可以放一份 <code>assets/minecraft/client/design.json</code> 按 key 覆盖任何一项,不用碰 Java 代码</li>
<li>配套新增 <code>ResPack.java</code> 资源读取工具:优先走 Minecraft 的 ResourceManager(材质包可覆盖),失败再回退 classpath</li>
</ul>
<h2 id="21-处硬编码迁移">21 处硬编码迁移</h2>
<p>接下来就是把模板里散落的硬编码全部迁到 Design 系统,这是工作量最大的一步:</p>
<div class="table-responsive"><table>
<thead>
<tr>
<th>模块</th>
<th>迁移内容</th>
</tr>
</thead>
<tbody>
<tr>
<td>启动屏 SplashUI</td>
<td>加载动画纹理改为 <code>Design.resource("textures.bocchi_loading")</code></td>
</tr>
<tr>
<td>Logo / 立绘 / 背景</td>
<td>Logo、后藤立绘、唱片纹理全部走 Design</td>
</tr>
<tr>
<td>按钮图标</td>
<td><code>Design.resource("svgs." + icon)</code></td>
</tr>
<tr>
<td>字体</td>
<td>字体路径统一 <code>Design.resource("fonts." + name, fallback)</code></td>
</tr>
<tr>
<td>配色</td>
<td>唱片配色等改为 <code>Design.color("colors.vinyl_*")</code></td>
</tr>
<tr>
<td>Shader</td>
<td>后处理 shader 路径走 Design</td>
</tr>
</tbody>
</table></div>
<p>迁移完顺手修了个隐藏雷:模板里的字体文件名带大写(如 <code>Kranky-Regular.ttf</code>),而 Minecraft 的 <code>ResourceLocation</code> 只允许小写 <code>[a-z0-9/._-]</code>,大写直接启动崩溃 —— 全部重命名为小写。</p>
<h2 id="资源包热重载">资源包热重载</h2>
<p>原版模板没有资源包功能，于是我增加了材质包设定，可以定制。</p>
<p>给 <code>MixinMinecraftClient</code> 加了 <code>reloadResourcePacks</code> 钩子:资源包重载完成后调用 <code>Design.reload()</code> 并清空纹理缓存,装 / 卸材质包即时生效。立绘、背景、Logo、SVG、配色都能热重载;字体和背景视频因为是静态加载,还是得重启游戏(说明文档里写了)。</p>
<h2 id="功能补全">功能补全</h2>
<p>模板的按钮是「好看的摆设」,点了没反应。这一版把它们全部接上了:</p>
<ul>
<li>主菜单的 单人游戏 / 多人游戏 / 设置 / 语言 / 退出 按钮接入真实行为</li>
<li>按 ESC 返回原版 <code>TitleScreen</code>,并实现 <code>onClose</code></li>
<li>移除模板遗留的「Alt Manager」按钮和测试后处理调用</li>
<li>挖出了作者的废案，增加了入口以及按钮</li>
</ul>
<p>顺手做了个性能优化:视频解码输出从每帧分配 AWT <code>BufferedImage</code> 改为 Skija <code>Bitmap</code> 复用 + 行拷贝。</p>
<h2 id="打包时踩的坑multi-release-manifest">打包时踩的坑:Multi-Release Manifest</h2>
<p>Skija 是 multi-release jar,如果外层 jar 的 Manifest 没有 <code>Multi-Release: true</code>,Java 21 会加载旧版的 <code>sun.misc.Cleaner</code> 路径,直接原生崩溃。</p>
<ul>
<li>Fabric:<code>remapJar</code> 之后用脚本重写 zip 补上 Manifest</li>
<li>NeoForge:<code>shadowJar</code> 配置 Manifest 属性</li>
</ul>
<p>具体分析和踩坑过程见 <a href="https://github.com/Ameiro-sudo/bocchi-mod">bocchi-mod 仓库</a>。</p>
<h2 id="多版本与发行">多版本与发行</h2>
<p>模板只有 1.21.5,顺手把整个改造移植到了 1.21.1(Parchment 映射版本不同,其余代码基本通用)。</p>
<p>现在源码仓库维护三个工程目录(1.21.5 / 1.21.1 / legacy),打包为 4 个变体 × 2 种按钮风格,CI 一键构建:</p>
<ul>
<li><strong>4 变体</strong>:1.21.5-Fabric / 1.21.5-NeoForge / 1.21.1-Fabric / 1.21.1-NeoForge</li>
<li><strong>按钮风格</strong>:原版方形按钮(CozyUI 图标) / 圆角按钮(额外并入 Fogg05 的 CozyUI-Plus 圆角控件素材)</li>
</ul>
<h2 id="下载">下载</h2>
<p>当前正式版 <strong>v1.0.1</strong>(2026-08-22 发布,双 MC 版本 × 双加载器)。下表链接始终指向各 MC 版本的最新构建:</p>
<div class="table-responsive"><table>
<thead>
<tr>
<th>MC 版本</th>
<th>加载器</th>
<th>下载</th>
</tr>
</thead>
<tbody>
<tr>
<td>1.21.5</td>
<td>Fabric / NeoForge</td>
<td><a href="https://github.com/Ameiro-sudo/bocchi-mod/releases/tag/1.21.5">GitHub Releases: 1.21.5</a></td>
</tr>
<tr>
<td>1.21.1</td>
<td>Fabric / NeoForge</td>
<td><a href="https://github.com/Ameiro-sudo/bocchi-mod/releases/tag/1.21.1">GitHub Releases: 1.21.1</a></td>
</tr>
</tbody>
</table></div>
<p>安装:jar 丢进 mods 文件夹,Fabric或NeoForge。</p>
<h2 id="许可与致谢">许可与致谢</h2>
<ul>
<li>模板 <a href="https://github.com/baier233/bocchi-template-1.21.5">bocchi-template-1.21.5</a> — baier233,CC0-1.0</li>
<li>圆角控件素材 <a href="https://github.com/Fogg05/CozyUI-Plus">CozyUI-Plus</a> — Fogg05,GPL-3.0</li>
<li>字体位图 <a href="https://github.com/Fogg05/MCsans-Plus">MCsans-Plus</a> — Fogg05,MIT</li>
<li>Emoji 位图 <a href="https://github.com/Fogg05/Emoji-Plus">Emoji-Plus</a> — Fogg05,MIT</li>
</ul>
<p>以及,永远怀念 05 老师。R.I.P.</p>
<p>源码:<a href="https://github.com/Ameiro-sudo/bocchi-mod">github.com/Ameiro-sudo/bocchi-mod</a></p>
`,g={id:e,title:t,date:n,time:o,readTime:i,tags:c,pinned:!0,file:d,description:"",image:a,excerpt:s,wc:2701,html:r};export{n as date,g as default,h as description,s as excerpt,d as file,r as html,e as id,a as image,l as pinned,i as readTime,c as tags,o as time,t as title,p as wc};

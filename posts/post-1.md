# Markdown 样式展示大全
date: 2026-06-05
tags: 测试, Markdown, 排版
time: 10:00
readTime: 5 分钟
---
这是一篇综合测试文章，用于展示各种 Markdown 渲染效果。

## 标题层级

### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

## 文本样式

普通文本，**加粗**，*斜体*，~~删除线~~，`行内代码`，[超链接](#)。

## 引用

> 这是一段引用文本。
> 
> 引用可以换行，也支持 **内嵌样式**。
>
> > 嵌套引用也可以。

## 无序列表

- 第一项
- 第二项
  - 嵌套项甲
  - 嵌套项乙
- 第三项

## 有序列表

1. 第一步
2. 第二步
   1. 子步骤 A
   2. 子步骤 B
3. 第三步

## 图片

![示例图片](https://picsum.photos/id/104/800/450)

## 表格

| 方案 | 吞吐量 | 延迟 | 成功率 |
|------|--------|------|--------|
| 方案 A | 12500 req/s | 12ms | 99.95% |
| 方案 B | 9800 req/s | 18ms | 99.92% |
| 方案 C | 15200 req/s | 9ms | 99.98% |

## 任务列表

- [x] 已完成任务
- [ ] 未完成任务
- [ ] 待办事项

## 分割线

---

## 内嵌 HTML

<div style="display:flex;gap:1rem;flex-wrap:wrap;margin:0.5rem 0;">
  <span style="background:#1e2a32cc;padding:4px 12px;border-radius:40px;color:#b0f0cc;font-size:0.75rem;">状态: 正常</span>
  <span style="background:#1e2a32cc;padding:4px 12px;border-radius:40px;color:#b0f0cc;font-size:0.75rem;">响应: 24ms</span>
</div>

<progress value="60" max="100" style="width:100%;height:8px;border-radius:20px;"></progress>

<button style="background:#8fd8ef33;border:1px solid #8fd8ef;border-radius:60px;padding:6px 16px;color:white;cursor:pointer;" onclick="alert('测试通过')">点击测试</button>

## 综合卡片

<div style="display:flex;gap:12px;flex-wrap:wrap;">
  <div style="background:linear-gradient(145deg,#ffffff10,#00000030);border-radius:24px;padding:16px;width:180px;text-align:center;">
    存储<br><strong>120GB 可用</strong>
  </div>
  <div style="background:linear-gradient(145deg,#8fd8ef20,#00000030);border-radius:24px;padding:16px;width:180px;text-align:center;">
    网络<br><strong>100Mbps</strong>
  </div>
</div>

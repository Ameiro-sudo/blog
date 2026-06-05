# 如何添加画廊相册
date: 2026-06-06
tags: 画廊, 教程
time: 18:00
readTime: 3 分钟
pinned: false
---

画廊功能已经上线，你可以自己添加相册，不需要改任何代码。

## 数据格式

打开 `albums/index.json`，每个相册的结构如下：

```json
{
  "id": "my-album",
  "title": "相册标题",
  "description": "简短描述，会显示在封面下方",
  "cover": "封面图片 URL",
  "date": "2026.06",
  "photos": [
    { "url": "https://xxx/photo1.jpg", "caption": "照片说明" },
    { "url": "https://xxx/photo2.jpg", "caption": "" },
    { "url": "https://xxx/photo3.jpg" }
  ]
}
```

- `id` —— 唯一标识，字母+短横线，用于路由
- `title` —— 相册标题
- `description` —— 选填，简介文字
- `cover` —— 封面图，显示在相册卡片上
- `date` —— 日期，显示在卡片和详情页
- `photos` —— 照片列表，每张可以带 `caption`（选填）

`caption` 不传或留空，鼠标悬停时不会显示说明文字。

## 操作步骤

1. 打开 `albums/index.json`
2. 在数组末尾加一个对象，按上面的格式填好
3. 保存文件
4. 不需要跑 `node build.js`（相册不走构建）
5. 部署即可

## 照片建议

- 支持任意图片 URL，外链或自己上传都行
- 建议使用竖构图的照片，在瀑布流里效果更好
- 封面图建议 3:2 左右的比例
- 照片数量不限

## 示例

```json
{
  "id": "summer-roadtrip",
  "title": "夏日自驾",
  "description": "沿海公路的风景",
  "cover": "https://example.com/cover.jpg",
  "date": "2026.07",
  "photos": [
    { "url": "https://example.com/photo1.jpg", "caption": "海岸线" },
    { "url": "https://example.com/photo2.jpg", "caption": "日落" },
    { "url": "https://example.com/photo3.jpg" }
  ]
}
```

添加后刷新页面，画廊里就会出现新相册，点进去可以看到瀑布流照片墙，点击照片可以放大浏览。

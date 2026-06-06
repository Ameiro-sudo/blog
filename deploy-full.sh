#!/bin/bash
set -e

BLOG_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGES_DIR="$(cd "$BLOG_DIR/../my-images" && pwd)"

echo "==> 转换 WebP..."
cd "$IMAGES_DIR"
CONVERTED=0
while IFS= read -r -d '' f; do
  base="${f%.*}"
  webp="$base.webp"
  if [ -f "$webp" ]; then
    echo "    跳过（已有 webp）: ${f#blog/}"
    continue
  fi
  echo "    转换: ${f#blog/}"
  ffmpeg -y -i "$f" -compression_level 6 -q:v 82 "$webp" 2>/dev/null
  rm "$f"
  CONVERTED=$((CONVERTED + 1))
done < <(find blog/ -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.bmp' \) -print0)
if [ "$CONVERTED" -gt 0 ]; then
  echo "    转换完成: $CONVERTED 张"
fi

echo ""
echo "==> 处理图床..."
cd "$IMAGES_DIR"

ADDED=$(git status --short | wc -l)
if [ "$ADDED" -gt 0 ]; then
  echo "    变更文件数: $ADDED"
  git add -A
  git commit -m "update: $(date +'%m-%d %H:%M')"
  echo "    -> 推送至 GitHub..."
  git push
  echo "    图床推送完成"
else
  echo "    图床无变更"
fi

cd "$BLOG_DIR"

NEW_POST=$(git ls-files --others --exclude-standard "content/posts/*.md" 2>/dev/null || true)

echo ""
echo "==> 构建博客..."
node scripts/build.js

echo ""
echo "==> 提交并推送博客..."
git add -A

STAGED=$(git diff --cached --stat --diff-filter=ACMR | tail -1 | awk '{print $1}')
if [ -z "$STAGED" ] || [ "$STAGED" -eq 0 ]; then
  echo "    博客无变更，跳过提交"
else
  echo "    变更文件数: $STAGED"
  if [ -n "$1" ]; then
    MSG="$1"
  elif [ -n "$NEW_POST" ]; then
    MSG="add: 新文章"
  else
    MSG="update: $(date +'%m-%d %H:%M')"
  fi
  git commit -m "$MSG"
  git push
fi

echo ""
echo "完成"
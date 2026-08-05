#!/bin/bash
set -e

BLOG_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BLOG_DIR"

NEW_POST=$(git ls-files --others --exclude-standard "content/posts/*.md" 2>/dev/null || true)

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
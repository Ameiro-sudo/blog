function getHeatmapYear() {
  if (!currentHeatmapYear) {
    var years = {}
    postsMeta.forEach(function (p) {
      if (p.date) years[p.date.substring(0, 4)] = true
    })
    var keys = Object.keys(years).sort()
    currentHeatmapYear = parseInt(keys[keys.length - 1]) || new Date().getFullYear()
  }
  return currentHeatmapYear
}

function renderHeatmap() {
  var year = getHeatmapYear()
  var dayCounts = {}
  var dayPosts = {}
  postsMeta.forEach(function (p) {
    if (p.date && p.date.indexOf(year) === 0) {
      dayCounts[p.date] = (dayCounts[p.date] || 0) + 1
      if (!dayPosts[p.date]) dayPosts[p.date] = []
      dayPosts[p.date].push(p)
    }
  })
  heatmapDayPosts = dayPosts
  var startDate = new Date(year, 0, 1)
  var startDay = startDate.getDay()
  var firstCell = new Date(startDate)
  firstCell.setDate(firstCell.getDate() - startDay)
  var endDate = new Date(year, 11, 31)
  var endDay = endDate.getDay()
  var lastCell = new Date(endDate)
  lastCell.setDate(lastCell.getDate() + (6 - endDay))
  var weeks = []
  var cursor = new Date(firstCell)
  while (cursor <= lastCell) {
    var week = []
    for (var d = 0; d < 7; d++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  var maxCount = 0
  Object.keys(dayCounts).forEach(function (k) {
    if (dayCounts[k] > maxCount) maxCount = dayCounts[k]
  })
  function getColor(count) {
    if (count === 0) return 'var(--heatmap-empty)'
    var level = count / (maxCount || 1)
    if (level < 0.25) return 'var(--heatmap-l1)'
    if (level < 0.5) return 'var(--heatmap-l2)'
    if (level < 0.75) return 'var(--heatmap-l3)'
    return 'var(--heatmap-l4)'
  }
  var monthPositions = []
  var seenMonths = {}
  weeks.forEach(function (week, wi) {
    for (var d = 0; d < 7; d++) {
      var m = week[d].getMonth()
      var y = week[d].getFullYear()
      var key = y + '-' + m
      if (!seenMonths[key]) {
        seenMonths[key] = true
        if (y === year) {
          monthPositions.push({ col: wi, label: (m + 1) + '月' })
        }
        break
      }
    }
  })
  var activeYears = {}
  postsMeta.forEach(function (p) {
    if (p.date) activeYears[p.date.substring(0, 4)] = true
  })
  var yearList = Object.keys(activeYears).sort()
  var cellsWidth = weeks.length * 12 - 2
  var monthLabels = Array(weeks.length).fill('')
  monthPositions.forEach(function (mp) {
    monthLabels[mp.col] = mp.label
  })
  var html = '<div class="heatmap-wrap">'
  html += '<div class="heatmap-header">'
  yearList.forEach(function (y) {
    var cls = parseInt(y) === year ? ' active' : ''
    html += '<button class="heatmap-year-btn' + cls + '" data-year="' + y + '">' + y + '</button>'
  })
  html += '</div>'
  html += '<div class="heatmap-body"><div class="heatmap-body-inner">'
  html += '<div class="heatmap-labels">'
  var dayLabels = ['', '一', '', '三', '', '五', '']
  dayLabels.forEach(function (l) {
    html += '<span class="heatmap-label">' + l + '</span>'
  })
  html += '</div><div class="heatmap-grid"><div class="heatmap-months">'
  monthLabels.forEach(function (label) {
    html += '<span class="heatmap-month">' + (label || '') + '</span>'
  })
  html += '</div><div class="heatmap-cells">'
  weeks.forEach(function (week) {
    html += '<div class="hm-week">'
    week.forEach(function (day) {
      var ds = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0')
      var count = dayCounts[ds] || 0
      html += '<span class="heatmap-cell" style="background:' + getColor(count) + '" data-date="' + ds + '"></span>'
    })
    html += '</div>'
  })
  html += '</div></div></div></div>'
  html += '<div class="heatmap-detail" id="heatmapDetail" style="display:none">'
  html += '<div class="heatmap-detail-header">'
  html += '<span class="heatmap-detail-date" id="heatmapDetailDate"></span>'
  html += '<span class="heatmap-detail-close" id="heatmapDetailClose">x</span>'
  html += '</div>'
  html += '<div class="heatmap-detail-list" id="heatmapDetailList"></div>'
  html += '</div></div>'
  return html
}

function renderArchive() {
  var groups = {}
  var pinnedPosts = []
  postsMeta.forEach(function (p) {
    if (p.pinned) { pinnedPosts.push(p); return }
    var year = p.date ? p.date.substring(0, 4) : '未知'
    if (!groups[year]) groups[year] = {}
    var month = p.date ? p.date.substring(5, 7) : '??'
    if (!groups[year][month]) groups[year][month] = { posts: [], albums: [] }
    groups[year][month].posts.push(p)
  })
  albums.forEach(function (a) {
    var parts = a.date ? a.date.split('.') : []
    var year = parts[0] || '未知'
    var month = parts[1] || '??'
    if (!groups[year]) groups[year] = {}
    if (!groups[year][month]) groups[year][month] = { posts: [], albums: [] }
    groups[year][month].albums.push(a)
  })
  var html = ''
  if (pinnedPosts.length) {
    html += '<div class="archive-year"><div class="archive-year-header">[置顶]</div><div class="archive-month"><ul class="archive-list">'
    pinnedPosts.forEach(function (p) {
      html += '<li class="archive-item" data-id="' + p.id + '">' +
        '<span class="archive-item-date">' + (p.date ? p.date.substring(8, 10) : '') + '</span>' +
        '<span class="archive-item-title">' + p.title + '</span></li>'
    })
    html += '</ul></div></div>'
  }
  var years = Object.keys(groups).sort().reverse()
  years.forEach(function (year) {
    html += '<div class="archive-year"><div class="archive-year-header">' + year + '</div>'
    var months = Object.keys(groups[year]).sort().reverse()
    months.forEach(function (month) {
      var block = groups[year][month]
      html += '<div class="archive-month"><div class="archive-month-header">' + month + '月</div><ul class="archive-list">'
      block.posts.sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') })
      block.posts.forEach(function (p) {
        var day = p.date ? p.date.substring(8, 10) : ''
        html += '<li class="archive-item" data-id="' + p.id + '">' +
          '<span class="archive-item-date">' + day + '</span>' +
          '<span class="archive-item-title">' + p.title + '</span></li>'
      })
      block.albums.forEach(function (a) {
        html += '<li class="archive-item archive-album" data-album="' + a.id + '">' +
          '<span class="archive-item-date">[相册]</span>' +
          '<span class="archive-item-title">' + a.title + '</span></li>'
      })
      html += '</ul></div>'
    })
    html += '</div>'
  })
  archiveContent.innerHTML = renderHeatmap() + html
  archiveContent.querySelectorAll('.archive-item[data-id]').forEach(function (el) {
    el.addEventListener('click', function () { navigateTo(el.dataset.id) })
  })
  archiveContent.querySelectorAll('.archive-item[data-album]').forEach(function (el) {
    el.addEventListener('click', function () { location.hash = '#/gallery/' + el.dataset.album })
  })
  archiveContent.querySelectorAll('.heatmap-year-btn').forEach(function (el) {
    el.addEventListener('click', function () {
      currentHeatmapYear = parseInt(el.dataset.year)
      renderArchive()
    })
  })
  archiveContent.querySelectorAll('.heatmap-cell').forEach(function (el) {
    el.addEventListener('click', function () {
      var date = el.dataset.date
      var posts = (heatmapDayPosts[date] || [])
      var detail = document.getElementById('heatmapDetail')
      var detailDate = document.getElementById('heatmapDetailDate')
      var detailList = document.getElementById('heatmapDetailList')
      if (!detail) return
      detailDate.textContent = date + (posts.length ? ' . ' + posts.length + ' 篇' : ' . 无文章')
      if (posts.length) {
        var listHtml = ''
        posts.forEach(function (p) {
          listHtml += '<div class="heatmap-detail-item" data-id="' + p.id + '">' + p.title + '</div>'
        })
        detailList.innerHTML = listHtml
        detailList.querySelectorAll('.heatmap-detail-item').forEach(function (item) {
          item.addEventListener('click', function () { navigateTo(item.dataset.id) })
        })
      } else {
        detailList.innerHTML = ''
      }
      detail.style.display = 'block'
    })
  })
  var closeBtn = document.getElementById('heatmapDetailClose')
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      document.getElementById('heatmapDetail').style.display = 'none'
    })
  }
}

function showArchive() {
  listView.style.display = 'none'
  articleViewEl.style.display = 'none'
  galleryView.style.display = 'none'
  archiveViewEl.style.display = 'block'
  pageHeader.style.display = 'none'
  tocToggle.classList.remove('show')
  tocPanel.classList.remove('show')
  resetOG()
  document.title = '归档 · SnowBlock'
  setOGTag('og:title', '归档 · SnowBlock')
  renderArchive()
  window.scrollTo({ top: 0 })
}

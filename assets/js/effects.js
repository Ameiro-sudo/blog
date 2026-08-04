app.effects = {
  prefs: {},
  canvases: {},

  init: function() {
    this.loadPrefs()
    this.bindToggles()
    this.refreshButtons()
    if (this.prefs.snow) this.enableSnow(true)
    if (this.prefs.mouseTrail) this.enable('mouseTrail')
    if (this.prefs.sparkle) this.enable('sparkle')
    if (this.prefs.click) this.enable('click')
  },

  loadPrefs: function() {
    var defs = { snow: true, mouseTrail: false, sparkle: false, click: false }
    var saved = null
    try { saved = localStorage.getItem('fxPrefs') } catch (e) {}
    if (saved) {
      try { defs = Object.assign(defs, JSON.parse(saved)) } catch (e) {}
    }
    this.prefs = defs
  },

  savePrefs: function() {
    try { localStorage.setItem('fxPrefs', JSON.stringify(this.prefs)) } catch (e) {}
  },

  bindToggles: function() {
    var self = this
    ;['snow', 'mouseTrail', 'sparkle', 'click'].forEach(function(key) {
      var btn = document.getElementById('fx_' + key)
      if (!btn) return
      btn.addEventListener('click', function() {
        self.prefs[key] = !self.prefs[key]
        self.savePrefs()
        if (key === 'snow') self.enableSnow(self.prefs.snow)
        else if (self.prefs[key]) self.enable(key)
        else self.disable(key)
        self.refreshButtons()
      })
    })
  },

  refreshButtons: function() {
    var self = this
    ;['snow', 'mouseTrail', 'sparkle', 'click'].forEach(function(key) {
      var btn = document.getElementById('fx_' + key)
      if (btn) btn.classList.toggle('active', !!self.prefs[key])
    })
  },

  enableSnow: function(on) {
    var c = document.getElementById('snowCanvas')
    if (c) c.style.display = on ? '' : 'none'
  },

  createCanvas: function(id) {
    var c = document.createElement('canvas')
    c.id = id
    c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9997;'
    document.body.appendChild(c)
    return c
  },

  enable: function(key) {
    if (key === 'mouseTrail') this.trailOn()
    else if (key === 'sparkle') this.sparkleOn()
    else if (key === 'click') this.clickOn()
  },

  disable: function(key) {
    if (key === 'mouseTrail') this.trailOff()
    else if (key === 'sparkle') this.sparkleOff()
    else if (key === 'click') this.clickOff()
  },

  /* ===== 鼠标拖尾 ===== */
  trailOn: function() {
    var c = this.createCanvas('fxTrail')
    var ctx = c.getContext('2d')
    var particles = []
    var frame = 0
    var self = this

    function resize() { c.width = window.innerWidth; c.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    function handleMove(e) {
      for (var i = 0; i < 2; i++) {
        var angle = Math.random() * Math.PI * 2
        var speed = Math.random() * 1.5 + 0.5
        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 0,
          maxLife: Math.random() * 30 + 20,
          size: Math.random() * 3 + 1.5,
          hue: Math.random() * 60 + 180
        })
      }
      if (particles.length > 200) particles = particles.slice(-150)
    }
    window.addEventListener('mousemove', handleMove)

    function animate() {
      ctx.clearRect(0, 0, c.width, c.height)
      particles.forEach(function(p) {
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.02
        p.vx *= 0.98
        p.vy *= 0.98
        var progress = p.life / p.maxLife
        var alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7
        var scale = 1 - progress * 0.5
        ctx.save()
        ctx.globalAlpha = Math.max(0, alpha) * 0.8
        ctx.fillStyle = 'hsl(' + p.hue + ', 80%, 70%)'
        ctx.shadowColor = 'hsl(' + p.hue + ', 80%, 70%)'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
      particles = particles.filter(function(p) { return p.life < p.maxLife })
      frame = requestAnimationFrame(animate)
    }
    animate()

    this.canvases.trail = { canvas: c, frame: frame, move: handleMove, resize: resize }
  },

  trailOff: function() {
    var d = this.canvases.trail
    if (!d) return
    cancelAnimationFrame(d.frame)
    window.removeEventListener('mousemove', d.move)
    window.removeEventListener('resize', d.resize)
    d.canvas.remove()
    delete this.canvases.trail
  },

  /* ===== 选中闪光 ===== */
  sparkleOn: function() {
    var c = this.createCanvas('fxSparkle')
    var ctx = c.getContext('2d')
    var sparkles = []
    var frame = 0

    function resize() { c.width = window.innerWidth; c.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    var colors = ['#fef08a', '#fde047', '#fbbf24', '#f9a8d4', '#e879f9', '#ffffff', '#67e8f9', '#a78bfa']

    function spawnAt(x, y) {
      var count = 10 + Math.floor(Math.random() * 12)
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2
        var speed = 1.5 + Math.random() * 3
        var life = 30 + Math.random() * 50
        sparkles.push({
          x: x, y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 2.5 + Math.random() * 4.5,
          opacity: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: life,
          maxLife: life
        })
      }
    }

    function handleSelection() {
      var sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount) return
      var range = sel.getRangeAt(0)
      var rect = range.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      spawnAt(rect.left + rect.width / 2, rect.top + rect.height / 2)
      if (rect.width > 50) {
        spawnAt(rect.left + 5, rect.top + rect.height / 2)
        spawnAt(rect.right - 5, rect.top + rect.height / 2)
      }
    }
    function onUp() { setTimeout(handleSelection, 0) }
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)

    function animate() {
      ctx.clearRect(0, 0, c.width, c.height)
      sparkles = sparkles.filter(function(p) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.04
        p.rotation += p.rotationSpeed
        p.life--
        p.opacity = Math.max(0, (p.life / p.maxLife) * 0.9)
        p.size *= 0.985
        return p.life > 0
      })
      sparkles.forEach(function(p) {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        var s = p.size
        ctx.beginPath()
        for (var i = 0; i < 4; i++) {
          var a = (i * Math.PI) / 2
          var a2 = a + Math.PI / 4
          ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s)
          ctx.lineTo(Math.cos(a2) * s * 0.3, Math.sin(a2) * s * 0.3)
        }
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      })
      frame = requestAnimationFrame(animate)
    }
    animate()

    this.canvases.sparkle = { canvas: c, frame: frame, up: onUp, resize: resize }
  },

  sparkleOff: function() {
    var d = this.canvases.sparkle
    if (!d) return
    cancelAnimationFrame(d.frame)
    window.removeEventListener('mouseup', d.up)
    window.removeEventListener('touchend', d.up)
    window.removeEventListener('resize', d.resize)
    d.canvas.remove()
    delete this.canvases.sparkle
  },

  /* ===== 点击特效 ===== */
  clickOn: function() {
    var c = this.createCanvas('fxClick')
    var ctx = c.getContext('2d')
    var rings = []
    var frame = 0

    function resize() { c.width = window.innerWidth; c.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    function handleClick(e) {
      rings.push({
        x: e.clientX, y: e.clientY,
        r: 2, maxR: 30 + Math.random() * 20,
        alpha: 0.8,
        hue: Math.random() * 60 + 180
      })
    }
    window.addEventListener('mousedown', handleClick)

    function animate() {
      ctx.clearRect(0, 0, c.width, c.height)
      rings = rings.filter(function(p) {
        p.r += 2
        p.alpha *= 0.92
        return p.alpha > 0.02
      })
      rings.forEach(function(p) {
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.strokeStyle = 'hsl(' + p.hue + ', 80%, 70%)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      })
      frame = requestAnimationFrame(animate)
    }
    animate()

    this.canvases.click = { canvas: c, frame: frame, down: handleClick, resize: resize }
  },

  clickOff: function() {
    var d = this.canvases.click
    if (!d) return
    cancelAnimationFrame(d.frame)
    window.removeEventListener('mousedown', d.down)
    window.removeEventListener('resize', d.resize)
    d.canvas.remove()
    delete this.canvases.click
  }
}

export function spawnConfetti({
  count = 320,
  x = 50,
  y = 0,
  colors,
} = {}) {
  const palette = Array.isArray(colors) && colors.length
    ? colors
    : ['#ff5ad6', '#f472ff', '#ffd1f5', '#ff6bcb', '#ff8adf', '#ffb3ea']

  const root = document.createElement('div')
  root.className = 'confetti-root confetti-root--fullscreen'
  root.style.left = `${x}%`
  root.style.top = `${y}px`

  const viewportWidth = Math.max(window.innerWidth || 0, 320)
  const minX = -viewportWidth * 0.1
  const maxX = viewportWidth * 1.1

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span')
    const isStar = Math.random() < 0.22
    piece.className = isStar ? 'confetti-piece confetti-piece--star' : 'confetti-piece'

    const color = palette[Math.floor(Math.random() * palette.length)]
    const size = isStar ? 12 + Math.random() * 14 : 10 + Math.random() * 18
    const rotate = Math.random() * 360
    const duration = 1700 + Math.random() * 1900
    const delay = Math.random() * 650
    const drift = (Math.random() - 0.5) * 520
    const spawnX = minX + Math.random() * (maxX - minX)
    const spin = (Math.random() - 0.5) * 2.8
    const radius = 2 + Math.random() * 5
    const blur = Math.random() > 0.7 ? 0.6 : 0

    piece.style.background = color
    piece.style.width = `${size}px`
    piece.style.height = isStar ? `${size}px` : `${size * (0.5 + Math.random() * 0.4)}px`
    piece.style.borderRadius = isStar ? '0' : `${radius}px`
    piece.style.filter = `blur(${blur}px)`

    piece.style.setProperty('--spawn-x', `${spawnX}px`)
    piece.style.setProperty('--drift', `${drift}px`)
    piece.style.setProperty('--rotate', `${rotate}deg`)
    piece.style.setProperty('--spin', `${spin}turn`)
    piece.style.setProperty('--duration', `${duration}ms`)
    piece.style.setProperty('--delay', `${delay}ms`)

    root.appendChild(piece)
  }

  document.body.appendChild(root)

  window.setTimeout(() => {
    root.remove()
  }, 5600)
}


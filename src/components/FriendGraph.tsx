'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Profile } from '@/types'

interface Node {
  id: string
  name: string
  avatar: string | null
  x: number
  y: number
  vx: number
  vy: number
  isCenter: boolean
  img?: HTMLImageElement | null
  scale: number
  targetScale: number
}

interface FriendGraphProps {
  center: Profile
  friends: Profile[]
  onClose: () => void
  onNavigate: (id: string) => void
}

export default function FriendGraph({ center, friends, onClose, onNavigate }: FriendGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const animRef = useRef<number>(0)
  const dragRef = useRef<{ node: Node; offsetX: number; offsetY: number; startX: number; startY: number } | null>(null)
  const hoverRef = useRef<Node | null>(null)
  const frameRef = useRef(0)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    setSize({ w, h })

    const cx = w / 2
    const cy = h / 2

    const nodes: Node[] = [
      { id: center.id, name: center.full_name, avatar: center.avatar_url, x: cx, y: cy, vx: 0, vy: 0, isCenter: true, scale: 0, targetScale: 1 },
    ]

    friends.forEach((f, i) => {
      const angle = (2 * Math.PI * i) / friends.length - Math.PI / 2
      const r = Math.min(w, h) * 0.28
      nodes.push({
        id: f.id,
        name: f.full_name,
        avatar: f.avatar_url,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        vx: 0,
        vy: 0,
        isCenter: false,
        scale: 0,
        targetScale: 1,
      })
    })

    // Load avatar images
    nodes.forEach(n => {
      if (n.avatar) {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.src = n.avatar
        n.img = img
      }
    })

    nodesRef.current = nodes

    function tick() {
      frameRef.current++
      const nodes = nodesRef.current
      const centerNode = nodes[0]

      // Animate scale in with stagger
      for (let i = 0; i < nodes.length; i++) {
        const delay = i === 0 ? 0 : 5 + i * 3
        if (frameRef.current > delay) {
          nodes[i].scale += (nodes[i].targetScale - nodes[i].scale) * 0.12
        }
      }

      // Force simulation
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const repulse = 4000 / (dist * dist)
          const fx = (dx / dist) * repulse
          const fy = (dy / dist) * repulse
          if (!dragRef.current || dragRef.current.node !== nodes[i]) {
            nodes[i].vx -= fx
            nodes[i].vy -= fy
          }
          if (!dragRef.current || dragRef.current.node !== nodes[j]) {
            nodes[j].vx += fx
            nodes[j].vy += fy
          }
        }
      }

      // Attraction to center
      for (let i = 1; i < nodes.length; i++) {
        const dx = centerNode.x - nodes[i].x
        const dy = centerNode.y - nodes[i].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const targetDist = Math.min(w, h) * 0.25
        const force = (dist - targetDist) * 0.008
        if (!dragRef.current || dragRef.current.node !== nodes[i]) {
          nodes[i].vx += (dx / dist) * force
          nodes[i].vy += (dy / dist) * force
        }
      }

      // Center gravity + damping
      for (const n of nodes) {
        if (dragRef.current && dragRef.current.node === n) continue
        n.vx += (cx - n.x) * 0.0008
        n.vy += (cy - n.y) * 0.0008
        n.vx *= 0.88
        n.vy *= 0.88
        n.x += n.vx
        n.y += n.vy
      }

      draw()
      animRef.current = requestAnimationFrame(tick)
    }

    function draw() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)

      ctx.clearRect(0, 0, w, h)

      // Subtle radial gradient background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6)
      bgGrad.addColorStop(0, 'rgba(255,255,255,0.02)')
      bgGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      const nodes = nodesRef.current
      const centerNode = nodes[0]
      const hover = hoverRef.current

      // Draw edges with gradient
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i]
        if (n.scale < 0.05) continue
        const grad = ctx.createLinearGradient(centerNode.x, centerNode.y, n.x, n.y)
        grad.addColorStop(0, `rgba(255,255,255,${0.15 * n.scale})`)
        grad.addColorStop(1, `rgba(255,255,255,${0.04 * n.scale})`)
        ctx.beginPath()
        ctx.moveTo(centerNode.x, centerNode.y)
        ctx.lineTo(n.x, n.y)
        ctx.strokeStyle = grad
        ctx.lineWidth = hover === n ? 2 : 1
        ctx.stroke()
      }

      // Draw nodes (friends first, then center on top)
      const sorted = [...nodes].sort((a, b) => (a.isCenter ? 1 : 0) - (b.isCenter ? 1 : 0))

      for (const n of sorted) {
        if (n.scale < 0.01) continue

        const baseR = n.isCenter ? 36 : 26
        const isHovered = hover === n
        const r = baseR * n.scale * (isHovered ? 1.1 : 1)

        ctx.save()

        // Glow for center node
        if (n.isCenter && n.scale > 0.5) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, r + 8, 0, Math.PI * 2)
          const glow = ctx.createRadialGradient(n.x, n.y, r - 2, n.x, n.y, r + 8)
          glow.addColorStop(0, 'rgba(255,255,255,0.12)')
          glow.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = glow
          ctx.fill()
        }

        // Hover glow
        if (isHovered && !n.isCenter) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2)
          const glow = ctx.createRadialGradient(n.x, n.y, r - 2, n.x, n.y, r + 6)
          glow.addColorStop(0, 'rgba(255,255,255,0.08)')
          glow.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = glow
          ctx.fill()
        }

        // Avatar circle
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.closePath()
        ctx.save()
        ctx.clip()

        if (n.img && n.img.complete && n.img.naturalWidth > 0) {
          ctx.drawImage(n.img, n.x - r, n.y - r, r * 2, r * 2)
        } else {
          ctx.fillStyle = '#1a1a1a'
          ctx.fillRect(n.x - r, n.y - r, r * 2, r * 2)
          ctx.fillStyle = '#666'
          ctx.font = `bold ${r * 0.75}px "DM Sans", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(n.name?.charAt(0)?.toUpperCase() || '?', n.x, n.y)
        }
        ctx.restore()

        // Border ring
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = n.isCenter ? 'rgba(255,255,255,0.6)' : isHovered ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'
        ctx.lineWidth = n.isCenter ? 2.5 : isHovered ? 2 : 1.5
        ctx.stroke()

        ctx.restore()

        // Name label with shadow
        const nameY = n.y + r + (n.isCenter ? 18 : 15)
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.font = `${n.isCenter ? 600 : 500} ${n.isCenter ? 14 : 12}px "DM Sans", sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(n.name?.split(' ')[0] || '', n.x + 1, nameY + 1)
        ctx.fillStyle = n.isCenter ? '#fff' : isHovered ? '#fff' : 'rgba(255,255,255,0.7)'
        ctx.fillText(n.name?.split(' ')[0] || '', n.x, nameY)

        // Full name subtitle for center
        if (n.isCenter && n.scale > 0.8) {
          const lastName = n.name?.split(' ').slice(1).join(' ')
          if (lastName) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = `400 11px "DM Sans", sans-serif`
            ctx.fillText(lastName, n.x, nameY + 16)
          }
        }
      }
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [center, friends]) // eslint-disable-line react-hooks/exhaustive-deps

  function getNodeAt(x: number, y: number): Node | null {
    for (const n of [...nodesRef.current].reverse()) {
      const r = (n.isCenter ? 36 : 26) * n.scale
      const dx = x - n.x
      const dy = y - n.y
      if (dx * dx + dy * dy <= (r + 5) * (r + 5)) return n
    }
    return null
  }

  function handlePointerDown(e: React.PointerEvent) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const node = getNodeAt(x, y)
    if (node) {
      dragRef.current = { node, offsetX: x - node.x, offsetY: y - node.y, startX: x, startY: y }
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (dragRef.current) {
      dragRef.current.node.x = x - dragRef.current.offsetX
      dragRef.current.node.y = y - dragRef.current.offsetY
      dragRef.current.node.vx = 0
      dragRef.current.node.vy = 0
    }

    // Update hover
    const canvas = canvasRef.current
    if (canvas) {
      const node = getNodeAt(x, y)
      hoverRef.current = node
      canvas.style.cursor = node ? 'pointer' : 'default'
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const dx = x - dragRef.current.startX
        const dy = y - dragRef.current.startY
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
          onNavigate(dragRef.current.node.id)
        }
      }
      dragRef.current = null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-5">
        <div>
          <h2 className="text-white text-[16px] font-bold">{center.full_name}&apos;s Network</h2>
          <p className="text-white/40 text-[12px]">{friends.length} friend{friends.length !== 1 ? 's' : ''} &middot; drag to rearrange &middot; tap to visit</p>
        </div>
        <button onClick={onClose} className="press text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2.5 transition-colors">
          <X size={18} />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { hoverRef.current = null }}
        className="touch-none"
      />
    </div>
  )
}

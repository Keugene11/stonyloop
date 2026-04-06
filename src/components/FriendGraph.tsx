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
  const dragRef = useRef<{ node: Node; offsetX: number; offsetY: number } | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    setSize({ w, h })

    const cx = w / 2
    const cy = h / 2

    const nodes: Node[] = [
      { id: center.id, name: center.full_name, avatar: center.avatar_url, x: cx, y: cy, vx: 0, vy: 0, isCenter: true },
    ]

    friends.forEach((f, i) => {
      const angle = (2 * Math.PI * i) / friends.length
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
      const nodes = nodesRef.current
      const centerNode = nodes[0]

      // Simple force simulation
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          // Repulsion between all nodes
          const repulse = 3000 / (dist * dist)
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

      // Attraction to center for friend nodes
      for (let i = 1; i < nodes.length; i++) {
        const dx = centerNode.x - nodes[i].x
        const dy = centerNode.y - nodes[i].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const targetDist = Math.min(w, h) * 0.25
        const force = (dist - targetDist) * 0.01
        if (!dragRef.current || dragRef.current.node !== nodes[i]) {
          nodes[i].vx += (dx / dist) * force
          nodes[i].vy += (dy / dist) * force
        }
      }

      // Center gravity
      for (const n of nodes) {
        if (dragRef.current && dragRef.current.node === n) continue
        n.vx += (cx - n.x) * 0.001
        n.vy += (cy - n.y) * 0.001
        n.vx *= 0.85
        n.vy *= 0.85
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

      const nodes = nodesRef.current
      const centerNode = nodes[0]

      // Draw edges
      for (let i = 1; i < nodes.length; i++) {
        ctx.beginPath()
        ctx.moveTo(centerNode.x, centerNode.y)
        ctx.lineTo(nodes[i].x, nodes[i].y)
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Draw nodes
      for (const n of nodes) {
        const r = n.isCenter ? 32 : 24

        // Circle
        ctx.save()
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()

        if (n.img && n.img.complete && n.img.naturalWidth > 0) {
          ctx.drawImage(n.img, n.x - r, n.y - r, r * 2, r * 2)
        } else {
          ctx.fillStyle = '#2a2a2a'
          ctx.fillRect(n.x - r, n.y - r, r * 2, r * 2)
          ctx.fillStyle = '#888'
          ctx.font = `bold ${r * 0.8}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(n.name?.charAt(0)?.toUpperCase() || '?', n.x, n.y)
        }
        ctx.restore()

        // Border
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = n.isCenter ? '#fff' : 'rgba(255,255,255,0.2)'
        ctx.lineWidth = n.isCenter ? 2.5 : 1.5
        ctx.stroke()

        // Name label
        ctx.fillStyle = '#fff'
        ctx.font = `${n.isCenter ? 600 : 500} ${n.isCenter ? 13 : 11}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(n.name?.split(' ')[0] || '', n.x, n.y + r + 14)
      }
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [center, friends]) // eslint-disable-line react-hooks/exhaustive-deps

  function getNodeAt(x: number, y: number): Node | null {
    for (const n of nodesRef.current) {
      const r = n.isCenter ? 32 : 24
      const dx = x - n.x
      const dy = y - n.y
      if (dx * dx + dy * dy <= r * r) return n
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
      dragRef.current = { node, offsetX: x - node.x, offsetY: y - node.y }
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    dragRef.current.node.x = e.clientX - rect.left - dragRef.current.offsetX
    dragRef.current.node.y = e.clientY - rect.top - dragRef.current.offsetY
    dragRef.current.node.vx = 0
    dragRef.current.node.vy = 0
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const dx = x - (dragRef.current.node.x + dragRef.current.offsetX)
        const dy = y - (dragRef.current.node.y + dragRef.current.offsetY)
        // If barely moved, treat as click
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
          onNavigate(dragRef.current.node.id)
        }
      }
      dragRef.current = null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white press z-10 bg-white/10 rounded-full p-2">
        <X size={20} />
      </button>
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="touch-none"
      />
    </div>
  )
}

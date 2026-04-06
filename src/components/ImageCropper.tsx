'use client'

import { useState, useRef, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react'

interface ImageCropperProps {
  file: File
  aspectRatio?: number
  onSave: (blob: Blob) => void
  onCancel: () => void
}

export default function ImageCropper({ file, aspectRatio = 16 / 9, onSave, onCancel }: ImageCropperProps) {
  const [imgSrc] = useState(() => URL.createObjectURL(file))
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const WIDTH = 320
  const HEIGHT = WIDTH / aspectRatio

  function handlePointerDown(e: React.PointerEvent) {
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  function handlePointerUp() {
    setDragging(false)
  }

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const outW = 800
    const outH = outW / aspectRatio
    canvas.width = outW
    canvas.height = outH

    const scaleX = outW / WIDTH
    const scaleY = outH / HEIGHT
    const imgW = img.naturalWidth
    const imgH = img.naturalHeight
    const fitScale = Math.max(WIDTH / imgW, HEIGHT / imgH) * zoom

    const drawW = imgW * fitScale * scaleX
    const drawH = imgH * fitScale * scaleY
    const drawX = (outW - drawW) / 2 + offset.x * scaleX
    const drawY = (outH - drawH) / 2 + offset.y * scaleY

    ctx.drawImage(img, drawX, drawY, drawW, drawH)

    canvas.toBlob((blob) => {
      if (blob) onSave(blob)
    }, 'image/jpeg', 0.9)
  }, [zoom, offset, onSave, aspectRatio])

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
      <div className="text-center mb-4">
        <h2 className="text-white text-[16px] font-bold">Adjust your photo</h2>
        <p className="text-white/40 text-[12px]">Drag to reposition, zoom to fit</p>
      </div>

      <div
        className="relative overflow-hidden border-2 border-white/20 rounded-2xl cursor-grab active:cursor-grabbing touch-none"
        style={{ width: WIDTH, height: HEIGHT }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <img
          ref={imgRef}
          src={imgSrc}
          alt=""
          className="absolute select-none pointer-events-none"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transformOrigin: 'center center',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        />
      </div>

      <div className="flex items-center gap-4 mt-5">
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="press text-white/60 hover:text-white p-2">
          <ZoomOut size={20} />
        </button>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.05"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-40 accent-accent"
        />
        <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="press text-white/60 hover:text-white p-2">
          <ZoomIn size={20} />
        </button>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onCancel} className="press flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white rounded-2xl px-6 py-2.5 text-[14px] font-medium">
          <X size={16} /> Cancel
        </button>
        <button onClick={handleSave} className="press flex items-center gap-2 bg-accent text-white rounded-2xl px-6 py-2.5 text-[14px] font-medium">
          <Check size={16} /> Save
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

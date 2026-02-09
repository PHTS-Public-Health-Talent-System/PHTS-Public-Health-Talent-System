"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  className?: string
  clearLabel?: string
  saveLabel?: string
  placeholder?: string
  height?: number
}

export default function SignaturePad({
  onSave,
  className,
  clearLabel = "ล้างลายเซ็น",
  saveLabel = "บันทึกลายเซ็น",
  placeholder = "เซ็นชื่อในช่องนี้",
  height = 220,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [hasSignature, setHasSignature] = useState(false)
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ratio = window.devicePixelRatio || 1
    const width = container.clientWidth

    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#0f172a"

    if (dataUrl) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
      }
      img.src = dataUrl
    }
  }, [dataUrl, height])

  useEffect(() => {
    resizeCanvas()
    const observer = new ResizeObserver(() => resizeCanvas())
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [resizeCanvas])

  const getPoint = (event: PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getPoint(event.nativeEvent)
    if (!point) return
    isDrawingRef.current = true
    lastPointRef.current = point
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const point = getPoint(event.nativeEvent)
    if (!ctx || !point || !lastPointRef.current) return

    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
    setHasSignature(true)
  }

  const endDrawing = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    lastPointRef.current = null

    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL("image/png")
    setDataUrl(url)
    onSave(url)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setDataUrl(null)
    onSave("")
  }

  const saveSignature = () => {
    if (!dataUrl) return
    onSave(dataUrl)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={containerRef}
        className="relative w-full rounded-lg bg-white"
      >
        <canvas
          ref={canvasRef}
          className="block w-full rounded-lg border border-border bg-white touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
        />
        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
          {clearLabel}
        </Button>
        <Button type="button" size="sm" onClick={saveSignature} disabled={!dataUrl}>
          {saveLabel}
        </Button>
      </div>
    </div>
  )
}

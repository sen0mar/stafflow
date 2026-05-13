import { useEffect, useRef } from 'react'

interface Dot {
  x: number
  y: number
}

const dotSpacing = 16
const dotRadius = 1
const pushRadius = 126
const maxPush = 18
const pointerEase = 0.16
const influenceEase = 0.08

const getCssVariable = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

export const ReactiveDotGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !container || !context) {
      return undefined
    }

    let animationFrame = 0
    let dots: Dot[] = []
    let width = 0
    let height = 0
    let baseColor = getCssVariable('--bg-base')
    let dotColor = getCssVariable('--bg-dot')
    let prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const pointer = { x: 0, y: 0, active: false }
    const easedPointer = { x: 0, y: 0, active: false }
    let pointerInfluence = 0

    const buildDots = () => {
      dots = []

      for (let y = dotSpacing / 2; y < height + dotSpacing; y += dotSpacing) {
        for (let x = dotSpacing / 2; x < width + dotSpacing; x += dotSpacing) {
          dots.push({ x, y })
        }
      }
    }

    const syncCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      const nextWidth = Math.ceil(rect.width)
      const nextHeight = Math.ceil(rect.height)
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

      width = nextWidth
      height = nextHeight
      canvas.width = Math.max(1, Math.floor(nextWidth * pixelRatio))
      canvas.height = Math.max(1, Math.floor(nextHeight * pixelRatio))
      canvas.style.width = `${nextWidth}px`
      canvas.style.height = `${nextHeight}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      buildDots()
      draw()
    }

    const draw = () => {
      context.globalAlpha = 1
      context.clearRect(0, 0, width, height)
      context.fillStyle = baseColor
      context.fillRect(0, 0, width, height)
      context.fillStyle = dotColor

      if (!prefersReducedMotion) {
        const targetInfluence = pointer.active ? 1 : 0

        easedPointer.x += (pointer.x - easedPointer.x) * pointerEase
        easedPointer.y += (pointer.y - easedPointer.y) * pointerEase
        pointerInfluence +=
          (targetInfluence - pointerInfluence) * influenceEase
        easedPointer.active = pointerInfluence > 0.01
      }

      dots.forEach(drawDot)
    }

    const render = () => {
      draw()

      if (!prefersReducedMotion) {
        animationFrame = window.requestAnimationFrame(render)
      }
    }

    const restartRendering = () => {
      window.cancelAnimationFrame(animationFrame)
      render()
    }

    const syncThemeColors = () => {
      baseColor = getCssVariable('--bg-base')
      dotColor = getCssVariable('--bg-dot')
      draw()
    }

    const drawDot = (dot: Dot) => {
      let drawX = dot.x
      let drawY = dot.y
      let radius = dotRadius

      if (!prefersReducedMotion && easedPointer.active) {
        const deltaX = dot.x - easedPointer.x
        const deltaY = dot.y - easedPointer.y
        const distance = Math.hypot(deltaX, deltaY)

        if (distance < pushRadius) {
          const safeDistance = Math.max(distance, 1)
          const falloff = 1 - distance / pushRadius
          const easedFalloff = falloff * falloff * (3 - 2 * falloff)
          const force = easedFalloff * maxPush * pointerInfluence

          drawX += (deltaX / safeDistance) * force
          drawY += (deltaY / safeDistance) * force
          radius += easedFalloff * 0.18 * pointerInfluence
        }
      }

      context.globalAlpha = 1
      context.beginPath()
      context.arc(drawX, drawY, radius, 0, Math.PI * 2)
      context.fill()
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      pointer.x = x
      pointer.y = y
      pointer.active = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height

      if (!easedPointer.active) {
        easedPointer.x = x
        easedPointer.y = y
      }
    }

    const handlePointerLeave = () => {
      pointer.active = false
      easedPointer.active = false
    }

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches
      restartRendering()
    }

    const resizeObserver = new ResizeObserver(syncCanvasSize)
    const themeObserver = new MutationObserver(syncThemeColors)
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )

    syncCanvasSize()
    syncThemeColors()
    restartRendering()

    resizeObserver.observe(container)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerleave', handlePointerLeave)
    motionPreference.addEventListener('change', handleMotionPreferenceChange)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      themeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      motionPreference.removeEventListener(
        'change',
        handleMotionPreferenceChange,
      )
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}

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
const pointerSettleThreshold = 0.1
const influenceSettleThreshold = 0.01

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

    let animationFrame: number | null = null
    let dots: Dot[] = []
    let width = 0
    let height = 0
    let needsDraw = false
    let baseColor = getCssVariable('--bg-base')
    let dotColor = getCssVariable('--bg-dot')
    let prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const pointer = { x: 0, y: 0, active: false }
    const easedPointer = { x: 0, y: 0, active: false }
    let pointerInfluence = 0

    const isDocumentVisible = () => document.visibilityState !== 'hidden'

    const buildDots = () => {
      dots = []

      for (let y = dotSpacing / 2; y < height + dotSpacing; y += dotSpacing) {
        for (let x = dotSpacing / 2; x < width + dotSpacing; x += dotSpacing) {
          dots.push({ x, y })
        }
      }
    }

    const draw = () => {
      context.globalAlpha = 1
      context.clearRect(0, 0, width, height)
      context.fillStyle = baseColor
      context.fillRect(0, 0, width, height)
      context.fillStyle = dotColor
      dots.forEach(drawDot)
    }

    const drawWhenVisible = () => {
      if (!isDocumentVisible()) {
        needsDraw = true
        return
      }

      needsDraw = false
      draw()
    }

    const settle = (
      current: number,
      target: number,
      ease: number,
      threshold: number,
    ) => {
      const next = current + (target - current) * ease
      return Math.abs(target - next) <= threshold ? target : next
    }

    const easePointerState = () => {
      const targetInfluence = pointer.active ? 1 : 0

      easedPointer.x = settle(
        easedPointer.x,
        pointer.x,
        pointerEase,
        pointerSettleThreshold,
      )
      easedPointer.y = settle(
        easedPointer.y,
        pointer.y,
        pointerEase,
        pointerSettleThreshold,
      )
      pointerInfluence = settle(
        pointerInfluence,
        targetInfluence,
        influenceEase,
        influenceSettleThreshold,
      )
      easedPointer.active = pointerInfluence > 0
    }

    const pointerStateIsSettled = () => {
      const targetInfluence = pointer.active ? 1 : 0

      return (
        Math.abs(pointer.x - easedPointer.x) <= pointerSettleThreshold &&
        Math.abs(pointer.y - easedPointer.y) <= pointerSettleThreshold &&
        Math.abs(targetInfluence - pointerInfluence) <= influenceSettleThreshold
      )
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

    const scheduleAnimation = () => {
      if (
        animationFrame !== null ||
        prefersReducedMotion ||
        !isDocumentVisible() ||
        pointerStateIsSettled()
      ) {
        return
      }

      animationFrame = window.requestAnimationFrame(render)
    }

    const render = () => {
      animationFrame = null

      if (!isDocumentVisible()) {
        needsDraw = true
        return
      }

      easePointerState()
      drawWhenVisible()
      scheduleAnimation()
    }

    const cancelAnimation = () => {
      if (animationFrame === null) {
        return
      }

      window.cancelAnimationFrame(animationFrame)
      animationFrame = null
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
      drawWhenVisible()
    }

    const syncThemeColors = () => {
      baseColor = getCssVariable('--bg-base')
      dotColor = getCssVariable('--bg-dot')
      drawWhenVisible()
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

      scheduleAnimation()
    }

    const handlePointerLeave = () => {
      pointer.active = false
      scheduleAnimation()
    }

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches

      if (prefersReducedMotion) {
        cancelAnimation()
        pointerInfluence = 0
        easedPointer.active = false
        drawWhenVisible()
        return
      }

      drawWhenVisible()
      scheduleAnimation()
    }

    const handleVisibilityChange = () => {
      if (!isDocumentVisible()) {
        cancelAnimation()
        return
      }

      if (!prefersReducedMotion && !pointerStateIsSettled()) {
        scheduleAnimation()
        return
      }

      if (needsDraw) {
        drawWhenVisible()
      }
    }

    const resizeObserver = new ResizeObserver(syncCanvasSize)
    const themeObserver = new MutationObserver(syncThemeColors)
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )

    syncCanvasSize()

    resizeObserver.observe(container)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerleave', handlePointerLeave)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    motionPreference.addEventListener('change', handleMotionPreferenceChange)

    return () => {
      cancelAnimation()
      resizeObserver.disconnect()
      themeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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

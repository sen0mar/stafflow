import { useEffect, useRef } from 'react'

interface Dot {
  x: number
  y: number
}

interface Ripple {
  age: number
  x: number
  y: number
}

const dotSpacing = 16
const dotRadius = 1
const pushRadius = 126
const maxPush = 18
const pointerEase = 0.16
const influenceEase = 0.08
const referenceFrameMs = 1000 / 60
const maxFrameDeltaMs = 50
const pointerSettleThreshold = 0.1
const influenceSettleThreshold = 0.01
const rippleDurationMs = 640
const rippleMaxRadius = 104
const rippleBandWidth = 22
const ripplePush = 2.4
const rippleDotGrowth = 0.12
const rippleTriggerDistance = 52
const maxRipples = 2

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
    let lastFrameTime: number | null = null
    let ripples: Ripple[] = []
    let baseColor = getCssVariable('--bg-base')
    let dotColor = getCssVariable('--bg-dot')
    let highlightColor = getCssVariable('--accent-primary-text')
    let prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const pointer = { x: 0, y: 0, active: false }
    const easedPointer = { x: 0, y: 0, active: false }
    const lastRippleOrigin = { x: 0, y: 0, active: false }
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
      baseEase: number,
      threshold: number,
      deltaMs: number,
    ) => {
      const ease = 1 - (1 - baseEase) ** (deltaMs / referenceFrameMs)
      const next = current + (target - current) * ease
      return Math.abs(target - next) <= threshold ? target : next
    }

    const easePointerState = (deltaMs: number) => {
      const targetInfluence = pointer.active ? 1 : 0

      easedPointer.x = settle(
        easedPointer.x,
        pointer.x,
        pointerEase,
        pointerSettleThreshold,
        deltaMs,
      )
      easedPointer.y = settle(
        easedPointer.y,
        pointer.y,
        pointerEase,
        pointerSettleThreshold,
        deltaMs,
      )
      pointerInfluence = settle(
        pointerInfluence,
        targetInfluence,
        influenceEase,
        influenceSettleThreshold,
        deltaMs,
      )
      easedPointer.active = pointerInfluence > 0
    }

    const updateRipples = (deltaMs: number) => {
      ripples = ripples
        .map((ripple) => ({ ...ripple, age: ripple.age + deltaMs }))
        .filter((ripple) => ripple.age < rippleDurationMs)
    }

    const addRipple = (x: number, y: number) => {
      ripples = [...ripples.slice(-(maxRipples - 1)), { x, y, age: 0 }]
      lastRippleOrigin.x = x
      lastRippleOrigin.y = y
      lastRippleOrigin.active = true
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
      let extraOpacity = 0
      let pointerHighlightOpacity = 0

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
          pointerHighlightOpacity = easedFalloff * 0.58 * pointerInfluence
        }
      }

      if (!prefersReducedMotion) {
        ripples.forEach((ripple) => {
          const progress = ripple.age / rippleDurationMs
          const rippleRadius = progress * rippleMaxRadius
          const deltaX = dot.x - ripple.x
          const deltaY = dot.y - ripple.y
          const distance = Math.hypot(deltaX, deltaY)
          const distanceFromBand = Math.abs(distance - rippleRadius)

          if (distanceFromBand >= rippleBandWidth) {
            return
          }

          const safeDistance = Math.max(distance, 1)
          const bandFalloff = 1 - distanceFromBand / rippleBandWidth
          const lifecycle = Math.sin(progress * Math.PI)
          const strength = bandFalloff * lifecycle

          drawX += (deltaX / safeDistance) * ripplePush * strength
          drawY += (deltaY / safeDistance) * ripplePush * strength
          radius += rippleDotGrowth * strength
          extraOpacity = Math.max(extraOpacity, 0.14 * strength)
        })
      }

      context.globalAlpha = 1
      context.beginPath()
      context.arc(drawX, drawY, radius, 0, Math.PI * 2)
      context.fill()

      if (extraOpacity > 0) {
        context.globalAlpha = extraOpacity
        context.beginPath()
        context.arc(drawX, drawY, radius, 0, Math.PI * 2)
        context.fill()
      }

      if (pointerHighlightOpacity > 0) {
        context.fillStyle = highlightColor
        context.globalAlpha = pointerHighlightOpacity
        context.beginPath()
        context.arc(drawX, drawY, radius + 0.14, 0, Math.PI * 2)
        context.fill()
        context.fillStyle = dotColor
      }
    }

    const scheduleAnimation = () => {
      if (
        animationFrame !== null ||
        prefersReducedMotion ||
        !isDocumentVisible() ||
        (pointerStateIsSettled() && ripples.length === 0)
      ) {
        if (pointerStateIsSettled() && ripples.length === 0) {
          lastFrameTime = null
        }
        return
      }

      animationFrame = window.requestAnimationFrame(render)
    }

    const render = (time: number) => {
      animationFrame = null

      if (!isDocumentVisible()) {
        needsDraw = true
        return
      }

      const deltaMs =
        lastFrameTime === null
          ? referenceFrameMs
          : Math.min(Math.max(time - lastFrameTime, 1), maxFrameDeltaMs)
      lastFrameTime = time

      easePointerState(deltaMs)
      updateRipples(deltaMs)
      drawWhenVisible()
      scheduleAnimation()
    }

    const cancelAnimation = () => {
      lastFrameTime = null

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
      highlightColor = getCssVariable('--accent-primary-text')
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

      if (
        pointer.active &&
        (!lastRippleOrigin.active ||
          Math.hypot(x - lastRippleOrigin.x, y - lastRippleOrigin.y) >=
            rippleTriggerDistance)
      ) {
        addRipple(x, y)
      }

      scheduleAnimation()
    }

    const handlePointerLeave = () => {
      pointer.active = false
      lastRippleOrigin.active = false
      scheduleAnimation()
    }

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches

      if (prefersReducedMotion) {
        cancelAnimation()
        pointerInfluence = 0
        easedPointer.active = false
        ripples = []
        lastRippleOrigin.active = false
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

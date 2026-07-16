import { act, fireEvent, render } from '@testing-library/react'

import { ReactiveDotGrid } from './reactive-dot-grid'

interface MockMediaQueryList extends MediaQueryList {
  setMatches: (matches: boolean) => void
}

interface RafHarness {
  cancel: ReturnType<typeof vi.fn>
  pendingCount: () => number
  request: ReturnType<typeof vi.fn>
  runNextFrame: (frameDurationMs?: number) => boolean
  runUntilIdle: (frameDurationMs?: number) => number
}

let resizeCallback: ResizeObserverCallback
let themeCallback: MutationCallback
let motionPreference: MockMediaQueryList
let visibilityState: DocumentVisibilityState
let containerWidth = 320
let containerHeight = 160
let currentFillStyle = ''
const fillStyleAssignments: string[] = []

const context = {
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  get fillStyle() {
    return currentFillStyle
  },
  set fillStyle(value: string) {
    currentFillStyle = value
    fillStyleAssignments.push(value)
  },
  globalAlpha: 1,
  setTransform: vi.fn(),
}

const createRafHarness = (): RafHarness => {
  let nextId = 1
  let elapsedMs = 0
  const callbacks = new Map<number, FrameRequestCallback>()
  const request = vi.fn((callback: FrameRequestCallback) => {
    const id = nextId
    nextId += 1
    callbacks.set(id, callback)
    return id
  })
  const cancel = vi.fn((id: number) => callbacks.delete(id))
  const runNextFrame = (frameDurationMs = 16.67) => {
    const entry = callbacks.entries().next().value as
      | [number, FrameRequestCallback]
      | undefined

    if (!entry) {
      return false
    }

    const [id, callback] = entry
    callbacks.delete(id)
    elapsedMs += frameDurationMs
    callback(elapsedMs)
    return true
  }

  return {
    cancel,
    pendingCount: () => callbacks.size,
    request,
    runNextFrame,
    runUntilIdle: (frameDurationMs = 16.67) => {
      let frames = 0

      while (callbacks.size > 0) {
        if (frames > 500) {
          throw new Error('Animation did not settle')
        }

        runNextFrame(frameDurationMs)
        frames += 1
      }

      return frames
    },
  }
}

const createMotionPreference = (): MockMediaQueryList => {
  let matches = false
  const listeners = new Set<(event: MediaQueryListEvent) => void>()

  return {
    addEventListener: (
      _type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      listeners.add(listener as (event: MediaQueryListEvent) => void)
    },
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    get matches() {
      return matches
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    removeEventListener: (
      _type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      listeners.delete(listener as (event: MediaQueryListEvent) => void)
    },
    removeListener: vi.fn(),
    setMatches: (nextMatches) => {
      matches = nextMatches
      listeners.forEach((listener) =>
        listener({ matches: nextMatches } as MediaQueryListEvent),
      )
    },
  }
}

const renderGrid = () => {
  const result = render(<ReactiveDotGrid />)
  const canvas = result.container.querySelector('canvas')
  const gridContainer = result.container.querySelector('div')

  if (!canvas || !gridContainer) {
    throw new Error('Reactive dot grid did not render')
  }

  vi.spyOn(canvas, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        bottom: containerHeight,
        height: containerHeight,
        left: 0,
        right: containerWidth,
        top: 0,
        width: containerWidth,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
  )

  return { ...result, canvas, gridContainer }
}

describe('ReactiveDotGrid', () => {
  let raf: RafHarness

  beforeEach(() => {
    vi.clearAllMocks()
    containerWidth = 320
    containerHeight = 160
    visibilityState = 'visible'
    currentFillStyle = ''
    fillStyleAssignments.length = 0
    motionPreference = createMotionPreference()
    raf = createRafHarness()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    })
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 2,
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    )
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => {
            if (name === '--bg-base') return '#0e0e0e'
            if (name === '--bg-dot') return 'rgba(217, 119, 38, 0.16)'
            if (name === '--accent-primary-text') return '#f0a05b'
            return ''
          },
        }) as CSSStyleDeclaration,
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          bottom: containerHeight,
          height: containerHeight,
          left: 0,
          right: containerWidth,
          top: 0,
          width: containerWidth,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    )
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback
        }
        disconnect = vi.fn()
        observe = vi.fn()
        unobserve = vi.fn()
      },
    )
    vi.stubGlobal(
      'MutationObserver',
      class {
        constructor(callback: MutationCallback) {
          themeCallback = callback
        }
        disconnect = vi.fn()
        observe = vi.fn()
        takeRecords = vi.fn(() => [])
      },
    )
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => motionPreference),
    )
    vi.stubGlobal('requestAnimationFrame', raf.request)
    vi.stubGlobal('cancelAnimationFrame', raf.cancel)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([
    { height: 900, label: 'desktop', dots: 5_187, width: 1440 },
    { height: 2160, label: '4K', dots: 32_776, width: 3840 },
  ])(
    'draws the $label grid once at high DPI without starting an idle RAF loop',
    ({ dots, height, width }) => {
      containerWidth = width
      containerHeight = height

      const { canvas } = renderGrid()

      expect(canvas.width).toBe(width * 2)
      expect(canvas.height).toBe(height * 2)
      expect(context.arc).toHaveBeenCalledTimes(dots)
      expect(raf.request).not.toHaveBeenCalled()
      expect(raf.pendingCount()).toBe(0)
    },
  )

  it('keeps at most one RAF pending and stops requesting frames after pointer easing settles', () => {
    renderGrid()
    context.arc.mockClear()

    fireEvent.pointerMove(window, { clientX: 80, clientY: 60 })
    fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })

    expect(raf.request).toHaveBeenCalledTimes(1)
    expect(raf.pendingCount()).toBe(1)

    let activeFrames = 0
    act(() => {
      activeFrames = raf.runUntilIdle()
    })
    const requestsAfterActiveSettle = raf.request.mock.calls.length

    expect(activeFrames).toBeGreaterThan(40)
    expect(activeFrames).toBeLessThan(70)
    expect(raf.pendingCount()).toBe(0)
    expect(context.arc).toHaveBeenCalled()

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(raf.request).toHaveBeenCalledTimes(requestsAfterActiveSettle)

    fireEvent.pointerLeave(window)
    expect(raf.pendingCount()).toBe(1)

    let leaveFrames = 0
    act(() => {
      leaveFrames = raf.runUntilIdle()
    })
    expect(leaveFrames).toBeGreaterThan(40)
    expect(leaveFrames).toBeLessThan(70)
    expect(raf.pendingCount()).toBe(0)
  })

  it('highlights nearby dots, renders a short-lived ripple, and returns to idle', () => {
    renderGrid()
    context.fill.mockClear()
    fillStyleAssignments.length = 0

    fireEvent.pointerMove(window, { clientX: 80, clientY: 60 })

    act(() => {
      raf.runNextFrame()
    })

    expect(context.fill.mock.calls.length).toBeGreaterThan(231)
    expect(fillStyleAssignments).toContain('#f0a05b')
    expect(raf.pendingCount()).toBe(1)

    let remainingFrames = 0
    act(() => {
      remainingFrames = raf.runUntilIdle()
    })

    expect(remainingFrames).toBeGreaterThan(0)
    expect(remainingFrames).toBeLessThan(70)
    expect(raf.pendingCount()).toBe(0)
  })

  it('uses elapsed time to preserve easing duration on high-refresh displays', () => {
    renderGrid()
    fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })

    let highRefreshFrames = 0
    act(() => {
      highRefreshFrames = raf.runUntilIdle(8.33)
    })

    expect(highRefreshFrames).toBeGreaterThan(80)
    expect(highRefreshFrames).toBeLessThan(140)
    expect(raf.pendingCount()).toBe(0)
  })

  it('cancels hidden work and resumes only an unsettled interaction', () => {
    renderGrid()
    fireEvent.pointerMove(window, { clientX: 100, clientY: 80 })
    expect(raf.pendingCount()).toBe(1)

    visibilityState = 'hidden'
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(raf.cancel).toHaveBeenCalledTimes(1)
    expect(raf.pendingCount()).toBe(0)

    visibilityState = 'visible'
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(raf.pendingCount()).toBe(1)

    act(() => {
      raf.runUntilIdle()
    })
    const requestsAfterSettle = raf.request.mock.calls.length

    visibilityState = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    visibilityState = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))

    expect(raf.pendingCount()).toBe(0)
    expect(raf.request).toHaveBeenCalledTimes(requestsAfterSettle)
  })

  it('redraws for resize, theme, and reduced-motion changes without duplicate RAFs', () => {
    const { canvas } = renderGrid()
    context.clearRect.mockClear()

    containerWidth = 640
    containerHeight = 320
    act(() => {
      resizeCallback([], {} as ResizeObserver)
    })
    expect(canvas.width).toBe(1280)
    expect(canvas.height).toBe(640)
    expect(context.clearRect).toHaveBeenCalledTimes(1)
    expect(raf.pendingCount()).toBe(0)

    act(() => {
      themeCallback([], {} as MutationObserver)
    })
    expect(context.clearRect).toHaveBeenCalledTimes(2)
    expect(raf.pendingCount()).toBe(0)

    fireEvent.pointerMove(window, { clientX: 100, clientY: 80 })
    expect(raf.pendingCount()).toBe(1)

    act(() => {
      motionPreference.setMatches(true)
    })
    expect(raf.pendingCount()).toBe(0)
    expect(context.clearRect).toHaveBeenCalledTimes(3)

    act(() => {
      motionPreference.setMatches(false)
    })
    expect(context.clearRect).toHaveBeenCalledTimes(4)
    expect(raf.pendingCount()).toBe(1)
  })

  it('cancels the single pending frame on unmount', () => {
    const { unmount } = renderGrid()
    fireEvent.pointerMove(window, { clientX: 100, clientY: 80 })

    unmount()

    expect(raf.cancel).toHaveBeenCalledTimes(1)
    expect(raf.pendingCount()).toBe(0)
  })
})

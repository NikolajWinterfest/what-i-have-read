import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const STORAGE_KEY = 'scroll-positions'
const BOOK_PATH_PREFIX = '/book/'
const RESTORE_TIMEOUT_MS = 2500

type ScrollMap = Record<string, number>

const readPositions = (): ScrollMap => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as ScrollMap
    }
  } catch {
    return {}
  }
  return {}
}

const writePositions = (positions: ScrollMap) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
}

const ScrollPositionManager = () => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previousPathRef = useRef(location.pathname)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const savePosition = () => {
      const positions = readPositions()
      positions[location.pathname] = lastScrollYRef.current
      writePositions(positions)
    }

    const handleScroll = () => {
      lastScrollYRef.current = window.scrollY
      savePosition()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastScrollYRef.current = window.scrollY
        savePosition()
      }
    }

    lastScrollYRef.current = window.scrollY
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', savePosition)
    window.addEventListener('pagehide', savePosition)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', savePosition)
      window.removeEventListener('pagehide', savePosition)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [location.pathname])

  useLayoutEffect(() => {
    const previousPath = previousPathRef.current
    const isBookPage = location.pathname.startsWith(BOOK_PATH_PREFIX)
    const cameFromBookPage = previousPath.startsWith(BOOK_PATH_PREFIX)
    const positions = readPositions()
    const savedPosition = positions[location.pathname] ?? 0
    const shouldRestoreSavedPosition =
      !isBookPage || navigationType === 'POP' || cameFromBookPage

    if (!shouldRestoreSavedPosition) {
      window.scrollTo(0, 0)
      previousPathRef.current = location.pathname
      return
    }

    const maxScrollableY = () =>
      Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)
    const applyRestore = () => {
      const nextY = Math.min(savedPosition, maxScrollableY())
      window.scrollTo(0, nextY)
      previousPathRef.current = location.pathname
    }

    if (maxScrollableY() >= savedPosition) {
      applyRestore()
      return
    }

    const startedAt = performance.now()
    let rafId = 0
    const waitUntilReachable = () => {
      if (maxScrollableY() >= savedPosition) {
        applyRestore()
        return
      }

      if (performance.now() - startedAt >= RESTORE_TIMEOUT_MS) {
        applyRestore()
        return
      }

      rafId = window.requestAnimationFrame(waitUntilReachable)
    }

    rafId = window.requestAnimationFrame(waitUntilReachable)
    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [location.pathname, navigationType])

  return null
}

export default ScrollPositionManager

import { useEffect, useState } from 'react'
import { IoArrowUp } from 'react-icons/io5'

const SHOW_AFTER_Y = 220

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > SHOW_AFTER_Y)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      className={`scroll-top-button${isVisible ? ' scroll-top-button--visible' : ''}`}
      type="button"
      onClick={handleClick}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <IoArrowUp size={22} />
    </button>
  )
}

export default ScrollToTopButton

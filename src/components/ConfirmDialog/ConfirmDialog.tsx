import { useEffect, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

const CLOSE_ANIMATION_MS = 220

type ConfirmDialogProps = {
  isOpen: boolean
  title: string
  message: string
  onCancel: () => void
  onConfirm: () => void
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  const [isShaking, setIsShaking] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)

  const handleOverlayClick = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 420)
  }

  useEffect(() => {
    if (isOpen) {
      const openTimeoutId = window.setTimeout(() => {
        setShouldRender(true)
        setIsClosing(false)
      }, 0)

      return () => {
        window.clearTimeout(openTimeoutId)
      }
    }

    if (!shouldRender) {
      return
    }

    const closeStartTimeoutId = window.setTimeout(() => {
      setIsClosing(true)
    }, 0)
    const timeoutId = window.setTimeout(() => {
      setShouldRender(false)
      setIsClosing(false)
    }, CLOSE_ANIMATION_MS)

    return () => {
      window.clearTimeout(closeStartTimeoutId)
      window.clearTimeout(timeoutId)
    }
  }, [isOpen, shouldRender])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onCancel])

  useBodyScrollLock(isOpen || shouldRender)

  if (!isOpen && !shouldRender) {
    return null
  }

  return (
    <div
      className={`confirm-overlay${isClosing ? ' confirm-overlay--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={handleOverlayClick}
    >
      <div
        className={`confirm-dialog${isShaking ? ' confirm-dialog--shake' : ''}${isClosing ? ' confirm-dialog--closing' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          type="button"
          onClick={onCancel}
          aria-label="Close dialog"
        >
          <IoClose size={24} />
        </button>
        <h3 id="confirm-title" className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__message">{message}</p>
        <div className="modal-actions confirm-dialog__actions">
          <button className="button button--danger" type="button" onClick={onConfirm}>
            Delete
          </button>
          <button className="button button--secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

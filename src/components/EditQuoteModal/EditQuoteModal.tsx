import { IoClose } from 'react-icons/io5'

type EditQuoteModalProps = {
  isOpen: boolean
  isClosing: boolean
  isShaking: boolean
  value: string
  canSave: boolean
  onOverlayClick: () => void
  onChange: (value: string) => void
  onSave: () => void
  onClose: () => void
}

const EditQuoteModal = ({
  isOpen,
  isClosing,
  isShaking,
  value,
  canSave,
  onOverlayClick,
  onChange,
  onSave,
  onClose,
}: EditQuoteModalProps) => {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className={`quote-edit-modal-overlay${isClosing ? ' quote-edit-modal-overlay--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-edit-title"
      onClick={onOverlayClick}
    >
      <section
        className={`quote-edit-modal${isShaking ? ' quote-edit-modal--shake' : ''}${isClosing ? ' quote-edit-modal--closing' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close quote edit modal"
        >
          <IoClose size={24} />
        </button>
        <h3 id="quote-edit-title" className="quote-edit-modal__title">
          Edit quote
        </h3>
        <label className="book-form__field quote-edit-modal__field">
          <span>Quote text</span>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={10}
            autoFocus
          />
        </label>
        <div className="modal-actions quote-edit-modal__actions">
          <button className="button" type="button" onClick={onSave} disabled={!canSave}>
            Save
          </button>
          <button className="button button--secondary" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  )
}

export default EditQuoteModal

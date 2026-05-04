import type { ChangeEvent } from 'react'
import { IoClose } from 'react-icons/io5'

type EditBookModalProps = {
  isOpen: boolean
  isClosing: boolean
  isShaking: boolean
  draftBookName: string
  draftAuthor: string
  draftTranslator: string
  draftDescription: string
  draftReview: string
  draftImagePreview: string
  isRemoveImageDisabled: boolean
  onOverlayClick: () => void
  onClose: () => void
  onSave: () => void
  onChangeBookName: (value: string) => void
  onChangeAuthor: (value: string) => void
  onChangeTranslator: (value: string) => void
  onChangeDescription: (value: string) => void
  onChangeReview: (value: string) => void
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
}

const EditBookModal = ({
  isOpen,
  isClosing,
  isShaking,
  draftBookName,
  draftAuthor,
  draftTranslator,
  draftDescription,
  draftReview,
  draftImagePreview,
  isRemoveImageDisabled,
  onOverlayClick,
  onClose,
  onSave,
  onChangeBookName,
  onChangeAuthor,
  onChangeTranslator,
  onChangeDescription,
  onChangeReview,
  onImageUpload,
  onRemoveImage,
}: EditBookModalProps) => {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className={`edit-modal-overlay${isClosing ? ' edit-modal-overlay--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      onClick={onOverlayClick}
    >
      <section
        className={`edit-modal${isShaking ? ' edit-modal--shake' : ''}${isClosing ? ' edit-modal--closing' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close edit modal"
        >
          <IoClose size={24} />
        </button>
        <h2 className="panel__title edit-modal__title">Edit Book Data</h2>
        <div className="edit-modal__body">
          <div className="edit-book-modal__layout">
            <div className="edit-book-modal__media">
              {draftImagePreview ? (
                <img
                  className="edit-book-modal__preview"
                  src={draftImagePreview}
                  alt={`${draftBookName} cover`}
                />
              ) : (
                <div className="edit-book-modal__placeholder">No image</div>
              )}
              <input type="file" accept="image/*" onChange={onImageUpload} />
              <button
                className="button button--secondary"
                type="button"
                onClick={onRemoveImage}
                disabled={isRemoveImageDisabled}
              >
                Remove image
              </button>
            </div>
            <div className="book-card__edit-grid edit-full-modal__fields">
              <label className="edit-field">
                <span>Book title</span>
                <input value={draftBookName} onChange={(event) => onChangeBookName(event.target.value)} />
              </label>
              <label className="edit-field">
                <span>Author</span>
                <input value={draftAuthor} onChange={(event) => onChangeAuthor(event.target.value)} />
              </label>
              <label className="edit-field">
                <span>Translator (optional)</span>
                <input value={draftTranslator} onChange={(event) => onChangeTranslator(event.target.value)} />
              </label>
              <label className="edit-field edit-field--description">
                <span>Short description</span>
                <textarea
                  className="book-page__description-input"
                  rows={4}
                  value={draftDescription}
                  onChange={(event) => onChangeDescription(event.target.value)}
                />
              </label>
              <label className="edit-field edit-field--review">
                <span>Full review</span>
                <textarea
                  className="book-page__review-input"
                  rows={6}
                  value={draftReview}
                  onChange={(event) => onChangeReview(event.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="modal-actions edit-modal__actions-fixed">
          <button className="button" type="button" onClick={onSave}>
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

export default EditBookModal

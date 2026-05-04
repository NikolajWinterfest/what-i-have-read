import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Book } from '../../../types/book'
import { patchBook, removeBook, setBookFavorite } from '../../../api/booksApi'
import ConfirmDialog from '../../ConfirmDialog/ConfirmDialog'
import EditBookModal from '../../EditBookModal/EditBookModal'
import FavoriteButton from '../../FavoriteButton/FavoriteButton'
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock'
import { deleteBook, replaceBook, setError } from '../../../store/booksSlice'
import { useAppDispatch } from '../../../store/hooks'

type BookItemProps = {
  book: Book
}

const BookItem = ({ book }: BookItemProps) => {
  const EDIT_MODAL_CLOSE_MS = 220
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [isEditing, setIsEditing] = useState(false)
  const [draftBookName, setDraftBookName] = useState(book.bookName)
  const [draftAuthor, setDraftAuthor] = useState(book.author)
  const [draftTranslator, setDraftTranslator] = useState(book.translator ?? '')
  const [draftDescription, setDraftDescription] = useState(book.description)
  const [draftReview, setDraftReview] = useState(book.review)
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null)
  const [draftImagePreview, setDraftImagePreview] = useState(book.image)
  const [isImageMarkedForRemoval, setIsImageMarkedForRemoval] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditModalShaking, setIsEditModalShaking] = useState(false)
  const [isEditModalClosing, setIsEditModalClosing] = useState(false)

  const resetEditDraft = useCallback(() => {
    setDraftBookName(book.bookName)
    setDraftAuthor(book.author)
    setDraftTranslator(book.translator ?? '')
    setDraftDescription(book.description)
    setDraftReview(book.review)
    setDraftImageFile(null)
    setDraftImagePreview(book.image)
    setIsImageMarkedForRemoval(false)
  }, [book.author, book.bookName, book.description, book.image, book.review, book.translator])

  const preview =
    book.description.length > 120
      ? `${book.description.slice(0, 117)}...`
      : book.description

  const handleStartEdit = () => {
    resetEditDraft()
    setIsEditModalClosing(false)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (isEditModalClosing) {
      return
    }
    setIsEditModalClosing(true)
    window.setTimeout(() => {
      resetEditDraft()
      setIsEditing(false)
      setIsEditModalClosing(false)
    }, EDIT_MODAL_CLOSE_MS)
  }

  const handleEditBackdropClick = () => {
    setIsEditModalShaking(true)
    setTimeout(() => setIsEditModalShaking(false), 420)
  }

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setDraftImageFile(file)
    setIsImageMarkedForRemoval(false)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraftImagePreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setDraftImageFile(null)
    setDraftImagePreview('')
    setIsImageMarkedForRemoval(true)
  }

  const handleSaveEdit = async () => {
    const nextBookName = draftBookName.trim()
    const nextAuthor = draftAuthor.trim()
    const nextTranslator = draftTranslator.trim()
    const nextDescription = draftDescription.trim()
    const nextReview = draftReview.trim()

    if (!nextBookName || !nextAuthor || !nextDescription || !nextReview) {
      return
    }

    try {
      const updatedBook = await patchBook(book.id, {
        bookName: nextBookName,
        author: nextAuthor,
        translator: nextTranslator,
        description: nextDescription,
        review: nextReview,
        imageFile: draftImageFile,
        removeImage: isImageMarkedForRemoval,
      })
      dispatch(replaceBook(updatedBook))
      dispatch(setError(null))
      setIsEditModalClosing(true)
      window.setTimeout(() => {
        setIsEditing(false)
        setIsEditModalClosing(false)
      }, EDIT_MODAL_CLOSE_MS)
    } catch {
      dispatch(setError('Failed to update book in JSON file.'))
    }
  }

  const handleDelete = async () => {
    try {
      await removeBook(book.id)
      dispatch(deleteBook(book.id))
      dispatch(setError(null))
      setIsDeleteDialogOpen(false)
    } catch {
      dispatch(setError('Failed to delete book from JSON file.'))
    }
  }

  const handleToggleFavorite = async () => {
    try {
      const updatedBook = await setBookFavorite(book.id, !book.isFavorite)
      dispatch(replaceBook(updatedBook))
      dispatch(setError(null))
    } catch {
      dispatch(setError('Failed to update favorite status.'))
    }
  }

  useEffect(() => {
    if (!isEditing) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isEditModalClosing) {
          return
        }
        setIsEditModalClosing(true)
        window.setTimeout(() => {
          resetEditDraft()
          setIsEditing(false)
          setIsEditModalClosing(false)
        }, EDIT_MODAL_CLOSE_MS)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [EDIT_MODAL_CLOSE_MS, isEditModalClosing, isEditing, resetEditDraft])
  useBodyScrollLock(isEditing)

  return (
    <li className="books__item">
      <article className="book-card">
        <FavoriteButton isFavorite={book.isFavorite} onClick={handleToggleFavorite} />

        <div className="book-card__layout">
          {book.image ? (
            <img className="book-card__image" src={book.image} alt={`${book.bookName} cover`} />
          ) : (
            <div className="book-image-placeholder book-card__image-placeholder">No image</div>
          )}
          <div className="book-card__content">
            <div className="book-card__text">
              <h2 className="book-card__title">{book.bookName}</h2>
              <p className="book-card__author">{book.author}</p>
              {book.translator ? <p className="book-card__meta">Translated by: {book.translator}</p> : null}
              <p className="book-card__description">{preview}</p>
            </div>

            <div className="book-card-actions">
              <button
                className="button button--secondary"
                type="button"
                onClick={() =>
                  navigate(`/book/${encodeURIComponent(String(book.id))}`, {
                    state: {
                      fromPath: location.pathname,
                      fromScrollY: window.scrollY,
                    },
                  })
                }
              >
                Show
              </button>
              <button className="button button--secondary" type="button" onClick={handleStartEdit}>
                Edit
              </button>
              <button
                className="button button--danger"
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="Delete book?"
          message={`Are you sure you want to delete "${book.bookName}"?`}
          onCancel={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
        />

        <EditBookModal
          isOpen={isEditing}
          isClosing={isEditModalClosing}
          isShaking={isEditModalShaking}
          draftBookName={draftBookName}
          draftAuthor={draftAuthor}
          draftTranslator={draftTranslator}
          draftDescription={draftDescription}
          draftReview={draftReview}
          draftImagePreview={draftImagePreview}
          isRemoveImageDisabled={!draftImagePreview && (isImageMarkedForRemoval || !book.image)}
          onOverlayClick={handleEditBackdropClick}
          onClose={handleCancelEdit}
          onSave={handleSaveEdit}
          onChangeBookName={setDraftBookName}
          onChangeAuthor={setDraftAuthor}
          onChangeTranslator={setDraftTranslator}
          onChangeDescription={setDraftDescription}
          onChangeReview={setDraftReview}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
        />
      </article>
    </li>
  )
}

export default BookItem

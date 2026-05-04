import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { IoArrowBack } from 'react-icons/io5'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  createQuote,
  patchBook,
  patchQuote,
  removeQuote,
  setBookFavorite,
} from '../api/booksApi'
import ConfirmDialog from '../components/ConfirmDialog/ConfirmDialog'
import EditBookModal from '../components/EditBookModal/EditBookModal'
import EditQuoteModal from '../components/EditQuoteModal/EditQuoteModal'
import FavoriteButton from '../components/FavoriteButton/FavoriteButton'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { replaceBook, setError } from '../store/booksSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

const BookPage = () => {
  const SCROLL_POSITIONS_KEY = 'scroll-positions'
  const EDIT_MODAL_CLOSE_MS = 220
  const QUOTE_MODAL_CLOSE_MS = 220
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { bookId } = useParams()
  const books = useAppSelector((state) => state.books.books)
  const decodedBookId =
    typeof bookId === 'string' ? decodeURIComponent(bookId) : ''
  const book = books.find((item) => String(item.id) === decodedBookId)

  const [isEditingBook, setIsEditingBook] = useState(false)
  const [editingQuoteIndex, setEditingQuoteIndex] = useState<number | null>(
    null,
  )
  const [quoteText, setQuoteText] = useState('')
  const [draftBookName, setDraftBookName] = useState('')
  const [draftAuthor, setDraftAuthor] = useState('')
  const [draftTranslator, setDraftTranslator] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftReview, setDraftReview] = useState('')
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null)
  const [draftImagePreview, setDraftImagePreview] = useState('')
  const [isImageMarkedForRemoval, setIsImageMarkedForRemoval] = useState(false)
  const [draftQuoteText, setDraftQuoteText] = useState('')
  const [pendingDeleteQuoteIndex, setPendingDeleteQuoteIndex] = useState<
    number | null
  >(null)
  const [isEditModalShaking, setIsEditModalShaking] = useState(false)
  const [isEditModalClosing, setIsEditModalClosing] = useState(false)
  const [isQuoteModalShaking, setIsQuoteModalShaking] = useState(false)
  const [isQuoteModalClosing, setIsQuoteModalClosing] = useState(false)
  const [shouldScrollToNewQuote, setShouldScrollToNewQuote] = useState(false)
  const lastQuoteRef = useRef<HTMLLIElement | null>(null)
  const fromPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'fromPath' in location.state &&
    typeof (location.state as { fromPath?: unknown }).fromPath === 'string'
      ? (location.state as { fromPath: string }).fromPath
      : '/'
  const fromScrollY =
    typeof location.state === 'object' &&
    location.state !== null &&
    'fromScrollY' in location.state &&
    typeof (location.state as { fromScrollY?: unknown }).fromScrollY ===
      'number'
      ? (location.state as { fromScrollY: number }).fromScrollY
      : 0

  useEffect(() => {
    if (!isEditingBook) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isEditModalClosing) {
          return
        }
        setIsEditModalClosing(true)
        window.setTimeout(() => {
          setIsEditingBook(false)
          setIsEditModalClosing(false)
          setDraftBookName('')
          setDraftAuthor('')
          setDraftTranslator('')
          setDraftDescription('')
          setDraftReview('')
          setDraftImageFile(null)
          setDraftImagePreview('')
          setIsImageMarkedForRemoval(false)
        }, EDIT_MODAL_CLOSE_MS)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [EDIT_MODAL_CLOSE_MS, isEditModalClosing, isEditingBook])
  useBodyScrollLock(
    isEditingBook || editingQuoteIndex !== null || isQuoteModalClosing,
  )

  useEffect(() => {
    if (!shouldScrollToNewQuote || !book || book.quotes.length === 0) {
      return
    }

    requestAnimationFrame(() => {
      if (!lastQuoteRef.current) {
        setShouldScrollToNewQuote(false)
        return
      }
      requestAnimationFrame(() => {
        lastQuoteRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
      setShouldScrollToNewQuote(false)
    })
  }, [book, shouldScrollToNewQuote])

  const handleAddQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const updatedBook = await createQuote(book!.id, quoteText)
      dispatch(replaceBook(updatedBook))
      dispatch(setError(null))
      setQuoteText('')
      setShouldScrollToNewQuote(true)
    } catch {
      dispatch(setError('Failed to add quote to JSON file.'))
    }
  }

  const handleStartBookEdit = () => {
    setDraftBookName(book!.bookName)
    setDraftAuthor(book!.author)
    setDraftTranslator(book!.translator ?? '')
    setDraftDescription(book!.description)
    setDraftReview(book!.review)
    setDraftImageFile(null)
    setDraftImagePreview(book!.image)
    setIsImageMarkedForRemoval(false)
    setIsEditModalClosing(false)
    setIsEditingBook(true)
  }

  const handleCancelBookEdit = () => {
    if (isEditModalClosing) {
      return
    }
    setIsEditModalClosing(true)
    window.setTimeout(() => {
      setIsEditingBook(false)
      setIsEditModalClosing(false)
      setDraftBookName('')
      setDraftAuthor('')
      setDraftTranslator('')
      setDraftDescription('')
      setDraftReview('')
      setDraftImageFile(null)
      setDraftImagePreview('')
      setIsImageMarkedForRemoval(false)
    }, EDIT_MODAL_CLOSE_MS)
  }

  const handleBackdropClick = () => {
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

  const handleSaveBookEdit = async () => {
    const nextBookName = draftBookName.trim()
    const nextAuthor = draftAuthor.trim()
    const nextTranslator = draftTranslator.trim()
    const nextDescription = draftDescription.trim()
    const nextReview = draftReview.trim()

    if (!nextBookName || !nextAuthor || !nextDescription || !nextReview) {
      return
    }

    try {
      const updatedBook = await patchBook(book!.id, {
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
      handleCancelBookEdit()
    } catch {
      dispatch(setError('Failed to update book in JSON file.'))
    }
  }

  const handleStartQuoteEdit = (index: number, currentQuote: string) => {
    setIsQuoteModalClosing(false)
    setEditingQuoteIndex(index)
    setDraftQuoteText(currentQuote)
  }

  const handleCancelQuoteEdit = useCallback(() => {
    if (isQuoteModalClosing) {
      return
    }
    setIsQuoteModalClosing(true)
    window.setTimeout(() => {
      setEditingQuoteIndex(null)
      setDraftQuoteText('')
      setIsQuoteModalClosing(false)
    }, QUOTE_MODAL_CLOSE_MS)
  }, [QUOTE_MODAL_CLOSE_MS, isQuoteModalClosing])

  const handleQuoteModalBackdropClick = () => {
    setIsQuoteModalShaking(true)
    setTimeout(() => setIsQuoteModalShaking(false), 420)
  }

  useEffect(() => {
    if (editingQuoteIndex === null) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancelQuoteEdit()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [editingQuoteIndex, handleCancelQuoteEdit])

  const handleSaveQuoteEdit = async () => {
    if (editingQuoteIndex === null) {
      return
    }

    const hasVisibleContent = /\S/.test(draftQuoteText)
    if (!hasVisibleContent) {
      return
    }

    try {
      const updatedBook = await patchQuote(
        book!.id,
        editingQuoteIndex,
        draftQuoteText,
      )
      dispatch(replaceBook(updatedBook))
      dispatch(setError(null))
      handleCancelQuoteEdit()
    } catch {
      dispatch(setError('Failed to update quote in JSON file.'))
    }
  }

  const handleDeleteQuote = async (index: number) => {
    try {
      const updatedBook = await removeQuote(book!.id, index)
      dispatch(replaceBook(updatedBook))
      dispatch(setError(null))
      setPendingDeleteQuoteIndex(null)
      if (editingQuoteIndex === index) {
        setEditingQuoteIndex(null)
        setDraftQuoteText('')
      }
    } catch {
      dispatch(setError('Failed to delete quote from JSON file.'))
    }
  }

  const handleToggleFavorite = async () => {
    try {
      const updatedBook = await setBookFavorite(book!.id, !book!.isFavorite)
      dispatch(replaceBook(updatedBook))
      dispatch(setError(null))
    } catch {
      dispatch(setError('Failed to update favorite status.'))
    }
  }

  const handleBackToList = useCallback(() => {
    const saveReturnScroll = () => {
      try {
        const raw = sessionStorage.getItem(SCROLL_POSITIONS_KEY)
        const positions =
          raw && typeof JSON.parse(raw) === 'object'
            ? (JSON.parse(raw) as Record<string, number>)
            : {}
        positions[fromPath] = fromScrollY
        sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions))
      } catch {
        // Ignore storage issues.
      }
    }

    const isInternalReferrer = document.referrer.startsWith(
      window.location.origin,
    )
    if (window.history.length > 1 && isInternalReferrer) {
      navigate(-1)
      return
    }
    saveReturnScroll()
    navigate(fromPath || '/')
  }, [SCROLL_POSITIONS_KEY, fromPath, fromScrollY, navigate])

  useEffect(() => {
    const handleBackspace = (event: KeyboardEvent) => {
      if (event.key !== 'Backspace') {
        return
      }

      const target = event.target as HTMLElement | null
      const tagName = target?.tagName.toLowerCase()
      const isEditableTarget =
        target?.isContentEditable ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select'

      if (isEditableTarget) {
        return
      }

      event.preventDefault()
      handleBackToList()
    }

    window.addEventListener('keydown', handleBackspace)
    return () => {
      window.removeEventListener('keydown', handleBackspace)
    }
  }, [handleBackToList])

  if (!book) {
    return (
      <main className="main">
        <section className="panel">
          <h1>Book not found</h1>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => navigate('/')}
          >
            Back to list
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="main book-page-main">
      <button
        className="book-page__back-button"
        type="button"
        onClick={handleBackToList}
        aria-label="Go back"
      >
        <IoArrowBack size={18} />
      </button>

      <section className="panel">
        <div className="panel__header panel__header--book">
          <FavoriteButton
            isFavorite={book.isFavorite}
            onClick={handleToggleFavorite}
          />
        </div>

        <div className="book-page__hero">
          {book.image ? (
            <img
              className="book-page__cover"
              src={book.image}
              alt={`${book.bookName} cover`}
            />
          ) : (
            <div className="book-image-placeholder book-page__cover book-page__cover-placeholder">
              No image
            </div>
          )}
          <div className="book-page__content">
            <h1 className="book-page__title">{book.bookName}</h1>
            <p className="book-card__author">{book.author}</p>
            {book.translator ? (
              <p className="book-card__meta">
                Translated by: {book.translator}
              </p>
            ) : null}
            <h2 className="panel__title">Short review</h2>
            <p className="book-page__description">{book.description}</p>
            <h2 className="panel__title">Full review</h2>
            <p className="book-page__review">{book.review}</p>
            <button
              className="button button--secondary book-page__edit-btn"
              type="button"
              onClick={handleStartBookEdit}
            >
              Edit book data
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Quotes</h2>
        <form className="quote-form" onSubmit={handleAddQuote}>
          <label className="book-form__field">
            <span>New quote</span>
            <textarea
              value={quoteText}
              onChange={(event) => setQuoteText(event.target.value)}
              rows={3}
              required
            />
          </label>
          <button className="button" type="submit">
            Add quote
          </button>
        </form>

        {book.quotes.length === 0 ? (
          <p className="panel__empty">No quotes yet for this book.</p>
        ) : (
          <ul className="quotes-list">
            {book.quotes.map((quote, index) => (
              <li
                className="quotes-list__item"
                key={`${book.id}-${index}`}
                ref={index === book.quotes.length - 1 ? lastQuoteRef : null}
              >
                <p className="quotes-list__text">{quote}</p>
                <div className="quote-actions">
                  <button
                    className="button button--secondary quotes-list__edit-btn"
                    type="button"
                    onClick={() => handleStartQuoteEdit(index, quote)}
                  >
                    Edit
                  </button>
                  <button
                    className="button button--danger quotes-list__edit-btn"
                    type="button"
                    onClick={() => setPendingDeleteQuoteIndex(index)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        isOpen={pendingDeleteQuoteIndex !== null}
        title="Delete quote?"
        message="Are you sure you want to delete this quote?"
        onCancel={() => setPendingDeleteQuoteIndex(null)}
        onConfirm={() => {
          if (pendingDeleteQuoteIndex !== null) {
            void handleDeleteQuote(pendingDeleteQuoteIndex)
          }
        }}
      />

      <EditQuoteModal
        isOpen={editingQuoteIndex !== null}
        isClosing={isQuoteModalClosing}
        isShaking={isQuoteModalShaking}
        value={draftQuoteText}
        canSave={/\S/.test(draftQuoteText)}
        onOverlayClick={handleQuoteModalBackdropClick}
        onChange={setDraftQuoteText}
        onSave={handleSaveQuoteEdit}
        onClose={handleCancelQuoteEdit}
      />

      <EditBookModal
        isOpen={isEditingBook}
        isClosing={isEditModalClosing}
        isShaking={isEditModalShaking}
        draftBookName={draftBookName}
        draftAuthor={draftAuthor}
        draftTranslator={draftTranslator}
        draftDescription={draftDescription}
        draftReview={draftReview}
        draftImagePreview={draftImagePreview}
        isRemoveImageDisabled={
          !draftImagePreview && (isImageMarkedForRemoval || !book.image)
        }
        onOverlayClick={handleBackdropClick}
        onClose={handleCancelBookEdit}
        onSave={handleSaveBookEdit}
        onChangeBookName={setDraftBookName}
        onChangeAuthor={setDraftAuthor}
        onChangeTranslator={setDraftTranslator}
        onChangeDescription={setDraftDescription}
        onChangeReview={setDraftReview}
        onImageUpload={handleImageUpload}
        onRemoveImage={handleRemoveImage}
      />
    </main>
  )
}

export default BookPage

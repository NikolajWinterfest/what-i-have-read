import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import BooksList from '../components/BooksList/BooksList'
import { createBook } from '../api/booksApi'
import { addBook, setError } from '../store/booksSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

const HomePage = () => {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((state) => state.books)
  const [bookName, setBookName] = useState('')
  const [author, setAuthor] = useState('')
  const [translator, setTranslator] = useState('')
  const [description, setDescription] = useState('')
  const [review, setReview] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    setImageFile(file)
  }

  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ''),
    [imageFile],
  )

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      !bookName.trim() ||
      !author.trim() ||
      !description.trim() ||
      !review.trim()
    ) {
      return
    }

    try {
      const createdBook = await createBook({
        bookName: bookName.trim(),
        author: author.trim(),
        translator: translator.trim(),
        description: description.trim(),
        review: review.trim(),
        imageFile,
      })
      dispatch(addBook(createdBook))
      dispatch(setError(null))

      setBookName('')
      setAuthor('')
      setTranslator('')
      setDescription('')
      setReview('')
      setImageFile(null)
    } catch {
      dispatch(setError('Failed to save book to JSON file.'))
    }
  }

  return (
    <main className="main">
      <h1 style={{ textAlign: 'center' }}>Books I Have Read</h1>
      {isLoading ? (
        <p className="panel__empty">Loading books from JSON...</p>
      ) : null}
      {error ? <p className="panel__error">{error}</p> : null}
      <section className="panel">
        <h2 className="panel__title">Add New Book</h2>
        <form className="book-form" onSubmit={handleSubmit}>
          <label className="book-form__field">
            <span>Book title</span>
            <input
              value={bookName}
              onChange={(event) => setBookName(event.target.value)}
              required
            />
          </label>
          <label className="book-form__field">
            <span>Author</span>
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              required
            />
          </label>
          <label className="book-form__field">
            <span>Translator (optional)</span>
            <input
              value={translator}
              onChange={(event) => setTranslator(event.target.value)}
            />
          </label>
          <label className="book-form__field">
            <span>Short description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              required
            />
          </label>
          <label className="book-form__field">
            <span>Full review</span>
            <textarea
              value={review}
              onChange={(event) => setReview(event.target.value)}
              rows={4}
              required
            />
          </label>
          <label className="book-form__field">
            <span>Cover image file</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
          {previewUrl ? (
            <img
              className="book-image-preview"
              src={previewUrl}
              alt="New book cover preview"
            />
          ) : (
            <div className="book-image-placeholder book-image-preview">
              No image
            </div>
          )}
          <button className="button" type="submit">
            Add book
          </button>
        </form>
      </section>
      <BooksList />
    </main>
  )
}

export default HomePage

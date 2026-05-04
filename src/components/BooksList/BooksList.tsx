import { useMemo, useState } from 'react'
import BookItem from './BookItem/BookItem'
import { useAppSelector } from '../../store/hooks'

const BooksList = () => {
  const books = useAppSelector((state) => state.books.books)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const filteredBooks = useMemo(
    () => {
      const source = showFavoritesOnly ? books.filter((book) => book.isFavorite) : books
      return [...source].sort(
        (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
      )
    },
    [books, showFavoritesOnly],
  )

  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">Books List</h2>
        <div className="books-filter-actions">
          <button
            className={`button button--secondary books-filter-btn${!showFavoritesOnly ? ' button--secondary-active' : ''}`}
            type="button"
            onClick={() => setShowFavoritesOnly(false)}
          >
            All
          </button>
          <button
            className={`button button--secondary books-filter-btn${showFavoritesOnly ? ' button--secondary-active' : ''}`}
            type="button"
            onClick={() => setShowFavoritesOnly(true)}
          >
            Favorites
          </button>
        </div>
      </div>
      {filteredBooks.length === 0 ? (
        <p className="panel__empty">
          {showFavoritesOnly
            ? 'No favorite books yet.'
            : 'No books yet. Add your first one above.'}
        </p>
      ) : (
        <ul className="books__list books__list--three-col">
          {filteredBooks.map((book) => (
            <BookItem key={book.id} book={book} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default BooksList

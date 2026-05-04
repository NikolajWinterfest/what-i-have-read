import './App.css'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import BookPage from './pages/BookPage'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getBooks } from './api/booksApi'
import ScrollPositionManager from './components/Scroll/ScrollPositionManager'
import ScrollToTopButton from './components/Scroll/ScrollToTopButton'
import { setBooks, setError, setLoading } from './store/booksSlice'
import { useAppDispatch } from './store/hooks'

function App() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const loadBooks = async () => {
      dispatch(setLoading(true))
      dispatch(setError(null))
      try {
        const books = await getBooks()
        dispatch(setBooks(books))
      } catch {
        dispatch(setError('Failed to load books from JSON storage.'))
      } finally {
        dispatch(setLoading(false))
      }
    }

    void loadBooks()
  }, [dispatch])

  return (
    <BrowserRouter>
      <ScrollPositionManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book/:bookId" element={<BookPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ScrollToTopButton />
    </BrowserRouter>
  )
}

export default App

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Book } from '../types/book'

export type BooksState = {
  books: Book[]
  isLoading: boolean
  error: string | null
}

const initialState: BooksState = {
  books: [],
  isLoading: false,
  error: null,
}

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setBooks: (state, action: PayloadAction<Book[]>) => {
      state.books = action.payload
    },
    addBook: (state, action: PayloadAction<Book>) => {
      state.books.push(action.payload)
    },
    replaceBook: (state, action: PayloadAction<Book>) => {
      const index = state.books.findIndex(
        (book) => String(book.id) === String(action.payload.id),
      )
      if (index === -1) {
        state.books.push(action.payload)
        return
      }
      state.books[index] = action.payload
    },
    deleteBook: (state, action: PayloadAction<string>) => {
      state.books = state.books.filter(
        (book) => String(book.id) !== String(action.payload),
      )
    },
  },
})

export const { addBook, deleteBook, replaceBook, setBooks, setError, setLoading } =
  booksSlice.actions

export const booksReducer = booksSlice.reducer

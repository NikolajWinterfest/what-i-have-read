import type { Book } from '../types/book'

const API_BASE = '/api/books'

const assertOk = async (response: Response): Promise<void> => {
  if (response.ok) {
    return
  }
  const body = await response.text()
  throw new Error(body || `Request failed with status ${response.status}`)
}

const toBookFormData = (payload: {
  bookName: string
  author: string
  translator?: string
  description: string
  review: string
  imageFile?: File | null
  removeImage?: boolean
}): FormData => {
  const form = new FormData()
  form.set('bookName', payload.bookName)
  form.set('author', payload.author)
  form.set('translator', payload.translator ?? '')
  form.set('description', payload.description)
  form.set('review', payload.review)
  if (payload.removeImage) {
    form.set('removeImage', 'true')
  }
  if (payload.imageFile) {
    form.set('image', payload.imageFile)
  }
  return form
}

export const getBooks = async (): Promise<Book[]> => {
  const response = await fetch(API_BASE)
  await assertOk(response)
  return (await response.json()) as Book[]
}

export const createBook = async (payload: {
  bookName: string
  author: string
  translator?: string
  description: string
  review: string
  imageFile?: File | null
}): Promise<Book> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    body: toBookFormData(payload),
  })
  await assertOk(response)
  return (await response.json()) as Book
}

export const patchBook = async (
  bookId: string,
  payload: {
    bookName: string
    author: string
    translator?: string
    description: string
    review: string
    imageFile?: File | null
    removeImage?: boolean
  },
): Promise<Book> => {
  const response = await fetch(`${API_BASE}/${bookId}`, {
    method: 'PATCH',
    body: toBookFormData(payload),
  })
  await assertOk(response)
  return (await response.json()) as Book
}

export const removeBook = async (bookId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/${bookId}`, {
    method: 'DELETE',
  })
  await assertOk(response)
}

export const setBookFavorite = async (bookId: string, isFavorite: boolean): Promise<Book> => {
  const response = await fetch(`${API_BASE}/${bookId}/favorite`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isFavorite }),
  })
  await assertOk(response)
  return (await response.json()) as Book
}

export const createQuote = async (bookId: string, quote: string): Promise<Book> => {
  const response = await fetch(`${API_BASE}/${bookId}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quote }),
  })
  await assertOk(response)
  return (await response.json()) as Book
}

export const patchQuote = async (
  bookId: string,
  quoteIndex: number,
  text: string,
): Promise<Book> => {
  const response = await fetch(`${API_BASE}/${bookId}/quotes/${quoteIndex}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  await assertOk(response)
  return (await response.json()) as Book
}

export const removeQuote = async (bookId: string, quoteIndex: number): Promise<Book> => {
  const response = await fetch(`${API_BASE}/${bookId}/quotes/${quoteIndex}`, {
    method: 'DELETE',
  })
  await assertOk(response)
  return (await response.json()) as Book
}

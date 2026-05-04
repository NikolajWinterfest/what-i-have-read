import cors from 'cors'
import express from 'express'
import multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { v4 as uuidv4 } from 'uuid'

type Book = {
  id: string
  createdAt: string
  bookName: string
  author: string
  translator?: string
  description: string
  review: string
  image: string
  isFavorite: boolean
  quotes: string[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const dataFilePath = path.join(projectRoot, 'server', 'data', 'books.json')
const uploadsDirPath = path.join(projectRoot, 'server', 'uploads')

const app = express()
const PORT = 4000

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDirPath),
  filename: (_req, file, cb) => {
    const timestamp = Date.now()
    const ext = path.extname(file.originalname) || '.png'
    const safeName = `${timestamp}-${Math.random().toString(36).slice(2, 8)}${ext}`
    cb(null, safeName)
  },
})

const upload = multer({ storage })
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const readBooks = async (): Promise<Book[]> => {
  const raw = await fs.readFile(dataFilePath, 'utf-8')
  const parsed = JSON.parse(raw) as Array<Partial<Book>>
  const fallbackBaseTimestamp = Date.now() - parsed.length
  return parsed.map((book, index) => ({
    id: typeof book.id === 'string' ? book.id : String(book.id ?? index + 1),
    createdAt:
      typeof book.createdAt === 'string' && Number.isFinite(Date.parse(book.createdAt))
        ? book.createdAt
        : new Date(fallbackBaseTimestamp + index).toISOString(),
    bookName: String(book.bookName ?? ''),
    author: String(book.author ?? ''),
    translator: typeof book.translator === 'string' ? book.translator : '',
    description: String(book.description ?? ''),
    review: String(book.review ?? ''),
    image: String(book.image ?? ''),
    isFavorite: Boolean(book.isFavorite),
    quotes: Array.isArray(book.quotes) ? book.quotes.map((quote) => String(quote)) : [],
  }))
}

const writeBooks = async (books: Book[]): Promise<void> => {
  await fs.writeFile(dataFilePath, `${JSON.stringify(books, null, 2)}\n`, 'utf-8')
}

const ensureUuidBookIds = async (): Promise<void> => {
  const books = await readBooks()
  let hasChanges = false

  const normalized = books.map((book) => {
    let nextBook = book

    if (!uuidPattern.test(book.id)) {
      hasChanges = true
      nextBook = { ...nextBook, id: uuidv4() }
    }

    if (!nextBook.createdAt || !Number.isFinite(Date.parse(nextBook.createdAt))) {
      hasChanges = true
      nextBook = { ...nextBook, createdAt: new Date().toISOString() }
    }

    return nextBook
  })

  if (hasChanges) {
    await writeBooks(normalized)
  }
}

const deleteUploadedImage = async (imagePath: string): Promise<void> => {
  if (!imagePath.startsWith('/uploads/')) {
    return
  }
  const filePath = path.join(projectRoot, 'server', imagePath)
  try {
    await fs.unlink(filePath)
  } catch {
    // Ignore file delete errors.
  }
}

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDirPath))

app.get('/api/books', async (_req, res) => {
  try {
    const books = await readBooks()
    res.json(books)
  } catch {
    res.status(500).json({ message: 'Failed to read books.' })
  }
})

app.post('/api/books', upload.single('image'), async (req, res) => {
  try {
    const books = await readBooks()

    const newBook: Book = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      bookName: String(req.body.bookName ?? '').trim(),
      author: String(req.body.author ?? '').trim(),
      translator: String(req.body.translator ?? '').trim(),
      description: String(req.body.description ?? '').trim(),
      review: String(req.body.review ?? '').trim(),
      image: req.file ? `/uploads/${req.file.filename}` : '',
      isFavorite: false,
      quotes: [],
    }

    books.push(newBook)
    await writeBooks(books)
    res.status(201).json(newBook)
  } catch {
    res.status(500).json({ message: 'Failed to create book.' })
  }
})

app.patch('/api/books/:id', upload.single('image'), async (req, res) => {
  try {
    const bookId = String(req.params.id)
    const books = await readBooks()
    const index = books.findIndex((book) => book.id === bookId)
    if (index === -1) {
      res.status(404).json({ message: 'Book not found.' })
      return
    }

    const currentBook = books[index]
    const removeImage =
      req.body.removeImage === 'true' ||
      req.body.removeImage === true ||
      req.body.removeImage === '1' ||
      req.body.removeImage === 1

    let nextImage = currentBook.image
    if (removeImage) {
      nextImage = ''
    }
    if (req.file) {
      nextImage = `/uploads/${req.file.filename}`
    }

    const updatedBook: Book = {
      ...currentBook,
      bookName: String(req.body.bookName ?? currentBook.bookName).trim(),
      author: String(req.body.author ?? currentBook.author).trim(),
      translator: String(req.body.translator ?? currentBook.translator ?? '').trim(),
      description: String(req.body.description ?? currentBook.description).trim(),
      review: String(req.body.review ?? currentBook.review).trim(),
      image: nextImage,
    }

    if (currentBook.image && currentBook.image !== updatedBook.image) {
      await deleteUploadedImage(currentBook.image)
    }

    books[index] = updatedBook
    await writeBooks(books)
    res.json(updatedBook)
  } catch {
    res.status(500).json({ message: 'Failed to update book.' })
  }
})

app.delete('/api/books/:id', async (req, res) => {
  try {
    const bookId = String(req.params.id)
    const books = await readBooks()
    const targetBook = books.find((book) => book.id === bookId)
    if (!targetBook) {
      res.status(404).json({ message: 'Book not found.' })
      return
    }

    await deleteUploadedImage(targetBook.image)
    const nextBooks = books.filter((book) => book.id !== bookId)
    await writeBooks(nextBooks)
    res.status(204).send()
  } catch {
    res.status(500).json({ message: 'Failed to delete book.' })
  }
})

app.patch('/api/books/:id/favorite', async (req, res) => {
  try {
    const bookId = String(req.params.id)
    const rawFavorite = req.body.isFavorite
    const isFavorite =
      rawFavorite === true ||
      rawFavorite === 'true' ||
      rawFavorite === 1 ||
      rawFavorite === '1'
    const books = await readBooks()
    const index = books.findIndex((book) => book.id === bookId)
    if (index === -1) {
      res.status(404).json({ message: 'Book not found.' })
      return
    }

    books[index].isFavorite = isFavorite
    await writeBooks(books)
    res.json(books[index])
  } catch {
    res.status(500).json({ message: 'Failed to update favorite status.' })
  }
})

app.post('/api/books/:id/quotes', async (req, res) => {
  try {
    const bookId = String(req.params.id)
    const quote = String(req.body.quote ?? '')
    if (!/\S/.test(quote)) {
      res.status(400).json({ message: 'Quote is required.' })
      return
    }

    const books = await readBooks()
    const index = books.findIndex((book) => book.id === bookId)
    if (index === -1) {
      res.status(404).json({ message: 'Book not found.' })
      return
    }

    books[index].quotes.push(quote)
    await writeBooks(books)
    res.json(books[index])
  } catch {
    res.status(500).json({ message: 'Failed to add quote.' })
  }
})

app.patch('/api/books/:id/quotes/:quoteIndex', async (req, res) => {
  try {
    const bookId = String(req.params.id)
    const quoteIndex = Number(req.params.quoteIndex)
    const nextQuote = String(req.body.text ?? '')
    if (!/\S/.test(nextQuote)) {
      res.status(400).json({ message: 'Quote text is required.' })
      return
    }

    const books = await readBooks()
    const index = books.findIndex((book) => book.id === bookId)
    if (index === -1) {
      res.status(404).json({ message: 'Book not found.' })
      return
    }

    if (!books[index].quotes[quoteIndex]) {
      res.status(404).json({ message: 'Quote not found.' })
      return
    }

    books[index].quotes[quoteIndex] = nextQuote
    await writeBooks(books)
    res.json(books[index])
  } catch {
    res.status(500).json({ message: 'Failed to update quote.' })
  }
})

app.delete('/api/books/:id/quotes/:quoteIndex', async (req, res) => {
  try {
    const bookId = String(req.params.id)
    const quoteIndex = Number(req.params.quoteIndex)
    const books = await readBooks()
    const index = books.findIndex((book) => book.id === bookId)
    if (index === -1) {
      res.status(404).json({ message: 'Book not found.' })
      return
    }

    if (!books[index].quotes[quoteIndex]) {
      res.status(404).json({ message: 'Quote not found.' })
      return
    }

    books[index].quotes = books[index].quotes.filter((_quote, idx) => idx !== quoteIndex)
    await writeBooks(books)
    res.json(books[index])
  } catch {
    res.status(500).json({ message: 'Failed to delete quote.' })
  }
})

const startServer = async () => {
  await ensureUuidBookIds()
  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`)
  })
}

void startServer()

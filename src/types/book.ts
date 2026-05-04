export interface Book {
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

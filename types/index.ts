export interface Product {
  id: string
  name: string
  category: string
  price: number
  oldPrice?: number
  description: string
  colors: string[]
  sizes: string[]
  images: string[]
  tags: string[]
}

import fs from 'fs'
import path from 'path'
import { Product } from '@/types'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json')

function read(): Product[] {
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'))
  } catch {
    return []
  }
}

export function getProductById(id: string): Product | undefined {
  return read().find((p) => p.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return read().filter((p) => p.category === category)
}

export function getNewProducts(): Product[] {
  return read().filter((p) => p.tags.includes('جديد'))
}

export function getDiscountedProducts(): Product[] {
  return read().filter((p) => p.tags.includes('تخفيض'))
}

export function getOffersProducts(): Product[] {
  return read().filter((p) => p.tags.includes('تخفيض') || p.tags.includes('جديد'))
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase()
  return read().filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  )
}

export function filterProducts(
  category?: string,
  sizes?: string[],
  colors?: string[],
  tag?: string,
  searchQuery?: string
): Product[] {
  let filtered = searchQuery ? searchProducts(searchQuery) : read()

  if (category && category !== 'الكل') {
    filtered = filtered.filter((p) => p.category === category)
  }
  if (sizes?.length) {
    filtered = filtered.filter((p) => p.sizes.some((s) => sizes.includes(s)))
  }
  if (colors?.length) {
    filtered = filtered.filter((p) => p.colors.some((c) => colors.includes(c)))
  }
  if (tag) {
    filtered = filtered.filter((p) => p.tags.includes(tag))
  }
  return filtered
}
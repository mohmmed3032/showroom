import productsData from '@/data/products.json'
import { Product } from '@/types'

export const products: Product[] = productsData as Product[]

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category)
}

export function getNewProducts(): Product[] {
  return products.filter((p) => p.tags.includes('جديد'))
}

export function getDiscountedProducts(): Product[] {
  return products.filter((p) => p.tags.includes('تخفيض'))
}

export function getOffersProducts(): Product[] {
  return products.filter((p) => p.tags.includes('تخفيض') || p.tags.includes('جديد'))
}

export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase()
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
  )
}

export function filterProducts(
  category?: string,
  sizes?: string[],
  colors?: string[],
  tag?: string,
  searchQuery?: string
): Product[] {
  let filtered = [...products]

  if (searchQuery) {
    filtered = searchProducts(searchQuery)
  }

  if (category && category !== 'الكل') {
    filtered = filtered.filter((p) => p.category === category)
  }

  if (sizes && sizes.length > 0) {
    filtered = filtered.filter((p) =>
      p.sizes.some((s) => sizes.includes(s))
    )
  }

  if (colors && colors.length > 0) {
    filtered = filtered.filter((p) =>
      p.colors.some((c) => colors.includes(c))
    )
  }

  if (tag) {
    filtered = filtered.filter((p) => p.tags.includes(tag))
  }

  return filtered
}

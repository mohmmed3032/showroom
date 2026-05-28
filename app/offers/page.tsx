'use client'

import { useState, useMemo } from 'react'
import SectionTitle from '@/components/SectionTitle'
import ProductGrid from '@/components/ProductGrid'
import FilterBar from '@/components/FilterBar'
import SearchBar from '@/components/SearchBar'
import { getOffersProducts, filterProducts } from '@/lib/products'

export default function OffersPage() {
  const [selectedCategory, setSelectedCategory] = useState('الكل')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const allOffers = getOffersProducts()

  const filteredProducts = useMemo(() => {
    const base = filterProducts(
      selectedCategory,
      selectedSizes,
      selectedColors,
      selectedTag,
      searchQuery
    )
    return base.filter((p) => p.tags.includes('جديد') || p.tags.includes('تخفيض'))
  }, [selectedCategory, selectedSizes, selectedColors, selectedTag, searchQuery])

  const allSizes = Array.from(new Set(allOffers.flatMap((p) => p.sizes)))
  const allColors = Array.from(new Set(allOffers.flatMap((p) => p.colors)))
  const allCategories = Array.from(new Set(allOffers.map((p) => p.category)))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionTitle title="العروض والجديد" subtitle="لا تفوتي الفرصة" />

      <SearchBar onSearch={setSearchQuery} initialQuery={searchQuery} />

      <FilterBar
        categories={['الكل', ...allCategories]}
        sizes={allSizes}
        colors={allColors}
        selectedCategory={selectedCategory}
        selectedSizes={selectedSizes}
        selectedColors={selectedColors}
        selectedTag={selectedTag}
        onCategoryChange={setSelectedCategory}
        onSizesChange={setSelectedSizes}
        onColorsChange={setSelectedColors}
        onTagChange={setSelectedTag}
      />

      <p className="text-sm text-warm-gray mb-4">
        {filteredProducts.length} منتج
      </p>

      <ProductGrid products={filteredProducts} emptyMessage="لا توجد عروض تطابق الفلاتر المحددة" />
    </div>
  )
}

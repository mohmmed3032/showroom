'use client'

import { useState, useMemo, useEffect } from 'react'
import SectionTitle from '@/components/SectionTitle'
import ProductGrid from '@/components/ProductGrid'
import FilterBar from '@/components/FilterBar'
import SearchBar from '@/components/SearchBar'
import { getProductsByCategory, filterProducts } from '@/lib/products'
import { getPublicProducts } from '../admin/actions';

export default function ShoesPage() {
  const [selectedCategory, setSelectedCategory] = useState('أحذية')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [allShoes, setAllShoes] = useState<any[]>([])
  useEffect(() => {
    getPublicProducts().then(p => setAllShoes(p.filter(x => x.category === 'أحذية')))
  }, [])

  const filteredProducts = useMemo(() => {
    return filterProducts(
      selectedCategory,
      selectedSizes,
      selectedColors,
      selectedTag,
      searchQuery
    ).filter((p) => p.category === 'أحذية')
  }, [selectedCategory, selectedSizes, selectedColors, selectedTag, searchQuery])

  const allSizes = Array.from(new Set(allShoes.flatMap((p) => p.sizes)))
  const allColors = Array.from(new Set(allShoes.flatMap((p) => p.colors)))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionTitle title="أحذية" subtitle="خطوات بأناقة" />

      <SearchBar onSearch={setSearchQuery} initialQuery={searchQuery} />

      <FilterBar
        categories={['الكل', 'أحذية']}
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

      <ProductGrid products={filteredProducts} emptyMessage="لا توجد أحذية تطابق الفلاتر المحددة" />
    </div>
  )
}

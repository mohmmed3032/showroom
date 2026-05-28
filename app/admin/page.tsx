'use client'

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  ShoppingBag,
  Search,
  X,
  ArrowLeft,
  Package,
  TrendingDown,
  Star,
  ChevronLeft,
  ChevronRight,
  Percent,
  AlertTriangle,
  Upload,
} from 'lucide-react'
import {
  logout,
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  addDiscount,
  removeDiscount,
  toggleNewTag,
  uploadImage,
} from './actions'
import { Product } from '@/types'
import { cn } from '@/lib/utils'

type Tab = 'products' | 'add' | 'stats'
type AddStep = 1 | 2

const CATEGORIES = ['ملابس نسائية', 'عطور', 'أحذية']

const CLOTHES_COLORS = ['أسود', 'أبيض', 'بيج', 'ذهبي', 'وردي', 'رمادي', 'نيلي', 'أحمر', 'بني', 'أزرق فاتح', 'أزرق غامق', 'أخضر زيتوني', 'كريمي', 'وردي فاتح']
const SHOES_COLORS = ['أسود', 'أبيض', 'بيج', 'ذهبي', 'وردي', 'رمادي', 'بني', 'أحمر']

const CLOTHES_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const SHOES_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43']

const TAG_OPTIONS = ['جديد', 'تخفيض']

const COLOR_SWATCHES: Record<string, string> = {
  'أسود': '#1a1a1a', 'أبيض': '#ffffff', 'بيج': '#E8DFD0', 'ذهبي': '#C9A96E',
  'وردي': '#F5E6E0', 'وردي فاتح': '#FDF2F0', 'رمادي': '#9CA3AF', 'نيلي': '#1e3a5f',
  'أحمر': '#DC2626', 'بني': '#8B4513', 'أزرق فاتح': '#93C5FD', 'أزرق غامق': '#1E40AF',
  'أخضر زيتوني': '#6B7C3E', 'كريمي': '#FFFDD0',
}

interface UploadedImage {
  url: string
  file?: File
  uploading?: boolean
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Discount modals
  const [discountModal, setDiscountModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null })
  const [removeDiscountModal, setRemoveDiscountModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null })
  const [newDiscountPrice, setNewDiscountPrice] = useState('')

  const [message, setMessage] = useState('')

  // Add product wizard state
  const [addStep, setAddStep] = useState<AddStep>(1)
  const [wizardData, setWizardData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    images: [] as UploadedImage[],
    colors: [] as string[],
    sizes: [] as string[],
    customSize: '',
    tags: [] as string[],
  })

  // Image upload drag state
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadProducts = useCallback(async () => {
    const data = await getAllProducts()
    setProducts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Stats
  const totalProducts = products.length
  const totalDiscounts = products.filter((p) => p.oldPrice).length
  const totalNew = products.filter((p) => p.tags.includes('جديد')).length
  const categories = Array.from(new Set(products.map((p) => p.category)))

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ─── Wizard helpers ───
  const resetWizard = () => {
    setAddStep(1)
    setWizardData({
      name: '', category: '', price: '', description: '',
      images: [], colors: [], sizes: [], customSize: '', tags: [],
    })
  }

  const toggleWizardArray = (field: 'colors' | 'sizes' | 'tags', value: string) => {
    setWizardData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }))
  }

  const canGoToStep2 = wizardData.name.trim() && wizardData.category && Number(wizardData.price) > 0

  // ─── Custom size helpers ───
  const addCustomSize = () => {
    const trimmed = wizardData.customSize.trim()
    if (!trimmed) return
    if (wizardData.sizes.includes(trimmed)) {
      setWizardData((prev) => ({ ...prev, customSize: '' }))
      return
    }
    setWizardData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, trimmed],
      customSize: '',
    }))
  }

  const handleCustomSizeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomSize()
    }
  }

  // ─── Image Upload ───
  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      setWizardData((prev) => ({
        ...prev,
        images: [...prev.images, { url: '', file, uploading: true }],
      }))

      const formData = new FormData()
      formData.append('image', file)

      const result = await uploadImage(formData)

      setWizardData((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.file === file
            ? { url: result.success ? result.url : '', uploading: false }
            : img
        ),
      }))

      if (!result.success) {
        setMessage(`❌ ${result.error}`)
        setTimeout(() => setMessage(''), 3000)
      }
    }
  }

  const removeImage = (index: number) => {
    setWizardData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleImageUpload(e.dataTransfer.files)
  }

  async function handleAddProductSubmit() {
    const imageUrls = wizardData.images.map((img) => img.url).filter(Boolean)
    if (imageUrls.length === 0) {
      setMessage('❌ أضيفي صورة واحدة على الأقل')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    // Add any pending custom size
    const trimmedCustom = wizardData.customSize.trim()
    let finalSizes = [...wizardData.sizes]
    if (trimmedCustom && !finalSizes.includes(trimmedCustom)) {
      finalSizes = [...finalSizes, trimmedCustom]
    }

    const formData = new FormData()
    formData.append('name', wizardData.name)
    formData.append('category', wizardData.category)
    formData.append('price', wizardData.price)
    formData.append('description', wizardData.description)
    formData.append('images', imageUrls.join(', '))
    formData.append('colors', wizardData.colors.join(', '))
    formData.append('sizes', finalSizes.join(', '))
    formData.append('tags', wizardData.tags.join(', '))

    const result = await addProduct(formData)
    if (result.success) {
      setMessage('✅ تم إضافة المنتج بنجاح')
      setActiveTab('products')
      resetWizard()
      loadProducts()
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // ─── Edit form ───
  const [editForm, setEditForm] = useState({
    name: '', category: '', price: '', oldPrice: '', description: '',
    images: '', colors: [] as string[], sizes: [] as string[], tags: [] as string[],
  })

  const initEditForm = (product: Product) => {
    setEditForm({
      name: product.name, category: product.category,
      price: product.price.toString(), oldPrice: product.oldPrice?.toString() || '',
      description: product.description, images: product.images.join(', '),
      colors: [...product.colors], sizes: [...product.sizes], tags: [...product.tags],
    })
  }

  const toggleEditArray = (field: 'colors' | 'sizes' | 'tags', value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }))
  }

  async function handleUpdateProduct() {
    if (!editingProduct) return
    const formData = new FormData()
    formData.append('name', editForm.name)
    formData.append('category', editForm.category)
    formData.append('price', editForm.price)
    formData.append('oldPrice', editForm.oldPrice)
    formData.append('description', editForm.description)
    formData.append('images', editForm.images)
    formData.append('colors', editForm.colors.join(', '))
    formData.append('sizes', editForm.sizes.join(', '))
    formData.append('tags', editForm.tags.join(', '))

    const result = await updateProduct(editingProduct.id, formData)
    if (result.success) {
      setMessage('✅ تم تحديث المنتج بنجاح')
      setEditingProduct(null)
      setActiveTab('products')
      loadProducts()
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنتِ متأكدة من حذف هذا المنتج؟')) return
    const result = await deleteProduct(id)
    if (result.success) {
      setMessage('🗑️ تم حذف المنتج')
      loadProducts()
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function handleAddDiscount() {
    if (!discountModal.product || !newDiscountPrice) return
    const result = await addDiscount(discountModal.product.id, Number(newDiscountPrice))
    if (result.success) {
      setMessage('💰 تم إضافة التخفيض بنجاح')
      setDiscountModal({ open: false, product: null })
      setNewDiscountPrice('')
      loadProducts()
      setTimeout(() => setMessage(''), 3000)
    } else if (result.error) {
      setMessage(`❌ ${result.error}`)
      setTimeout(() => setMessage(''), 4000)
    }
  }

  async function handleRemoveDiscount() {
    if (!removeDiscountModal.product) return
    const result = await removeDiscount(removeDiscountModal.product.id)
    if (result.success) {
      setMessage('✅ تم إزالة التخفيض واستعادة السعر الأصلي')
      setRemoveDiscountModal({ open: false, product: null })
      loadProducts()
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function handleToggleNew(id: string) {
    const result = await toggleNewTag(id)
    if (result.success) {
      setMessage(result.isNew ? '⭐ تم وسم المنتج كجديد' : 'تم إزالة وسم الجديد')
      loadProducts()
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // ─── Multi-select checkbox component ───
  const CheckboxGroup = ({
    label, options, selected, onToggle, type = 'color',
  }: {
    label: string
    options: string[]
    selected: string[]
    onToggle: (val: string) => void
    type?: 'color' | 'size' | 'tag'
  }) => (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-charcoal mb-3">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt)
          const swatch = COLOR_SWATCHES[opt]
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all',
                isSelected
                  ? 'bg-gold/10 border-gold text-charcoal shadow-sm'
                  : 'bg-white border-beige text-charcoal/60 hover:border-gold/40'
              )}
            >
              {type === 'color' && swatch && (
                <span
                  className="w-4 h-4 rounded-full border border-beige shrink-0"
                  style={{ backgroundColor: swatch, borderColor: opt === 'أبيض' ? '#d1d5db' : undefined }}
                />
              )}
              {type === 'tag' && (
                <span className={cn('w-2 h-2 rounded-full shrink-0', opt === 'جديد' ? 'bg-gold' : 'bg-rose')} />
              )}
              <span>{opt}</span>
              {isSelected && <X className="w-3 h-3 text-gold" />}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      {/* Top Bar */}
      <div className="bg-white border-b border-beige/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h1 className="font-bold text-charcoal text-sm">لوحة التحكم</h1>
                <p className="text-xs text-gold">صالة العرض - ليبيا</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" target="_blank" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-charcoal/70 hover:text-charcoal hover:bg-cream rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" />
                عرض الموقع
              </Link>
              <form action={logout}>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium animate-fade-in">
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'products' as Tab, label: 'المنتجات', icon: Package },
            { id: 'add' as Tab, label: 'إضافة منتج', icon: Plus },
            { id: 'stats' as Tab, label: 'الإحصائيات', icon: TrendingDown },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setEditingProduct(null); if (tab.id !== 'add') resetWizard() }}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-gold text-white shadow-lg shadow-gold/20'
                  : 'bg-white text-charcoal/70 hover:text-charcoal border border-beige hover:border-gold/30'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── PRODUCTS TAB ─── */}
        {activeTab === 'products' && (
          <div>
            {editingProduct ? (
              <div className="bg-white rounded-2xl border border-beige/50 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setEditingProduct(null)} className="p-2 rounded-lg hover:bg-cream transition-colors">
                    <ChevronRight className="w-5 h-5 text-charcoal" />
                  </button>
                  <h2 className="text-xl font-bold text-charcoal">تعديل المنتج</h2>
                </div>
                <div className="max-w-3xl space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">اسم المنتج</label>
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">الفئة</label>
                      <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value, colors: [], sizes: [] })} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10">
                        {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">السعر (د.ل)</label>
                      <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">السعر القديم (د.ل) - اختياري</label>
                      <input type="number" value={editForm.oldPrice} onChange={(e) => setEditForm({ ...editForm, oldPrice: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">الوصف</label>
                    <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={4} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">روابط الصور (مفصولة بفاصلة)</label>
                    <input value={editForm.images} onChange={(e) => setEditForm({ ...editForm, images: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10" />
                  </div>
                  <CheckboxGroup
                    label={editForm.category === 'عطور' ? 'أحجام العبوة (ml)' : 'الألوان المتوفرة'}
                    options={editForm.category === 'ملابس نسائية' ? CLOTHES_COLORS : editForm.category === 'أحذية' ? SHOES_COLORS : ['30ml', '50ml', '100ml']}
                    selected={editForm.colors}
                    onToggle={(v) => toggleEditArray('colors', v)}
                    type="color"
                  />
                  <CheckboxGroup
                    label={editForm.category === 'عطور' ? 'الأحجام المتوفرة' : editForm.category === 'أحذية' ? 'المقاسات المتوفرة' : 'المقاسات المتوفرة'}
                    options={editForm.category === 'ملابس نسائية' ? CLOTHES_SIZES : editForm.category === 'أحذية' ? SHOES_SIZES : ['30ml', '50ml', '100ml']}
                    selected={editForm.sizes}
                    onToggle={(v) => toggleEditArray('sizes', v)}
                    type="size"
                  />
                  <CheckboxGroup label="الوسوم" options={TAG_OPTIONS} selected={editForm.tags} onToggle={(v) => toggleEditArray('tags', v)} type="tag" />
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleUpdateProduct} className="px-6 py-3 bg-gold hover:bg-gold-dark text-white rounded-xl font-semibold transition-colors shadow-lg shadow-gold/20">حفظ التعديلات</button>
                    <button onClick={() => setEditingProduct(null)} className="px-6 py-3 bg-beige hover:bg-sand text-charcoal rounded-xl font-semibold transition-colors">إلغاء</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="relative mb-6 max-w-md">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث في المنتجات..." className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal"><X className="w-4 h-4" /></button>}
                </div>
                {loading ? <div className="text-center py-20 text-warm-gray">جاري التحميل...</div> : (
                  <div className="bg-white rounded-2xl border border-beige/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-cream border-b border-beige">
                            <th className="px-4 py-3 text-right font-semibold text-charcoal">المنتج</th>
                            <th className="px-4 py-3 text-right font-semibold text-charcoal">الفئة</th>
                            <th className="px-4 py-3 text-right font-semibold text-charcoal">السعر</th>
                            <th className="px-4 py-3 text-right font-semibold text-charcoal">التخفيض</th>
                            <th className="px-4 py-3 text-right font-semibold text-charcoal">الوسوم</th>
                            <th className="px-4 py-3 text-right font-semibold text-charcoal">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => {
                            const hasDiscount = product.oldPrice && product.oldPrice > product.price
                            const discountPercent = hasDiscount ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100) : 0
                            return (
                              <tr key={product.id} className="border-b border-beige/50 hover:bg-cream/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-rose-light shrink-0">
                                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-charcoal">{product.name}</p>
                                      <p className="text-xs text-warm-gray">ID: {product.id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-warm-gray">{product.category}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-charcoal">{product.price} د.ل</span>
                                    {hasDiscount && <span className="text-xs text-warm-gray line-through">{product.oldPrice} د.ل</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {hasDiscount ? (
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 rounded-md bg-rose text-charcoal text-xs font-bold">خصم {discountPercent}%</span>
                                      <button onClick={() => setRemoveDiscountModal({ open: true, product })} className="p-1.5 rounded-lg hover:bg-red-50 text-warm-gray hover:text-red-500 transition-colors" title="إزالة التخفيض"><X className="w-4 h-4" /></button>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setDiscountModal({ open: true, product }); setNewDiscountPrice('') }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream border border-beige text-warm-gray hover:text-gold hover:border-gold/40 transition-colors text-xs" title="إضافة تخفيض"><Percent className="w-3.5 h-3.5" />إضافة خصم</button>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1.5 flex-wrap">
                                    {product.tags.map((tag) => (
                                      <span key={tag} className={cn('px-2 py-0.5 rounded text-xs font-medium', tag === 'جديد' ? 'bg-gold/10 text-gold' : 'bg-rose text-charcoal')}>{tag}</span>
                                    ))}
                                    <button onClick={() => handleToggleNew(product.id)} className={cn('px-2 py-0.5 rounded text-xs font-medium transition-colors', product.tags.includes('جديد') ? 'bg-warm-gray/10 text-warm-gray hover:bg-red-50 hover:text-red-500' : 'bg-gold/10 text-gold hover:bg-gold hover:text-white')} title={product.tags.includes('جديد') ? 'إزالة وسم جديد' : 'إضافة وسم جديد'}><Sparkles className="w-3 h-3 inline" /></button>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => { setEditingProduct(product); initEditForm(product); setActiveTab('products') }} className="p-1.5 rounded-lg hover:bg-gold/10 text-warm-gray hover:text-gold transition-colors" title="تعديل"><Edit3 className="w-4 h-4" /></button>
                                    <Link href={`/product/${product.id}`} target="_blank" className="p-1.5 rounded-lg hover:bg-gold/10 text-warm-gray hover:text-gold transition-colors" title="عرض"><ArrowLeft className="w-4 h-4" /></Link>
                                    <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-warm-gray hover:text-red-500 transition-colors" title="حذف"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    {filteredProducts.length === 0 && <div className="text-center py-12 text-warm-gray">لا توجد منتجات تطابق البحث</div>}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── ADD PRODUCT WIZARD ─── */}
        {activeTab === 'add' && !editingProduct && (
          <div className="bg-white rounded-2xl border border-beige/50 p-6 shadow-sm max-w-3xl">
            {/* Wizard Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className={cn('flex items-center gap-2', addStep >= 1 && 'text-gold')}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', addStep >= 1 ? 'bg-gold text-white' : 'bg-beige text-charcoal/50')}>1</div>
                <span className="text-sm font-medium">المعلومات الأساسية</span>
              </div>
              <div className="flex-1 h-px bg-beige" />
              <div className={cn('flex items-center gap-2', addStep >= 2 && 'text-gold')}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', addStep >= 2 ? 'bg-gold text-white' : 'bg-beige text-charcoal/50')}>2</div>
                <span className="text-sm font-medium">التفاصيل</span>
              </div>
            </div>

            {/* Step 1 */}
            {addStep === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-xl font-bold text-charcoal mb-2">المعلومات الأساسية</h2>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">اسم المنتج</label>
                  <input value={wizardData.name} onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })} placeholder="مثال: فستان سهرة أنيق" className="w-full px-4 py-3 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">الفئة</label>
                  <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                      <button key={cat} type="button" onClick={() => setWizardData({ ...wizardData, category: cat, colors: [], sizes: [], customSize: '' })} className={cn('px-4 py-3 rounded-xl border text-sm font-medium transition-all text-center', wizardData.category === cat ? 'bg-gold text-white border-gold shadow-lg shadow-gold/20' : 'bg-cream text-charcoal/70 border-beige hover:border-gold/40')}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">السعر (د.ل)</label>
                  <input type="number" value={wizardData.price} onChange={(e) => setWizardData({ ...wizardData, price: e.target.value })} placeholder="مثال: 350" className="w-full px-4 py-3 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10" />
                </div>
                <div className="pt-4">
                  <button onClick={() => setAddStep(2)} disabled={!canGoToStep2} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors shadow-lg shadow-gold/20">
                    التالي<ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {addStep === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-charcoal">تفاصيل المنتج</h2>
                  <span className="text-sm text-gold bg-gold/10 px-3 py-1 rounded-full">{wizardData.category}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">الوصف</label>
                  <textarea value={wizardData.description} onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })} placeholder="وصف تفصيلي للمنتج..." rows={4} className="w-full px-4 py-3 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10 resize-none" />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">صور المنتج</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
                      dragOver ? 'border-gold bg-gold/5' : 'border-beige bg-cream hover:border-gold/40'
                    )}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e.target.files)} className="hidden" />
                    <Upload className="w-10 h-10 text-gold mx-auto mb-3" />
                    <p className="text-sm font-medium text-charcoal mb-1">اسحبي الصور هنا أو اضغطي للاختيار</p>
                    <p className="text-xs text-warm-gray">JPG, PNG, WebP — الحد الأقصى 5 ميجابايت</p>
                  </div>
                  {wizardData.images.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {wizardData.images.map((img, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-beige bg-rose-light">
                          {img.uploading ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : img.url ? (
                            <>
                              <Image src={img.url} alt={`صورة ${index + 1}`} fill className="object-cover" sizes="96px" />
                              {index === 0 && <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-gold text-white text-[10px] font-bold rounded">رئيسية</div>}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-red-400"><X className="w-5 h-5" /></div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); removeImage(index) }} className="absolute top-1 left-1 w-6 h-6 rounded-full bg-charcoal/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Colors — only for clothes and shoes */}
                {wizardData.category !== 'عطور' && (
                  <CheckboxGroup
                    label="الألوان المتوفرة"
                    options={wizardData.category === 'ملابس نسائية' ? CLOTHES_COLORS : SHOES_COLORS}
                    selected={wizardData.colors}
                    onToggle={(v) => toggleWizardArray('colors', v)}
                    type="color"
                  />
                )}

                {/* Perfume sizes with custom + Enter key */}
                {wizardData.category === 'عطور' && (
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-charcoal mb-3">أحجام العبوة (ml)</label>
                    <div className="flex flex-wrap gap-2">
                      {['30ml', '50ml', '100ml'].map((size) => {
                        const isSelected = wizardData.sizes.includes(size)
                        return (
                          <button key={size} type="button" onClick={() => toggleWizardArray('sizes', size)} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all', isSelected ? 'bg-gold/10 border-gold text-charcoal shadow-sm' : 'bg-white border-beige text-charcoal/60 hover:border-gold/40')}>
                            <span className="w-4 h-4 rounded-full border border-beige shrink-0" style={{ backgroundColor: COLOR_SWATCHES[size] }} />
                            <span>{size}</span>
                            {isSelected && <X className="w-3 h-3 text-gold" />}
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={wizardData.customSize}
                        onChange={(e) => setWizardData({ ...wizardData, customSize: e.target.value })}
                        onKeyDown={handleCustomSizeKeyDown}
                        placeholder="أدخلي حجم مخصص واضغطي Enter"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10"
                      />
                      <button
                        type="button"
                        onClick={addCustomSize}
                        disabled={!wizardData.customSize.trim()}
                        className="px-4 py-2.5 bg-gold hover:bg-gold-dark disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                      >
                        إضافة
                      </button>
                    </div>
                    {/* Show added custom sizes */}
                    {wizardData.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {wizardData.sizes.map((size) => (
                          <span key={size} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold text-sm text-charcoal">
                            {size}
                            <button onClick={() => toggleWizardArray('sizes', size)} className="text-gold hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Shoes sizes with custom + Enter key */}
                {wizardData.category === 'أحذية' && (
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-charcoal mb-3">المقاسات المتوفرة</label>
                    <div className="flex flex-wrap gap-2">
                      {SHOES_SIZES.map((size) => {
                        const isSelected = wizardData.sizes.includes(size)
                        return (
                          <button key={size} type="button" onClick={() => toggleWizardArray('sizes', size)} className={cn('w-12 h-12 rounded-xl border text-sm font-medium transition-all flex items-center justify-center', isSelected ? 'bg-gold/10 border-gold text-charcoal shadow-sm' : 'bg-white border-beige text-charcoal/60 hover:border-gold/40')}>
                            {size}
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={wizardData.customSize}
                        onChange={(e) => setWizardData({ ...wizardData, customSize: e.target.value })}
                        onKeyDown={handleCustomSizeKeyDown}
                        placeholder="أدخلي مقاس مخصص واضغطي Enter"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10"
                      />
                      <button
                        type="button"
                        onClick={addCustomSize}
                        disabled={!wizardData.customSize.trim()}
                        className="px-4 py-2.5 bg-gold hover:bg-gold-dark disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                      >
                        إضافة
                      </button>
                    </div>
                    {/* Show added custom sizes */}
                    {wizardData.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {wizardData.sizes.map((size) => (
                          <span key={size} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold text-sm text-charcoal">
                            {size}
                            <button onClick={() => toggleWizardArray('sizes', size)} className="text-gold hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Clothes sizes */}
                {wizardData.category === 'ملابس نسائية' && (
                  <CheckboxGroup
                    label="المقاسات المتوفرة"
                    options={CLOTHES_SIZES}
                    selected={wizardData.sizes}
                    onToggle={(v) => toggleWizardArray('sizes', v)}
                    type="size"
                  />
                )}

                <CheckboxGroup label="الوسوم" options={TAG_OPTIONS} selected={wizardData.tags} onToggle={(v) => toggleWizardArray('tags', v)} type="tag" />

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setAddStep(1)} className="px-6 py-3 bg-beige hover:bg-sand text-charcoal rounded-xl font-semibold transition-colors">
                    <ChevronRight className="w-5 h-5 inline ml-1" />السابق
                  </button>
                  <button
                    onClick={handleAddProductSubmit}
                    disabled={!wizardData.description || (wizardData.category !== 'عطور' && wizardData.colors.length === 0) || wizardData.sizes.length === 0}
                    className="flex-1 px-6 py-3 bg-gold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors shadow-lg shadow-gold/20"
                  >
                    إضافة المنتج
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STATS TAB ─── */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-beige/50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center"><Package className="w-5 h-5 text-gold" /></div><span className="text-sm text-warm-gray">إجمالي المنتجات</span></div>
              <p className="text-3xl font-bold text-charcoal">{totalProducts}</p>
            </div>
            <div className="bg-white rounded-2xl border border-beige/50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-rose/50 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-charcoal" /></div><span className="text-sm text-warm-gray">منتجات بتخفيض</span></div>
              <p className="text-3xl font-bold text-charcoal">{totalDiscounts}</p>
            </div>
            <div className="bg-white rounded-2xl border border-beige/50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-gold" /></div><span className="text-sm text-warm-gray">منتجات جديدة</span></div>
              <p className="text-3xl font-bold text-charcoal">{totalNew}</p>
            </div>
            <div className="bg-white rounded-2xl border border-beige/50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-beige/50 flex items-center justify-center"><Star className="w-5 h-5 text-charcoal" /></div><span className="text-sm text-warm-gray">التصنيفات</span></div>
              <p className="text-3xl font-bold text-charcoal">{categories.length}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 bg-white rounded-2xl border border-beige/50 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-charcoal mb-4">توزيع المنتجات حسب الفئة</h3>
              <div className="space-y-3">
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category === cat).length
                  const percent = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-charcoal">{cat}</span><span className="text-sm text-warm-gray">{count} منتج ({percent}%)</span></div>
                      <div className="h-2 rounded-full bg-cream overflow-hidden"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${percent}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Add Discount Modal ─── */}
      {discountModal.open && discountModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center"><Percent className="w-5 h-5 text-gold" /></div>
              <div><h3 className="text-lg font-bold text-charcoal">إضافة تخفيض</h3><p className="text-sm text-warm-gray">{discountModal.product.name}</p></div>
            </div>
            <div className="bg-cream rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2"><span className="text-sm text-warm-gray">السعر الحالي</span><span className="font-bold text-charcoal">{discountModal.product.price} د.ل</span></div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-charcoal mb-2">السعر الجديد بعد التخفيض</label>
              <input type="number" value={newDiscountPrice} onChange={(e) => setNewDiscountPrice(e.target.value)} placeholder="أدخل السعر المخفض" className="w-full px-4 py-3 rounded-xl bg-cream border border-beige focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/10" />
              {newDiscountPrice && Number(newDiscountPrice) >= discountModal.product.price && (
                <p className="text-xs text-red-500 mt-1">السعر الجديد يجب أن يكون أقل من {discountModal.product.price} د.ل</p>
              )}
              {newDiscountPrice && Number(newDiscountPrice) > 0 && Number(newDiscountPrice) < discountModal.product.price && (
                <p className="text-xs text-green-600 mt-1">نسبة الخصم: {Math.round(((discountModal.product.price - Number(newDiscountPrice)) / discountModal.product.price) * 100)}%</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddDiscount} disabled={!newDiscountPrice || Number(newDiscountPrice) <= 0 || Number(newDiscountPrice) >= discountModal.product.price} className="flex-1 py-3 bg-gold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors">تأكيد التخفيض</button>
              <button onClick={() => { setDiscountModal({ open: false, product: null }); setNewDiscountPrice('') }} className="flex-1 py-3 bg-beige hover:bg-sand text-charcoal rounded-xl font-semibold transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Remove Discount Confirmation Modal ─── */}
      {removeDiscountModal.open && removeDiscountModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
              <div><h3 className="text-lg font-bold text-charcoal">إزالة التخفيض</h3><p className="text-sm text-warm-gray">{removeDiscountModal.product.name}</p></div>
            </div>
            <div className="bg-cream rounded-xl p-4 mb-5">
              <p className="text-sm text-charcoal mb-2">سيتم:</p>
              <ul className="space-y-1 text-sm text-warm-gray">
                <li>• استعادة السعر الأصلي: <span className="font-bold text-charcoal">{removeDiscountModal.product.oldPrice} د.ل</span></li>
                <li>• إلغاء السعر المخفض: <span className="font-bold text-charcoal">{removeDiscountModal.product.price} د.ل</span></li>
                <li>• إزالة وسم التخفيض</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button onClick={handleRemoveDiscount} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors">نعم، إزالة التخفيض</button>
              <button onClick={() => setRemoveDiscountModal({ open: false, product: null })} className="flex-1 py-3 bg-beige hover:bg-sand text-charcoal rounded-xl font-semibold transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Package, Truck, Shield } from 'lucide-react'
import { getProductById } from '@/lib/products'
import ProductSlider from '@/components/ProductSlider'
import WhatsAppButton from '@/components/WhatsAppButton'
import ProductCard from '@/components/ProductCard'
import { products } from '@/lib/products'

interface ProductPageProps {
  params: { id: string }
}

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }))
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductById(params.id)

  if (!product) {
    notFound()
  }

  const hasDiscount = product.oldPrice && product.oldPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)
    : 0

  const isPerfume = product.category === 'عطور'
  const isShoes = product.category === 'أحذية'
  const isClothes = product.category === 'ملابس نسائية'

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-beige/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-warm-gray hover:text-gold transition-colors">
              الرئيسية
            </Link>
            <ArrowRight className="w-4 h-4 text-warm-gray" />
            <Link
              href={
                isClothes ? '/clothes' : isPerfume ? '/perfumes' : '/shoes'
              }
              className="text-warm-gray hover:text-gold transition-colors"
            >
              {product.category}
            </Link>
            <ArrowRight className="w-4 h-4 text-warm-gray" />
            <span className="text-charcoal font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div>
            <ProductSlider images={product.images} productName={product.name} />
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Tags */}
            <div className="flex gap-2 mb-4">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    tag === 'جديد'
                      ? 'bg-gold text-white'
                      : 'bg-rose text-charcoal'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal mb-3">
              {product.name}
            </h1>

            <p className="text-sm text-gold font-medium mb-4">{product.category}</p>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-charcoal">
                {product.price} د.ل
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-warm-gray line-through">
                    {product.oldPrice} د.ل
                  </span>
                  <span className="px-3 py-1 rounded-full bg-rose text-charcoal text-sm font-bold">
                    خصم {discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-charcoal/70 leading-relaxed mb-8 text-base">
              {product.description}
            </p>

            {/* Colors — only for clothes and shoes */}
            {!isPerfume && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-charcoal mb-3">
                  {isShoes ? 'الألوان المتوفرة' : 'الألوان المتوفرة'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <div
                      key={color}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cream border border-beige"
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-beige shadow-sm"
                        style={{
                          backgroundColor:
                            color === 'أسود'
                              ? '#1a1a1a'
                              : color === 'أبيض'
                              ? '#ffffff'
                              : color === 'بيج'
                              ? '#E8DFD0'
                              : color === 'ذهبي'
                              ? '#C9A96E'
                              : color === 'وردي'
                              ? '#F5E6E0'
                              : color === 'وردي فاتح'
                              ? '#FDF2F0'
                              : color === 'رمادي'
                              ? '#9CA3AF'
                              : color === 'نيلي'
                              ? '#1e3a5f'
                              : color === 'أحمر'
                              ? '#DC2626'
                              : color === 'بني'
                              ? '#8B4513'
                              : color === 'أزرق فاتح'
                              ? '#93C5FD'
                              : color === 'أزرق غامق'
                              ? '#1E40AF'
                              : color === 'أخضر زيتوني'
                              ? '#6B7C3E'
                              : color === 'كريمي'
                              ? '#FFFDD0'
                              : '#D1D5DB',
                        }}
                      />
                      <span className="text-sm text-charcoal">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-charcoal mb-3">
                {isPerfume ? 'أحجام العبوة المتوفرة' : isShoes ? 'المقاسات المتوفرة' : 'المقاسات المتوفرة'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <span
                    key={size}
                    className="px-4 py-2 rounded-xl bg-cream border border-beige text-sm font-medium text-charcoal"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="mb-8">
              <WhatsAppButton productName={product.name} productPrice={product.price} />
            </div>

            {/* Info badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-cream border border-beige/50">
                <Package className="w-5 h-5 text-gold shrink-0" />
                <div>
                  <p className="text-sm font-medium text-charcoal">منتج أصلي</p>
                  <p className="text-xs text-warm-gray">جودة مضمونة 100%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-cream border border-beige/50">
                <Shield className="w-5 h-5 text-gold shrink-0" />
                <div>
                  <p className="text-sm font-medium text-charcoal">استبدال سهل</p>
                  <p className="text-xs text-warm-gray">خلال 14 يوم</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-white border-t border-beige/50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-charcoal mb-8">منتجات مشابهة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

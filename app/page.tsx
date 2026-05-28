import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Sparkles, Tag, Shirt, Droplets, Footprints, Phone } from 'lucide-react'
import HeroBanner from '@/components/HeroBanner'
import SectionTitle from '@/components/SectionTitle'
import ProductCard from '@/components/ProductCard'
import { getNewProducts, getDiscountedProducts } from '@/lib/products'

const categories = [
  {
    name: 'ملابس نسائية',
    href: '/clothes',
    icon: Shirt,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=800&fit=crop',
    count: 6,
  },
  {
    name: 'عطور',
    href: '/perfumes',
    icon: Droplets,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&h=800&fit=crop',
    count: 5,
  },
  {
    name: 'أحذية',
    href: '/shoes',
    icon: Footprints,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=800&fit=crop',
    count: 5,
  },
]

export default function HomePage() {
  const newProducts = getNewProducts().slice(0, 4)
  const discountedProducts = getDiscountedProducts().slice(0, 4)

  return (
    <div>
      {/* Hero */}
      <HeroBanner />

      {/* Categories */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title="تصنيفاتنا الرئيسية" subtitle="اكتشفي المزيد" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-lg"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
              <div className="absolute bottom-0 right-0 left-0 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gold/20 backdrop-blur-sm flex items-center justify-center">
                    <cat.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                    <p className="text-sm text-white/70">{cat.count} منتجات</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gold text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                  <span>تصفحي التشكيلة</span>
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <SectionTitle title="وصل حديثاً" subtitle="الجديد" centered={false} className="mb-0" />
            <Link
              href="/offers"
              className="hidden sm:inline-flex items-center gap-2 text-gold hover:text-gold-dark font-medium transition-colors"
            >
              عرضي الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/offers"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-dark font-medium"
            >
              عرضي الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Discounts */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <SectionTitle title="تخفيضات خاصة" subtitle="لا تفوتي الفرصة" centered={false} className="mb-0" />
          <Link
            href="/offers"
            className="hidden sm:inline-flex items-center gap-2 text-gold hover:text-gold-dark font-medium transition-colors"
          >
            عرضي الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {discountedProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 text-gold hover:text-gold-dark font-medium"
          >
            عرضي الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features Banner */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">جودة فاخرة</h3>
              <p className="text-white/60">نختار لكِ أفضل المنتجات من أجود الخامات والأقمشة</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">أسعار مميزة</h3>
              <p className="text-white/60">تخفيضات مستمرة وعروض حصرية على تشكيلة واسعة</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تواصل سهل</h3>
              <p className="text-white/60">تواصلي معنا مباشرة عبر واتساب للاستفسار والتوصية</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { SignJWT, jwtVerify } from 'jose'
import fs from 'fs'
import path from 'path'
import { Product } from '@/types'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
const PRODUCTS_PATH = path.join(process.cwd(), 'data', 'products.json')
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

// ─── AUTH ───

export async function login(formData: FormData) {
  const password = formData.get('password') as string
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return { error: 'لم يتم إعداد كلمة المرور. تحقق من ملف .env.local' }
  }

  if (password !== adminPassword) {
    return { error: 'كلمة المرور غير صحيحة' }
  }

  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(JWT_SECRET)

  cookies().set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  redirect('/admin')
}

export async function logout() {
  cookies().delete('admin_session')
  redirect('/admin/login')
}

// ─── FILE UPLOAD ───

export async function uploadImage(formData: FormData) {
  const file = formData.get('image') as File
  if (!file) return { error: 'لم يتم اختيار ملف' }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'نوع الملف غير مدعوم. استخدم JPG, PNG, أو WebP' }
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' }
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`
  const filepath = path.join(UPLOADS_DIR, filename)

  // Save file
  const bytes = await file.arrayBuffer()
  fs.writeFileSync(filepath, Buffer.from(bytes))

  // Return public URL
  const publicUrl = `/uploads/${filename}`
  return { success: true, url: publicUrl }
}

// ─── PRODUCTS CRUD ───

function readProducts(): Product[] {
  const data = fs.readFileSync(PRODUCTS_PATH, 'utf-8')
  return JSON.parse(data)
}

function writeProducts(products: Product[]) {
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf-8')
}

export async function getAllProducts(): Promise<Product[]> {
  return readProducts()
}

function parseArrayField(value: string | null): string[] {
  if (!value) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export async function addProduct(formData: FormData) {
  const products = readProducts()

  const newProduct: Product = {
    id: Date.now().toString(),
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    price: Number(formData.get('price')),
    oldPrice: formData.get('oldPrice') ? Number(formData.get('oldPrice')) : undefined,
    description: formData.get('description') as string,
    colors: parseArrayField(formData.get('colors') as string),
    sizes: parseArrayField(formData.get('sizes') as string),
    images: parseArrayField(formData.get('images') as string),
    tags: parseArrayField(formData.get('tags') as string),
  }

  products.push(newProduct)
  writeProducts(products)
  revalidatePath('/')
  revalidatePath('/clothes')
  revalidatePath('/perfumes')
  revalidatePath('/shoes')
  revalidatePath('/offers')
  revalidatePath('/admin')

  return { success: true, product: newProduct }
}

export async function updateProduct(id: string, formData: FormData) {
  const products = readProducts()
  const index = products.findIndex((p) => p.id === id)

  if (index === -1) {
    return { error: 'المنتج غير موجود' }
  }

  products[index] = {
    ...products[index],
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    price: Number(formData.get('price')),
    oldPrice: formData.get('oldPrice') ? Number(formData.get('oldPrice')) : undefined,
    description: formData.get('description') as string,
    colors: parseArrayField(formData.get('colors') as string),
    sizes: parseArrayField(formData.get('sizes') as string),
    images: parseArrayField(formData.get('images') as string),
    tags: parseArrayField(formData.get('tags') as string),
  }

  writeProducts(products)
  revalidatePath('/')
  revalidatePath('/clothes')
  revalidatePath('/perfumes')
  revalidatePath('/shoes')
  revalidatePath('/offers')
  revalidatePath('/admin')
  revalidatePath(`/product/${id}`)

  return { success: true }
}

export async function deleteProduct(id: string) {
  const products = readProducts()
  const filtered = products.filter((p) => p.id !== id)

  if (filtered.length === products.length) {
    return { error: 'المنتج غير موجود' }
  }

  writeProducts(filtered)
  revalidatePath('/')
  revalidatePath('/clothes')
  revalidatePath('/perfumes')
  revalidatePath('/shoes')
  revalidatePath('/offers')
  revalidatePath('/admin')

  return { success: true }
}

// ─── DISCOUNT: enter NEW (discounted) price ───

export async function addDiscount(id: string, newPrice: number) {
  const products = readProducts()
  const index = products.findIndex((p) => p.id === id)

  if (index === -1) {
    return { error: 'المنتج غير موجود' }
  }

  const currentPrice = products[index].price

  if (newPrice >= currentPrice) {
    return { error: 'السعر الجديد يجب أن يكون أقل من السعر الحالي' }
  }

  products[index].oldPrice = currentPrice
  products[index].price = newPrice

  if (!products[index].tags.includes('تخفيض')) {
    products[index].tags.push('تخفيض')
  }

  writeProducts(products)
  revalidatePath('/')
  revalidatePath('/offers')
  revalidatePath('/admin')
  revalidatePath(`/product/${id}`)

  return { success: true }
}

export async function removeDiscount(id: string) {
  const products = readProducts()
  const index = products.findIndex((p) => p.id === id)

  if (index === -1) {
    return { error: 'المنتج غير موجود' }
  }

  if (products[index].oldPrice) {
    products[index].price = products[index].oldPrice!
  }
  delete products[index].oldPrice
  products[index].tags = products[index].tags.filter((t) => t !== 'تخفيض')

  writeProducts(products)
  revalidatePath('/')
  revalidatePath('/offers')
  revalidatePath('/admin')
  revalidatePath(`/product/${id}`)

  return { success: true }
}

export async function toggleNewTag(id: string) {
  const products = readProducts()
  const index = products.findIndex((p) => p.id === id)

  if (index === -1) {
    return { error: 'المنتج غير موجود' }
  }

  const hasNew = products[index].tags.includes('جديد')
  if (hasNew) {
    products[index].tags = products[index].tags.filter((t) => t !== 'جديد')
  } else {
    products[index].tags.push('جديد')
  }

  writeProducts(products)
  revalidatePath('/')
  revalidatePath('/offers')
  revalidatePath('/admin')
  revalidatePath(`/product/${id}`)

  return { success: true, isNew: !hasNew }
}

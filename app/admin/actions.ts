'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { SignJWT, jwtVerify } from 'jose'
import fs from 'fs'
import path from 'path'
import { Product } from '@/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-this-immediately'
)

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json')
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads')

if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  } catch (e) {
    console.error('Failed to create uploads dir:', e)
  }
}

async function verifyAdmin() {
  const token = cookies().get('admin_session')?.value
  if (!token) throw new Error('Unauthorized')
  try {
    await jwtVerify(token, JWT_SECRET)
  } catch {
    cookies().delete('admin_session')
    throw new Error('Session expired')
  }
}

function readProducts(): Product[] {
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'))
  } catch {
    return []
  }
}

function writeProducts(products: Product[]) {
  const dir = path.dirname(PRODUCTS_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf-8')
}

function parseArrayField(value: string | null): string[] {
  if (!value) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/clothes')
  revalidatePath('/perfumes')
  revalidatePath('/shoes')
  revalidatePath('/offers')
  revalidatePath('/admin')
}

export async function login(formData: FormData) {
  const password = formData.get('password') as string
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return { error: 'ADMIN_PASSWORD not set in Railway variables' }
  if (password !== adminPassword) return { error: 'Wrong password' }

  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(JWT_SECRET)

  cookies().set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  redirect('/admin')
}

export async function logout() {
  cookies().delete('admin_session')
  redirect('/admin/login')
}

export async function getAllProducts(): Promise<Product[]> {
  await verifyAdmin()
  return readProducts()
}

export async function getPublicProducts(): Promise<Product[]> {
  return readProducts()
}

export async function uploadImage(formData: FormData) {
  await verifyAdmin()
  const file = formData.get('image') as File
  if (!file) return { error: 'No file selected' }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowed.includes(file.type)) return { error: 'Use JPG, PNG, or WebP' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Max 5MB' }

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`
  const filepath = path.join(UPLOADS_DIR, filename)

  try {
    fs.writeFileSync(filepath, Buffer.from(await file.arrayBuffer()))
    return { success: true, url: `/uploads/${filename}` }
  } catch {
    return { error: 'Upload failed' }
  }
}

export async function addProduct(formData: FormData) {
  await verifyAdmin()
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
  revalidateAll()
  return { success: true, product: newProduct }
}

export async function updateProduct(id: string, formData: FormData) {
  await verifyAdmin()
  const products = readProducts()
  const i = products.findIndex((p) => p.id === id)
  if (i === -1) return { error: 'Product not found' }

  products[i] = {
    ...products[i],
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
  revalidateAll()
  revalidatePath(`/product/${id}`)
  return { success: true }
}

export async function deleteProduct(id: string) {
  await verifyAdmin()
  const products = readProducts()
  const filtered = products.filter((p) => p.id !== id)
  if (filtered.length === products.length) return { error: 'Not found' }
  writeProducts(filtered)
  revalidateAll()
  return { success: true }
}

export async function addDiscount(id: string, newPrice: number) {
  await verifyAdmin()
  const products = readProducts()
  const i = products.findIndex((p) => p.id === id)
  if (i === -1) return { error: 'Not found' }
  if (newPrice >= products[i].price) return { error: 'New price must be lower' }

  products[i].oldPrice = products[i].price
  products[i].price = newPrice
  if (!products[i].tags.includes('تخفيض')) products[i].tags.push('تخفيض')
  writeProducts(products)
  revalidateAll()
  return { success: true }
}

export async function removeDiscount(id: string) {
  await verifyAdmin()
  const products = readProducts()
  const i = products.findIndex((p) => p.id === id)
  if (i === -1) return { error: 'Not found' }

  if (products[i].oldPrice) products[i].price = products[i].oldPrice!
  delete products[i].oldPrice
  products[i].tags = products[i].tags.filter((t) => t !== 'تخفيض')
  writeProducts(products)
  revalidateAll()
  return { success: true }
}

export async function toggleNewTag(id: string) {
  await verifyAdmin()
  const products = readProducts()
  const i = products.findIndex((p) => p.id === id)
  if (i === -1) return { error: 'Not found' }

  const hasNew = products[i].tags.includes('جديد')
  if (hasNew) {
    products[i].tags = products[i].tags.filter((t) => t !== 'جديد')
  } else {
    products[i].tags.push('جديد')
  }
  writeProducts(products)
  revalidateAll()
  return { success: true, isNew: !hasNew }
}
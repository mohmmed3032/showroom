'use client'

import { Phone } from 'lucide-react'

interface WhatsAppButtonProps {
  productName: string
  productPrice: number
}

export default function WhatsAppButton({ productName, productPrice }: WhatsAppButtonProps) {
  const message = `مرحباً، أنا مهتمة بمنتج: ${productName} (السعر: ${productPrice} د.ل) - هل يمكنني معرفة المزيد من التفاصيل؟`
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/218945239468?text=${encodedMessage}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30"
    >
      <Phone className="w-5 h-5" />
      <span>تواصلي عبر واتساب للاستفسار</span>
    </a>
  )
}

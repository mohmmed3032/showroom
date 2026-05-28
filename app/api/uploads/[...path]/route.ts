import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads')

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePath = path.join(UPLOADS_DIR, ...params.path)
  const resolvedUploads = path.resolve(UPLOADS_DIR)
  const resolvedFile = path.resolve(filePath)

  if (!resolvedFile.startsWith(resolvedUploads)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const buffer = fs.readFileSync(resolvedFile)
    const ext = path.extname(resolvedFile).toLowerCase()
    const contentType =
      ext === '.png' ? 'image/png'
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : ext === '.webp' ? 'image/webp'
      : 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
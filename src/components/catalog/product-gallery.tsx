'use client'

import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { cn } from '@/lib/utils'

interface GalleryImage {
  id: string
  url: string
  alt: string
  width: number | null
  height: number | null
}

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [activeId, setActiveId] = useState(images[0]?.id ?? null)
  const active = images.find((image) => image.id === activeId) ?? images[0]

  if (!active) {
    return (
      <div className="grid aspect-square place-items-center rounded-2xl border border-border bg-secondary text-muted-foreground">
        <ImageIcon className="size-10" aria-hidden="true" />
        <span className="sr-only">No product image available</span>
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
        <Image
          src={active.url}
          alt={active.alt}
          fill
          unoptimized
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label={`${name} images`}>
          {images.map((image) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveId(image.id)}
                aria-pressed={image.id === active.id}
                aria-label={`Show image: ${image.alt}`}
                className={cn(
                  'relative block aspect-square w-full overflow-hidden rounded-lg border bg-secondary',
                  image.id === active.id
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-border hover:border-accent/60',
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  unoptimized
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

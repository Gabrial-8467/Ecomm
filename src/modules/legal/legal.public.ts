import type { LegalDocumentType, LegalReviewStatus } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'

export interface PublicLegalVersion {
  version: string
  content: string
  effectiveAt: Date
  publishedAt: Date
  legalReviewStatus: LegalReviewStatus
}

export interface PublicLegalDocument {
  slug: string
  title: string
  type: LegalDocumentType
  requiresConsent: boolean
  /** The latest version that is published and currently effective, if any. */
  inForce: PublicLegalVersion | null
  /** Effective date of the next published version, when it is still in the future. */
  scheduledFor: Date | null
}

function pickInForce(
  versions: Array<{
    version: string
    content: string
    effectiveAt: Date
    publishedAt: Date | null
    legalReviewStatus: LegalReviewStatus
  }>,
  now: Date,
): { inForce: PublicLegalVersion | null; scheduledFor: Date | null } {
  const published = versions.filter(
    (version): version is PublicLegalVersion =>
      version.publishedAt !== null && version.effectiveAt <= now,
  )
  const scheduled = versions.find(
    (version) => version.publishedAt !== null && version.effectiveAt > now,
  )

  return { inForce: published[0] ?? null, scheduledFor: scheduled?.effectiveAt ?? null }
}

/**
 * Legal documents are only shown to customers once counsel has reviewed and
 * published a version. Draft versions never leak into the storefront.
 */
export async function listPublicLegalDocuments(): Promise<PublicLegalDocument[]> {
  const now = new Date()
  const documents = await prisma.legalDocument.findMany({
    where: { isActive: true },
    orderBy: [{ type: 'asc' }, { title: 'asc' }],
    include: {
      versions: {
        where: { status: 'PUBLISHED' },
        orderBy: { effectiveAt: 'desc' },
      },
    },
  })

  return documents.map((document) => ({
    slug: document.slug,
    title: document.title,
    type: document.type,
    requiresConsent: document.requiresConsent,
    ...pickInForce(document.versions, now),
  }))
}

export async function getPublicLegalDocument(slug: string): Promise<PublicLegalDocument | null> {
  const now = new Date()
  const document = await prisma.legalDocument.findFirst({
    where: { slug, isActive: true },
    include: {
      versions: {
        where: { status: 'PUBLISHED' },
        orderBy: { effectiveAt: 'desc' },
      },
    },
  })

  if (!document) return null

  return {
    slug: document.slug,
    title: document.title,
    type: document.type,
    requiresConsent: document.requiresConsent,
    ...pickInForce(document.versions, now),
  }
}

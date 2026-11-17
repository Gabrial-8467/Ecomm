import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

async function listActiveBanners(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    sendSuccess(res, banners);
  } catch (error) {
    next(error);
  }
}

async function listAllBanners(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
    sendSuccess(res, banners);
  } catch (error) {
    next(error);
  }
}

async function createBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, subtitle, imageUrl, linkUrl, position, isActive, sortOrder } = req.body;
    if (!title || !imageUrl) {
      throw new BadRequestError('Banner title and image URL are required');
    }

    const banner = await prisma.banner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl?.trim() || '/products',
        position: position?.trim() || 'hero',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    sendCreated(res, banner, 'Banner created successfully');
  } catch (error) {
    next(error);
  }
}

async function updateBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const { title, subtitle, imageUrl, linkUrl, position, isActive, sortOrder } = req.body;

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Banner not found');
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(subtitle !== undefined && { subtitle: subtitle?.trim() || null }),
        ...(imageUrl && { imageUrl: imageUrl.trim() }),
        ...(linkUrl !== undefined && { linkUrl: linkUrl?.trim() || null }),
        ...(position && { position: position.trim() }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    sendSuccess(res, banner, 'Banner updated successfully');
  } catch (error) {
    next(error);
  }
}

async function deleteBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Banner not found');
    }

    await prisma.banner.delete({ where: { id } });
    sendSuccess(res, null, 'Banner deleted successfully');
  } catch (error) {
    next(error);
  }
}

export const adminBannerRoutes = Router();

adminBannerRoutes.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), listAllBanners);
adminBannerRoutes.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), createBanner);
adminBannerRoutes.put('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), updateBanner);
adminBannerRoutes.delete('/:id', requireAuth, requireRole('ADMIN'), deleteBanner);

export const storefrontBannerRoutes = Router();

storefrontBannerRoutes.get('/', listActiveBanners);

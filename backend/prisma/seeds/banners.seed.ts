import { PrismaClient } from '@prisma/client';

export async function seedBanners(prisma: PrismaClient) {
  console.log('🖼️  Seeding Promotional Banners...');

  await prisma.banner.deleteMany({});

  const banners = [
    {
      title: 'Festival Living Collection',
      subtitle: 'Up to 30% off on Solid Wood Wardrobes & Recliners',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80',
      linkUrl: '/products?category=living-room',
      position: 'HERO',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'Smart Cooling & Appliances',
      subtitle: 'Latest Inverter ACs and Refrigerators with Free Local Delivery',
      imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1600&q=80',
      linkUrl: '/products?category=home-appliances',
      position: 'HERO',
      sortOrder: 2,
      isActive: true,
    },
    {
      title: 'Cinematic Home Entertainment',
      subtitle: 'Experience Bravia XR 4K OLED Displays & Dolby Atmos Soundbars',
      imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=80',
      linkUrl: '/products?category=televisions',
      position: 'HERO',
      sortOrder: 3,
      isActive: true,
    },
  ];

  await prisma.banner.createMany({
    data: banners,
  });
}

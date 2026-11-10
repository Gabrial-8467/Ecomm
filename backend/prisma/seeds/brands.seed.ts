import { PrismaClient, Brand } from '@prisma/client';

export async function seedBrands(prisma: PrismaClient): Promise<Record<string, Brand>> {
  console.log('🏷️  Seeding Brands...');

  const brandData = [
    {
      name: 'UrbanTeak Studio',
      slug: 'urban-teak',
      description: 'Handcrafted solid Sheesham and Teak wood furniture',
      logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'Samsung',
      slug: 'samsung',
      description: 'Global leader in consumer electronics and digital home appliances',
      logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'LG Electronics',
      slug: 'lg',
      description: 'Life is Good with innovative smart cooling and appliances',
      logo: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'Godrej Interio',
      slug: 'godrej-interio',
      description: 'India’s largest furniture and security storage brand',
    },
    {
      name: 'Sony',
      slug: 'sony',
      description: 'Japanese pioneer in premium Bravia XR displays and high-fidelity audio',
    },
    {
      name: 'Whirlpool',
      slug: 'whirlpool',
      description: 'American multinational home appliances and refrigeration leader',
    },
    {
      name: 'Daikin',
      slug: 'daikin',
      description: 'Global Japanese specialist in energy-efficient inverter air conditioning',
    },
    {
      name: 'Royal Oak Luxury',
      slug: 'royal-oak',
      description: 'Designer international upholstery, recliners, and lounge furnishings',
    },
    {
      name: 'Sleepwell',
      slug: 'sleepwell',
      description: 'India’s top orthopaedic foam and pocket spring mattress brand',
    },
  ];

  const brands: Record<string, Brand> = {};

  for (const item of brandData) {
    const brand = await prisma.brand.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        logo: item.logo,
      },
      create: item,
    });
    brands[item.slug] = brand;
  }

  return brands;
}

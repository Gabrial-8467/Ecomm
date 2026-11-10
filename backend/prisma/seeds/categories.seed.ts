import { PrismaClient, Category } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient): Promise<Record<string, Category>> {
  console.log('📁 Seeding Product Categories...');

  const categoryData = [
    {
      name: 'Living Room Furniture',
      slug: 'living-room',
      description: 'Sofas, coffee tables, TV units, and recliners designed for modern living',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      sortOrder: 1,
    },
    {
      name: 'Bedroom & Storage',
      slug: 'bedroom',
      description: 'Solid wood beds, wardrobes, almirahs and dressing tables',
      image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=800&q=80',
      sortOrder: 2,
    },
    {
      name: 'Office & Study',
      slug: 'office',
      description: 'Ergonomic chairs, study desks, and modular storage',
      image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
      sortOrder: 3,
    },
    {
      name: 'Home Appliances',
      slug: 'home-appliances',
      description: 'Refrigerators, washing machines, microwaves and ACs with full manufacturer warranty',
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
      sortOrder: 4,
    },
    {
      name: 'Televisions & Audio',
      slug: 'televisions',
      description: 'Smart 4K UHD TVs, OLEDs, and home theatre soundbars',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
      sortOrder: 5,
    },
    {
      name: 'Dining Room',
      slug: 'dining-room',
      description: 'Solid teak dining tables, 6-seater sets, and buffet sideboards',
      image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
      sortOrder: 6,
    },
  ];

  const categories: Record<string, Category> = {};

  for (const item of categoryData) {
    const category = await prisma.category.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        image: item.image,
        sortOrder: item.sortOrder,
      },
      create: item,
    });
    categories[item.slug] = category;
  }

  return categories;
}

import { PrismaClient } from '@prisma/client';
import { seedUsers } from './users.seed.js';
import { seedDeliveryZones } from './delivery-zones.seed.js';
import { seedCategories } from './categories.seed.js';
import { seedBrands } from './brands.seed.js';
import { seedProducts } from './products.seed.js';
import { seedCoupons } from './coupons.seed.js';
import { seedBanners } from './banners.seed.js';

export async function runAllSeeds(existingPrisma?: PrismaClient) {
  const prisma = existingPrisma || new PrismaClient();
  const startTime = Date.now();

  console.log('====================================================');
  console.log('🌱 Starting Modular Showroom Catalog Database Seeding');
  console.log('====================================================');

  try {
    // 1. Seed Users (Admin, Staff, Customer) & Addresses
    await seedUsers(prisma);

    // 2. Seed Delivery Zones (Local Tri-City & NCR Zones)
    await seedDeliveryZones(prisma);

    // 3. Seed Categories
    const categories = await seedCategories(prisma);

    // 4. Seed Brands
    const brands = await seedBrands(prisma);

    // 5. Seed Detailed Products, Variants & Inventory
    await seedProducts(prisma, { categories, brands });

    // 6. Seed Discount Coupons
    await seedCoupons(prisma);

    // 7. Seed Storefront Hero & Promotional Banners
    await seedBanners(prisma);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('====================================================');
    console.log(`✅ All seeders executed successfully in ${elapsed}s!`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Error executing database seeders:', error);
    throw error;
  } finally {
    if (!existingPrisma) {
      await prisma.$disconnect();
    }
  }
}

// Allow direct execution: `npx tsx prisma/seeds/index.ts`
if (process.argv[1]?.endsWith('seeds/index.ts') || process.argv[1]?.endsWith('seeds/index.js')) {
  runAllSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

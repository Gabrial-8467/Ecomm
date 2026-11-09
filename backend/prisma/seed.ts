import { PrismaClient, DepartmentType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Apex Retailers...');

  // 1. Seed Business Settings
  await prisma.businessSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      businessName: 'Apex Retailers',
      legalEntity: 'Apex Retail Enterprises LLP',
      gstin: '07AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      addressLine1: 'Shop No. 12-14, Commercial Plaza, MG Road',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
      supportPhone: '+91 11 2345 6789',
      supportEmail: 'support@apexretailers.in',
      grievanceOfficerName: 'Grievance Redressal Officer',
      grievanceEmail: 'grievance@apexretailers.in',
      grievancePhone: '+91 11 2345 6780',
    },
  });

  // 2. Seed Admin User
  const adminPassword = await bcrypt.hash('Admin@12345', 10);
  const adminUser = await prisma.user.upsert({
    where: { phoneNumber: '+919999999999' },
    update: {},
    create: {
      email: 'admin@apexretailers.in',
      phoneNumber: '+919999999999',
      passwordHash: adminPassword,
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
      isPhoneVerified: true,
      adminProfile: {
        create: {
          fullName: 'Rajesh Sharma (Owner)',
          designation: 'Business Owner & Shopkeeper',
          permissions: ['ALL'],
        },
      },
    },
  });

  console.log(`👤 Created/Verified Owner Admin: ${adminUser.email}`);

  // 3. Seed Root Categories
  const categoriesData = [
    // Furniture
    { name: 'Living Room Furniture', slug: 'living-room-furniture', department: DepartmentType.FURNITURE },
    { name: 'Bedroom Furniture', slug: 'bedroom-furniture', department: DepartmentType.FURNITURE },
    { name: 'Dining Room Furniture', slug: 'dining-room-furniture', department: DepartmentType.FURNITURE },
    { name: 'Office Furniture', slug: 'office-furniture', department: DepartmentType.FURNITURE },
    // Electronics
    { name: 'Televisions & Home Audio', slug: 'televisions-home-audio', department: DepartmentType.ELECTRONICS },
    { name: 'Refrigerators', slug: 'refrigerators', department: DepartmentType.ELECTRONICS },
    { name: 'Washing Machines', slug: 'washing-machines', department: DepartmentType.ELECTRONICS },
    { name: 'Air Conditioners', slug: 'air-conditioners', department: DepartmentType.ELECTRONICS },
    // Mobiles
    { name: 'Smartphones', slug: 'smartphones', department: DepartmentType.MOBILES_ACCESSORIES },
    { name: 'Feature Phones', slug: 'feature-phones', department: DepartmentType.MOBILES_ACCESSORIES },
    { name: 'Mobile Accessories', slug: 'mobile-accessories', department: DepartmentType.MOBILES_ACCESSORIES },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 4. Seed Brands
  const brandsData = [
    { name: 'Apex Crafts', slug: 'apex-crafts', description: 'Handcrafted solid wood in-house retail furniture' },
    { name: 'Sony', slug: 'sony', description: 'Japanese electronics & BRAVIA televisions' },
    { name: 'LG', slug: 'lg', description: 'Life’s Good home appliances and smart electronics' },
    { name: 'Samsung', slug: 'samsung', description: 'Flagship mobile devices and high-end electronics' },
    { name: 'Apple', slug: 'apple', description: 'iPhones, AirPods, and official chargers' },
    { name: 'OnePlus', slug: 'oneplus', description: 'High-speed smartphones and accessories' },
  ];

  for (const b of brandsData) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
  }

  console.log('✅ Base seed data completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

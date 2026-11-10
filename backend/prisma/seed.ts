import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Users (Admin, Staff, Customer)
  const adminSalt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@12345', adminSalt);
  const staffPassword = await bcrypt.hash('Staff@12345', adminSalt);
  const customerPassword = await bcrypt.hash('Customer@12345', adminSalt);

  const admin = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      name: 'Store Administrator',
      phone: '+919876543210',
      email: 'admin@furniturestore.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {},
    create: {
      name: 'Store Staff Lead',
      phone: '+919876543211',
      email: 'staff@furniturestore.local',
      passwordHash: staffPassword,
      role: 'STAFF',
      status: 'ACTIVE',
    },
  });

  const customer = await prisma.user.upsert({
    where: { phone: '+919876543212' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      phone: '+919876543212',
      email: 'customer@example.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  // Seed customer default address
  await prisma.address.deleteMany({ where: { userId: customer.id } });
  await prisma.address.create({
    data: {
      userId: customer.id,
      fullName: 'Rahul Sharma',
      phone: '+919876543212',
      addressLine1: 'House No. 452, Phase 7',
      addressLine2: 'Sector 61',
      landmark: 'Near Rose Garden',
      city: 'Mohali',
      state: 'Punjab',
      pincode: '160062',
      isDefault: true,
    },
  });

  // 2. Seed Delivery Zones (Local Delivery)
  await prisma.deliveryZone.deleteMany({});
  const mohaliZone = await prisma.deliveryZone.create({
    data: {
      name: 'Mohali Core Zone',
      city: 'Mohali',
      state: 'Punjab',
      pincodes: ['160055', '160059', '160062', '160070', '160071', '140301'],
      deliveryCharge: 150.0,
      minimumOrder: 500.0,
      estimatedDays: 2,
      isActive: true,
    },
  });

  await prisma.deliveryZone.create({
    data: {
      name: 'Chandigarh Tri-City Zone',
      city: 'Chandigarh',
      state: 'Chandigarh',
      pincodes: ['160017', '160022', '160036', '160047'],
      deliveryCharge: 200.0,
      minimumOrder: 1000.0,
      estimatedDays: 3,
      isActive: true,
    },
  });

  // 3. Seed Categories
  const catLiving = await prisma.category.upsert({
    where: { slug: 'living-room' },
    update: {},
    create: {
      name: 'Living Room Furniture',
      slug: 'living-room',
      description: 'Sofas, coffee tables, TV units, and recliners designed for modern living',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      sortOrder: 1,
    },
  });

  const catBedroom = await prisma.category.upsert({
    where: { slug: 'bedroom' },
    update: {},
    create: {
      name: 'Bedroom & Storage',
      slug: 'bedroom',
      description: 'Solid wood beds, wardrobes, almirahs and dressing tables',
      image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=800&q=80',
      sortOrder: 2,
    },
  });

  const catOffice = await prisma.category.upsert({
    where: { slug: 'office' },
    update: {},
    create: {
      name: 'Office & Study',
      slug: 'office',
      description: 'Ergonomic chairs, study desks, and modular storage',
      image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
      sortOrder: 3,
    },
  });

  const catAppliances = await prisma.category.upsert({
    where: { slug: 'home-appliances' },
    update: {},
    create: {
      name: 'Home Appliances',
      slug: 'home-appliances',
      description: 'Refrigerators, washing machines, microwaves and ACs with full manufacturer warranty',
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
      sortOrder: 4,
    },
  });

  const catTV = await prisma.category.upsert({
    where: { slug: 'televisions' },
    update: {},
    create: {
      name: 'Televisions & Audio',
      slug: 'televisions',
      description: 'Smart 4K UHD TVs, OLEDs, and home theatre soundbars',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
      sortOrder: 5,
    },
  });

  // 4. Seed Brands
  const brandUrban = await prisma.brand.upsert({
    where: { slug: 'urban-teak' },
    update: {},
    create: {
      name: 'UrbanTeak Studio',
      slug: 'urban-teak',
      description: 'Handcrafted solid Sheesham and Teak wood furniture',
      logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80',
    },
  });

  const brandSamsung = await prisma.brand.upsert({
    where: { slug: 'samsung' },
    update: {},
    create: {
      name: 'Samsung',
      slug: 'samsung',
      description: 'Global leader in consumer electronics and digital home appliances',
      logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=200&q=80',
    },
  });

  const brandLG = await prisma.brand.upsert({
    where: { slug: 'lg' },
    update: {},
    create: {
      name: 'LG Electronics',
      slug: 'lg',
      description: 'Life is Good with innovative smart cooling and appliances',
      logo: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=200&q=80',
    },
  });

  const brandGodrej = await prisma.brand.upsert({
    where: { slug: 'godrej-interio' },
    update: {},
    create: {
      name: 'Godrej Interio',
      slug: 'godrej-interio',
      description: 'India’s largest furniture and security storage brand',
    },
  });

  // 5. Seed Products & Variants
  console.log('📦 Seeding Products & Inventory...');

  // Product 1: Wooden Almirah (Furniture)
  const almirah = await prisma.product.upsert({
    where: { slug: 'royal-3-door-wooden-almirah' },
    update: {},
    create: {
      name: 'Royal 3-Door Solid Wood Wardrobe Almirah',
      slug: 'royal-3-door-wooden-almirah',
      shortDescription: 'Spacious 3-door wardrobe with internal locker and mirror in rich walnut finish.',
      description: 'Crafted from premium engineered wood with scratch-resistant melamine coating. Features 3 wide compartments, 2 hanging rods, a safety locker with dual keys, and an integrated full-length vanity mirror.',
      categoryId: catBedroom.id,
      brandId: brandUrban.id,
      status: 'ACTIVE',
      isFeatured: true,
      isBestSeller: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
            altText: 'Royal 3-Door Wooden Wardrobe front view',
            isPrimary: true,
            sortOrder: 0,
          },
          {
            url: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=800&q=80',
            altText: 'Wardrobe open layout',
            isPrimary: false,
            sortOrder: 1,
          },
        ],
      },
      specifications: {
        create: [
          { groupName: 'Dimensions', name: 'Height', value: '78 inches (6.5 ft)' },
          { groupName: 'Dimensions', name: 'Width', value: '48 inches (4 ft)' },
          { groupName: 'Dimensions', name: 'Depth', value: '22 inches' },
          { groupName: 'Material', name: 'Primary Material', value: 'Engineered Wood + Teak Veneer' },
          { groupName: 'Features', name: 'Locking Mechanism', value: 'Dual Key Safety Locker' },
          { groupName: 'Features', name: 'Mirror', value: 'Integrated Full Length' },
          { groupName: 'Warranty', name: 'Warranty Period', value: '3 Years Comprehensive' },
        ],
      },
      variants: {
        create: [
          {
            name: 'Walnut Finish',
            sku: 'ALM-ROYAL-WALNUT-01',
            price: 24999.0,
            compareAtPrice: 29999.0,
            weight: 78.5,
            attributes: { Finish: 'Walnut', Doors: '3' },
            inventory: {
              create: {
                availableQuantity: 10,
                reservedQuantity: 0,
                lowStockThreshold: 3,
              },
            },
          },
          {
            name: 'Honey Teak Finish',
            sku: 'ALM-ROYAL-TEAK-02',
            price: 26499.0,
            compareAtPrice: 31999.0,
            weight: 78.5,
            attributes: { Finish: 'Honey Teak', Doors: '3' },
            inventory: {
              create: {
                availableQuantity: 6,
                reservedQuantity: 0,
                lowStockThreshold: 2,
              },
            },
          },
        ],
      },
    },
  });

  // Product 2: Ergonomic Office Chair
  const chair = await prisma.product.upsert({
    where: { slug: 'matrix-ergonomic-high-back-chair' },
    update: {},
    create: {
      name: 'Matrix Ergonomic High-Back Executive Office Chair',
      slug: 'matrix-ergonomic-high-back-chair',
      shortDescription: 'Breathable Korean mesh with 3D adjustable armrests and dynamic lumbar support.',
      description: 'Designed for 12+ hour sitting comfort. Heavy-duty class 4 gas lift with multi-angle synchro-tilt mechanism and aluminum die-cast wheelbase.',
      categoryId: catOffice.id,
      brandId: brandGodrej.id,
      status: 'ACTIVE',
      isFeatured: true,
      isBestSeller: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1580481077195-c3a82da91883?auto=format&fit=crop&w=800&q=80',
            altText: 'Matrix Ergonomic Chair Black',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
      specifications: {
        create: [
          { groupName: 'Ergonomics', name: 'Armrest', value: '3D Adjustable (Height, Depth, Angle)' },
          { groupName: 'Ergonomics', name: 'Lumbar Support', value: 'Dynamic Adaptive Height & Depth' },
          { groupName: 'Build', name: 'Base', value: 'Polished Cast Aluminum' },
          { groupName: 'Build', name: 'Mechanism', value: 'Synchro-Tilt with Multi-lock' },
          { groupName: 'Warranty', name: 'Warranty', value: '5 Years On Mechanism & Gas Lift' },
        ],
      },
      variants: {
        create: [
          {
            name: 'Jet Black Mesh',
            sku: 'CHR-MAT-BLK-01',
            price: 11999.0,
            compareAtPrice: 15499.0,
            weight: 18.0,
            attributes: { Color: 'Black' },
            inventory: {
              create: {
                availableQuantity: 25,
                reservedQuantity: 0,
                lowStockThreshold: 5,
              },
            },
          },
          {
            name: 'Slate Grey Mesh',
            sku: 'CHR-MAT-GRY-02',
            price: 12499.0,
            compareAtPrice: 15999.0,
            weight: 18.0,
            attributes: { Color: 'Slate Grey' },
            inventory: {
              create: {
                availableQuantity: 12,
                reservedQuantity: 0,
                lowStockThreshold: 4,
              },
            },
          },
        ],
      },
    },
  });

  // Product 3: Samsung Refrigerator (Electronics)
  const fridge = await prisma.product.upsert({
    where: { slug: 'samsung-convertible-double-door-refrigerator' },
    update: {},
    create: {
      name: 'Samsung 253L 3-Star Digital Inverter Frost-Free Refrigerator',
      slug: 'samsung-convertible-double-door-refrigerator',
      shortDescription: 'Energy efficient digital inverter compressor with all-round cooling and deodorizing filter.',
      description: 'Samsung 253 Litres Double Door Refrigerator with Smart Connect Inverter, Toughened Glass Shelves, MoistFresh Zone, and 20-year warranty on Digital Inverter Compressor.',
      categoryId: catAppliances.id,
      brandId: brandSamsung.id,
      status: 'ACTIVE',
      isFeatured: true,
      isBestSeller: false,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
            altText: 'Samsung Double Door Refrigerator',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
      specifications: {
        create: [
          { groupName: 'Capacity & Efficiency', name: 'Capacity', value: '253 Litres' },
          { groupName: 'Capacity & Efficiency', name: 'Energy Rating', value: '3 Star (BEE 2026)' },
          { groupName: 'Cooling', name: 'Compressor', value: 'Digital Inverter (Silent & Energy Saving)' },
          { groupName: 'Cooling', name: 'Defrost System', value: 'Frost Free' },
          { groupName: 'Shelves', name: 'Shelf Type', value: 'Spill-Proof Toughened Glass (175 kg capacity)' },
          { groupName: 'Warranty', name: 'Product Warranty', value: '1 Year Comprehensive' },
          { groupName: 'Warranty', name: 'Compressor Warranty', value: '20 Years Manufacturer Warranty' },
        ],
      },
      variants: {
        create: [
          {
            name: '253L Elegant Inox Silver',
            sku: 'REF-SAM-253-INOX',
            price: 25490.0,
            compareAtPrice: 31990.0,
            weight: 52.0,
            attributes: { Capacity: '253L', Color: 'Inox Silver' },
            inventory: {
              create: {
                availableQuantity: 8,
                reservedQuantity: 0,
                lowStockThreshold: 2,
              },
            },
          },
        ],
      },
    },
  });

  // Product 4: LG Split AC (Electronics)
  const ac = await prisma.product.upsert({
    where: { slug: 'lg-ai-dual-inverter-split-ac' },
    update: {},
    create: {
      name: 'LG 1.5 Ton 5-Star AI Dual Inverter Split AC',
      slug: 'lg-ai-dual-inverter-split-ac',
      shortDescription: 'Super Convertible 6-in-1 cooling, HD filter with anti-virus protection, and 100% copper condenser.',
      description: 'Delivers rapid cooling even at 52°C ambient temperature. Features Ocean Black Protection on copper pipes for corrosion prevention in high humidity and local dust conditions.',
      categoryId: catAppliances.id,
      brandId: brandLG.id,
      status: 'ACTIVE',
      isFeatured: true,
      isBestSeller: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80',
            altText: 'LG Split AC Unit',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
      specifications: {
        create: [
          { groupName: 'Performance', name: 'Cooling Capacity', value: '1.5 Ton (Ideal for 150-180 sq ft)' },
          { groupName: 'Performance', name: 'Energy Star Rating', value: '5 Star Super Efficient' },
          { groupName: 'Technology', name: 'Inverter Type', value: 'AI Dual Inverter Compressor' },
          { groupName: 'Condenser', name: 'Coil Material', value: '100% Grooved Copper with Ocean Black Fin' },
          { groupName: 'Gas', name: 'Refrigerant', value: 'Eco-Friendly R32' },
          { groupName: 'Warranty', name: 'Comprehensive Warranty', value: '1 Year Unit + 5 Years PCB + 10 Years Compressor' },
        ],
      },
      variants: {
        create: [
          {
            name: '1.5 Ton White with Magic Display',
            sku: 'AC-LG-15-5STAR-WHT',
            price: 44990.0,
            compareAtPrice: 52990.0,
            weight: 42.5,
            attributes: { Tonnage: '1.5 Ton', StarRating: '5 Star' },
            inventory: {
              create: {
                availableQuantity: 5,
                reservedQuantity: 0,
                lowStockThreshold: 2,
              },
            },
          },
        ],
      },
    },
  });

  // Product 5: 6-Seater Sheesham Dining Table Set (Furniture)
  const dining = await prisma.product.upsert({
    where: { slug: 'heritage-sheesham-6-seater-dining-set' },
    update: {},
    create: {
      name: 'Heritage Handcrafted 6-Seater Solid Sheesham Dining Set',
      slug: 'heritage-sheesham-6-seater-dining-set',
      shortDescription: 'Solid Sheesham wood dining table with 6 cushioned high-back chairs in teak natural finish.',
      description: 'Elevate family gatherings with this solid wood dining set. Kiln-dried and chemically treated for 100% termite resistance, featuring cushioned seats upholstered in stain-resistant fabric.',
      categoryId: catLiving.id,
      brandId: brandUrban.id,
      status: 'ACTIVE',
      isFeatured: false,
      isBestSeller: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
            altText: 'Heritage Dining Table Set',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
      specifications: {
        create: [
          { groupName: 'Dimensions', name: 'Table Dimensions', value: '58 x 35 x 30 inches (L x W x H)' },
          { groupName: 'Dimensions', name: 'Chair Dimensions', value: '18 x 18 x 38 inches' },
          { groupName: 'Wood', name: 'Wood Type', value: '100% Seasoned Sheesham Wood' },
          { groupName: 'Seating', name: 'Seating Capacity', value: '6 Persons' },
          { groupName: 'Fabric', name: 'Chair Cushion', value: 'High-Density 32D Foam with Cream Fabric' },
        ],
      },
      variants: {
        create: [
          {
            name: 'Teak Finish 6 Seater',
            sku: 'DNG-SH-6S-TK',
            price: 36999.0,
            compareAtPrice: 45000.0,
            weight: 65.0,
            attributes: { Seating: '6 Seater', Finish: 'Teak Natural' },
            inventory: {
              create: {
                availableQuantity: 4,
                reservedQuantity: 0,
                lowStockThreshold: 1,
              },
            },
          },
        ],
      },
    },
  });

  // 6. Seed Coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off on your first order up to ₹1,500',
      discountType: 'PERCENTAGE',
      discountValue: 10.0,
      minimumOrder: 2000.0,
      maximumDiscount: 1500.0,
      usageLimit: 500,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FURNITURE500' },
    update: {},
    create: {
      code: 'FURNITURE500',
      description: 'Flat ₹500 off on orders above ₹10,000',
      discountType: 'FIXED',
      discountValue: 500.0,
      minimumOrder: 10000.0,
      usageLimit: 200,
      isActive: true,
    },
  });

  // 7. Seed Banners
  await prisma.banner.deleteMany({});
  await prisma.banner.createMany({
    data: [
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
    ],
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

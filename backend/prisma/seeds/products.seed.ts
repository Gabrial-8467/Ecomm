import { PrismaClient, Category, Brand } from '@prisma/client';

interface ProductSeedContext {
  categories: Record<string, Category>;
  brands: Record<string, Brand>;
}

export async function seedProducts(prisma: PrismaClient, context: ProductSeedContext) {
  console.log('📦 Seeding Products, Variants & Inventory...');

  const { categories, brands } = context;

  async function seedSingleProduct(p: {
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    categorySlug: string;
    brandSlug: string;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    images: { url: string; altText: string; isPrimary?: boolean; sortOrder?: number }[];
    specifications: { groupName: string; name: string; value: string }[];
    variants: {
      name: string;
      sku: string;
      price: number;
      compareAtPrice?: number;
      weight?: number;
      attributes?: Record<string, string>;
      initialStock: number;
      lowStockThreshold?: number;
    }[];
  }) {
    const category = categories[p.categorySlug];
    const brand = brands[p.brandSlug];

    if (!category || !brand) {
      console.warn(`Skipping product ${p.name}: category ${p.categorySlug} or brand ${p.brandSlug} not found.`);
      return null;
    }

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      return existing;
    }

    return prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        categoryId: category.id,
        brandId: brand.id,
        status: 'ACTIVE',
        isFeatured: p.isFeatured || false,
        isBestSeller: p.isBestSeller || false,
        images: {
          create: p.images.map((img, idx) => ({
            url: img.url,
            altText: img.altText || p.name,
            isPrimary: img.isPrimary !== undefined ? img.isPrimary : idx === 0,
            sortOrder: img.sortOrder || idx,
          })),
        },
        specifications: {
          create: p.specifications,
        },
        variants: {
          create: p.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            weight: v.weight,
            attributes: v.attributes,
            inventory: {
              create: {
                availableQuantity: v.initialStock,
                reservedQuantity: 0,
                lowStockThreshold: v.lowStockThreshold || 3,
              },
            },
          })),
        },
      },
    });
  }

  // 1. Royal 3-Door Wooden Almirah (Furniture - Bedroom)
  await seedSingleProduct({
    name: 'Royal 3-Door Solid Wood Wardrobe Almirah',
    slug: 'royal-3-door-wooden-almirah',
    shortDescription: 'Spacious 3-door wardrobe with internal locker and mirror in rich walnut finish.',
    description:
      'Crafted from premium engineered wood with scratch-resistant melamine coating. Features 3 wide compartments, 2 hanging rods, a safety locker with dual keys, and an integrated full-length vanity mirror.',
    categorySlug: 'bedroom',
    brandSlug: 'urban-teak',
    isFeatured: true,
    isBestSeller: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
        altText: 'Royal 3-Door Wooden Wardrobe front view',
        isPrimary: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=800&q=80',
        altText: 'Wardrobe open layout',
        isPrimary: false,
      },
    ],
    specifications: [
      { groupName: 'Dimensions', name: 'Height', value: '78 inches (6.5 ft)' },
      { groupName: 'Dimensions', name: 'Width', value: '48 inches (4 ft)' },
      { groupName: 'Dimensions', name: 'Depth', value: '22 inches' },
      { groupName: 'Material', name: 'Primary Material', value: 'Engineered Wood + Teak Veneer' },
      { groupName: 'Features', name: 'Locking Mechanism', value: 'Dual Key Safety Locker' },
      { groupName: 'Warranty', name: 'Warranty Period', value: '3 Years Comprehensive' },
    ],
    variants: [
      {
        name: 'Walnut Finish',
        sku: 'ALM-ROYAL-WALNUT-01',
        price: 24999.0,
        compareAtPrice: 29999.0,
        weight: 78.5,
        attributes: { Finish: 'Walnut', Doors: '3' },
        initialStock: 10,
        lowStockThreshold: 3,
      },
      {
        name: 'Honey Teak Finish',
        sku: 'ALM-ROYAL-TEAK-02',
        price: 26499.0,
        compareAtPrice: 31999.0,
        weight: 78.5,
        attributes: { Finish: 'Honey Teak', Doors: '3' },
        initialStock: 6,
        lowStockThreshold: 2,
      },
    ],
  });

  // 2. Matrix Ergonomic Office Chair (Furniture - Office)
  await seedSingleProduct({
    name: 'Matrix Ergonomic High-Back Executive Office Chair',
    slug: 'matrix-ergonomic-high-back-chair',
    shortDescription: 'Breathable Korean mesh with 3D adjustable armrests and dynamic lumbar support.',
    description:
      'Designed for 12+ hour sitting comfort. Heavy-duty class 4 gas lift with multi-angle synchro-tilt mechanism and aluminum die-cast wheelbase.',
    categorySlug: 'office',
    brandSlug: 'godrej-interio',
    isFeatured: true,
    isBestSeller: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1580481077195-c3a82da91883?auto=format&fit=crop&w=800&q=80',
        altText: 'Matrix Ergonomic Chair Black',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Ergonomics', name: 'Armrest', value: '3D Adjustable (Height, Depth, Angle)' },
      { groupName: 'Ergonomics', name: 'Lumbar Support', value: 'Dynamic Adaptive Height & Depth' },
      { groupName: 'Build', name: 'Base', value: 'Polished Cast Aluminum' },
      { groupName: 'Warranty', name: 'Warranty', value: '5 Years On Mechanism & Gas Lift' },
    ],
    variants: [
      {
        name: 'Jet Black Mesh',
        sku: 'CHR-MAT-BLK-01',
        price: 11999.0,
        compareAtPrice: 15499.0,
        weight: 18.0,
        attributes: { Color: 'Black' },
        initialStock: 25,
        lowStockThreshold: 5,
      },
      {
        name: 'Slate Grey Mesh',
        sku: 'CHR-MAT-GRY-02',
        price: 12499.0,
        compareAtPrice: 15999.0,
        weight: 18.0,
        attributes: { Color: 'Slate Grey' },
        initialStock: 12,
        lowStockThreshold: 4,
      },
    ],
  });

  // 3. Chesterfield 3-Seater Velvet Luxury Sofa (Furniture - Living Room)
  await seedSingleProduct({
    name: 'Chesterfield Hand-Tufted 3-Seater Velvet Luxury Sofa',
    slug: 'chesterfield-3-seater-velvet-sofa',
    shortDescription: 'Deep diamond-button tufting, scrolled arms, and solid pine wood inner structure in high-GSM velvet.',
    description:
      'A timeless statement centerpiece for discerning living spaces. Upholstered in premium stain-resistant velvet over high-density 40D supersoft foam. Supported by carved dark walnut legs with brass castor wheels.',
    categorySlug: 'living-room',
    brandSlug: 'royal-oak',
    isFeatured: true,
    isBestSeller: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        altText: 'Emerald Chesterfield 3 Seater Sofa',
        isPrimary: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
        altText: 'Chesterfield Living Room View',
        isPrimary: false,
      },
    ],
    specifications: [
      { groupName: 'Dimensions', name: 'Overall Dimensions', value: '86 x 36 x 31 inches (L x D x H)' },
      { groupName: 'Dimensions', name: 'Seating Height', value: '18 inches' },
      { groupName: 'Upholstery', name: 'Fabric Type', value: '380 GSM Stain-Resistant Italian Velvet' },
      { groupName: 'Frame & Foam', name: 'Frame Material', value: 'Kiln-Dried Solid Pine & Sal Wood' },
      { groupName: 'Frame & Foam', name: 'Seat Cushion', value: '40 Density High Resilience Foam with Pocket Springs' },
      { groupName: 'Warranty', name: 'Frame Warranty', value: '10 Years Structural Guarantee' },
    ],
    variants: [
      {
        name: 'Emerald Green Velvet',
        sku: 'SOF-CHEST-EMERALD',
        price: 42999.0,
        compareAtPrice: 55000.0,
        weight: 62.0,
        attributes: { Color: 'Emerald Green', Seating: '3 Seater' },
        initialStock: 4,
        lowStockThreshold: 1,
      },
      {
        name: 'Midnight Navy Velvet',
        sku: 'SOF-CHEST-NAVY',
        price: 42999.0,
        compareAtPrice: 55000.0,
        weight: 62.0,
        attributes: { Color: 'Midnight Navy', Seating: '3 Seater' },
        initialStock: 3,
        lowStockThreshold: 1,
      },
    ],
  });

  // 4. King Size Solid Sheesham Bed with Hydraulic Storage (Furniture - Bedroom)
  await seedSingleProduct({
    name: 'Imperial Solid Sheesham King Bed with Hydraulic Storage',
    slug: 'imperial-sheesham-hydraulic-bed',
    shortDescription: 'Pure Indian Rosewood (Sheesham) bed with German hydraulic lift-up storage and padded headrest.',
    description:
      'Combines regal natural wood grain with practical massive storage. The dual hydraulic gas-lift mechanism allows effortless opening of the 950-litre under-bed storage without removing the mattress.',
    categorySlug: 'bedroom',
    brandSlug: 'urban-teak',
    isFeatured: true,
    isBestSeller: false,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
        altText: 'Imperial Solid Wood Bed',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Dimensions', name: 'Bed Dimensions', value: '82 x 74 x 42 inches (Mattress: 78 x 72)' },
      { groupName: 'Build', name: 'Wood Material', value: '100% Solid Seasoned Sheesham Wood' },
      { groupName: 'Storage', name: 'Storage Capacity', value: '950 Litres Hydraulic Lift-Up' },
      { groupName: 'Storage', name: 'Lifting Mechanism', value: 'German Hettich 1200N Gas Lift' },
      { groupName: 'Warranty', name: 'Wood Warranty', value: 'Lifetime Termite Resistance Guarantee' },
    ],
    variants: [
      {
        name: 'King Size (78 x 72) Honey Finish',
        sku: 'BED-SH-KING-HNY',
        price: 48999.0,
        compareAtPrice: 62000.0,
        weight: 95.0,
        attributes: { Size: 'King Size', Finish: 'Honey Teak' },
        initialStock: 5,
        lowStockThreshold: 2,
      },
      {
        name: 'Queen Size (78 x 60) Honey Finish',
        sku: 'BED-SH-QUEEN-HNY',
        price: 44999.0,
        compareAtPrice: 56000.0,
        weight: 85.0,
        attributes: { Size: 'Queen Size', Finish: 'Honey Teak' },
        initialStock: 4,
        lowStockThreshold: 2,
      },
    ],
  });

  // 5. Godrej Defender Prime 4-Door Steel Almirah (Furniture - Bedroom)
  await seedSingleProduct({
    name: 'Godrej Interio Defender Prime 4-Door Steel Security Almirah',
    slug: 'godrej-defender-steel-almirah',
    shortDescription: 'Heavy-gauge CRCA prime steel with multi-point secret digital locking system and full mirror.',
    description:
      'The gold standard in home security storage. Fabricated from multi-bend high yield cold-rolled steel treated with 8-tank anti-rust phosphating and scratch-proof epoxy powder coating.',
    categorySlug: 'bedroom',
    brandSlug: 'godrej-interio',
    isFeatured: false,
    isBestSeller: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
        altText: 'Godrej Steel Almirah',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Build & Security', name: 'Steel Gauge', value: 'High Yield 1.2 mm CRCA Prime Steel' },
      { groupName: 'Build & Security', name: 'Locker Mechanism', value: 'Dual Unpickable Godrej Keyed Locker' },
      { groupName: 'Dimensions', name: 'Dimensions', value: '78 x 54 x 22 inches (H x W x D)' },
      { groupName: 'Finish', name: 'Coating', value: '8-Tank Anti-Rust Epoxy Powder Coat' },
      { groupName: 'Warranty', name: 'Security Guarantee', value: '10 Years Godrej Warranty' },
    ],
    variants: [
      {
        name: 'Maroon & Warm White Dual Tone',
        sku: 'ALM-GOD-DEF-MRN',
        price: 32990.0,
        compareAtPrice: 38990.0,
        weight: 90.0,
        attributes: { Color: 'Maroon / White', Doors: '4' },
        initialStock: 7,
        lowStockThreshold: 2,
      },
    ],
  });

  // 6. Motorized Height Adjustable Standing Desk (Furniture - Office)
  await seedSingleProduct({
    name: 'AeroLift Pro Motorized Dual-Motor Height Adjustable Desk',
    slug: 'aerolift-pro-standing-desk',
    shortDescription: 'Dual silent electric motors, 4 memory height presets, anti-collision sensor, and oak top.',
    description:
      'Switch between sitting and standing effortlessly. Features dual synchronized silent heavy-duty motors supporting up to 120 kg, digital LED control pad, and embedded cable management channel.',
    categorySlug: 'office',
    brandSlug: 'godrej-interio',
    isFeatured: true,
    isBestSeller: false,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
        altText: 'AeroLift Standing Desk',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Performance', name: 'Height Range', value: '64 cm to 129 cm (Continuous adjustment)' },
      { groupName: 'Performance', name: 'Motor Type', value: 'Dual Synchronized Ultra-Quiet (<45dB)' },
      { groupName: 'Performance', name: 'Max Weight Capacity', value: '120 kg dynamic load' },
      { groupName: 'Controls', name: 'Memory Presets', value: '4 Digital Programmable Buttons + USB Charging Port' },
      { groupName: 'Top Material', name: 'Desktop', value: 'FSC Certified High Density Beveled Oak Top' },
      { groupName: 'Warranty', name: 'Motor & Controller Warranty', value: '5 Years Replacement Warranty' },
    ],
    variants: [
      {
        name: '55 x 28 inch Solid Oak Top / Black Frame',
        sku: 'DSK-STND-55-OAK',
        price: 27999.0,
        compareAtPrice: 34999.0,
        weight: 38.0,
        attributes: { Size: '55x28 inch', Top: 'Oak Wood' },
        initialStock: 8,
        lowStockThreshold: 2,
      },
      {
        name: '48 x 24 inch Walnut Top / White Frame',
        sku: 'DSK-STND-48-WAL',
        price: 24999.0,
        compareAtPrice: 31999.0,
        weight: 34.0,
        attributes: { Size: '48x24 inch', Top: 'Walnut Wood' },
        initialStock: 6,
        lowStockThreshold: 2,
      },
    ],
  });

  // 7. Sony Bravia 55-inch 4K Google TV (Electronics - TV)
  await seedSingleProduct({
    name: 'Sony Bravia 55-Inch 4K Ultra HD Smart Google TV (XR Processor)',
    slug: 'sony-bravia-55-4k-google-tv',
    shortDescription: 'TRILUMINOS PRO 4K display with Cognitive Processor XR, Dolby Atmos, and Apple AirPlay 2.',
    description:
      'Immerse your living room in cinematic clarity with Sony Bravia 4K HDR. Cognitive Processor XR reproduces colour, contrast and motion the way humans see and hear.',
    categorySlug: 'televisions',
    brandSlug: 'sony',
    isFeatured: true,
    isBestSeller: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
        altText: 'Sony Bravia 55 TV on living room wall',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Display', name: 'Screen Size', value: '55 inches (139 cm diag)' },
      { groupName: 'Display', name: 'Resolution', value: '4K Ultra HD (3840 x 2160)' },
      { groupName: 'Display', name: 'Picture Engine', value: 'Cognitive Processor XR + 4K XR Super Resolution' },
      { groupName: 'Audio', name: 'Sound Output', value: '20 Watts Acoustic Multi-Audio with Dolby Atmos' },
      { groupName: 'Smart TV', name: 'Operating System', value: 'Google TV with Google Assistant & Hands-free Mic' },
      { groupName: 'Connectivity', name: 'Ports', value: '4 HDMI 2.1 (eARC, 4K 120Hz), 2 USB, Optical Out' },
      { groupName: 'Warranty', name: 'Official Warranty', value: '1 Year Comprehensive + 2 Years on Panel' },
    ],
    variants: [
      {
        name: '55-inch Model (XR-55X90L)',
        sku: 'TV-SNY-55-4K-XR',
        price: 68990.0,
        compareAtPrice: 84990.0,
        weight: 17.5,
        attributes: { ScreenSize: '55 inch', Resolution: '4K' },
        initialStock: 6,
        lowStockThreshold: 2,
      },
      {
        name: '65-inch Model (XR-65X90L)',
        sku: 'TV-SNY-65-4K-XR',
        price: 104990.0,
        compareAtPrice: 129990.0,
        weight: 23.0,
        attributes: { ScreenSize: '65 inch', Resolution: '4K' },
        initialStock: 3,
        lowStockThreshold: 1,
      },
    ],
  });

  // 8. Sony 5.1ch Soundbar with Subwoofer (Electronics - TV & Audio)
  await seedSingleProduct({
    name: 'Sony HT-S20R 5.1ch Home Cinema Dolby Digital Soundbar',
    slug: 'sony-ht-s20r-soundbar',
    shortDescription: '400W total power output, real 5.1 separate rear speakers, wired subwoofer, and Bluetooth.',
    description:
      'Bring the true movie theater experience to your home. Enjoy 5.1 channels of real surround sound with rear speakers and external subwoofer for deep, punchy bass.',
    categorySlug: 'televisions',
    brandSlug: 'sony',
    isFeatured: false,
    isBestSeller: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
        altText: 'Sony 5.1 Soundbar system',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Audio', name: 'Total Power Output', value: '400 Watts Peak' },
      { groupName: 'Audio', name: 'Channels', value: '5.1 Separate Channels (Soundbar + Sub + 2 Rears)' },
      { groupName: 'Audio', name: 'Sound Modes', value: 'Auto, Standard, Cinema, Music, Voice, Night' },
      { groupName: 'Connectivity', name: 'Inputs', value: 'HDMI ARC, Optical, USB, Bluetooth 5.0' },
      { groupName: 'Warranty', name: 'Brand Warranty', value: '1 Year Manufacturer Warranty' },
    ],
    variants: [
      {
        name: '400W Black Soundbar Kit',
        sku: 'AUD-SNY-S20R-51',
        price: 17990.0,
        compareAtPrice: 23990.0,
        weight: 8.5,
        attributes: { Power: '400W', Channels: '5.1' },
        initialStock: 15,
        lowStockThreshold: 4,
      },
    ],
  });

  // 9. LG 8 Kg AI Direct Drive Front Load Washing Machine (Electronics - Appliances)
  await seedSingleProduct({
    name: 'LG 8.0 Kg 5-Star AI Direct Drive Front Load Washing Machine',
    slug: 'lg-8kg-ai-direct-drive-washing-machine',
    shortDescription: 'AI Inverter Direct Drive with 6-Motion technology, Steam Allergy Care, and TurboWash 59.',
    description:
      'Intelligent fabric protection with AI DD: detects weight and fabric softness to optimize wash motions. Built-in steam heater eliminates 99.9% allergens and dust mites.',
    categorySlug: 'home-appliances',
    brandSlug: 'lg',
    isFeatured: true,
    isBestSeller: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',
        altText: 'LG Front Load Washing Machine',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Capacity & Efficiency', name: 'Washing Capacity', value: '8.0 Kg (Ideal for 4-5 member families)' },
      { groupName: 'Capacity & Efficiency', name: 'Energy Rating', value: '5 Star BEE Certified' },
      { groupName: 'Wash Technology', name: 'Motor', value: 'Inverter Direct Drive (Beltless Super Silent)' },
      { groupName: 'Wash Technology', name: 'Steam Feature', value: 'Steam+ Allergy & Baby Care' },
      { groupName: 'Speed', name: 'Maximum Spin Speed', value: '1400 RPM (Fast Drying)' },
      { groupName: 'Warranty', name: 'Warranty', value: '2 Years Comprehensive + 10 Years on Inverter Motor' },
    ],
    variants: [
      {
        name: '8.0 Kg Platinum Silver',
        sku: 'WM-LG-80-FL-SLV',
        price: 36990.0,
        compareAtPrice: 45990.0,
        weight: 65.0,
        attributes: { Capacity: '8.0 Kg', Color: 'Platinum Silver' },
        initialStock: 7,
        lowStockThreshold: 2,
      },
      {
        name: '9.0 Kg Dark Graphite Black',
        sku: 'WM-LG-90-FL-BLK',
        price: 41990.0,
        compareAtPrice: 51990.0,
        weight: 68.0,
        attributes: { Capacity: '9.0 Kg', Color: 'Graphite Black' },
        initialStock: 5,
        lowStockThreshold: 2,
      },
    ],
  });

  // 10. Samsung 345L Curd Maestro Double Door Refrigerator (Electronics - Appliances)
  await seedSingleProduct({
    name: 'Samsung 345L 3-Star Curd Maestro Convertible Double Door Refrigerator',
    slug: 'samsung-345l-curd-maestro-refrigerator',
    shortDescription: 'World’s first refrigerator that makes fresh curd. Convertible 5-in-1 with Twin Cooling Plus.',
    description:
      'Transform cooling convenience. Features patented Curd Maestro kit, Twin Cooling Plus that prevents odor mixing between fridge and freezer, and 20-year warranty on Digital Inverter compressor.',
    categorySlug: 'home-appliances',
    brandSlug: 'samsung',
    isFeatured: true,
    isBestSeller: false,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
        altText: 'Samsung 345L Refrigerator',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Capacity & Cooling', name: 'Gross Capacity', value: '345 Litres' },
      { groupName: 'Capacity & Cooling', name: 'Cooling System', value: 'Twin Cooling Plus (Dual Evaporators)' },
      { groupName: 'Special Features', name: 'Curd Maestro', value: 'Automated 6.5h fermentation container' },
      {
        groupName: 'Special Features',
        name: 'Convertible Modes',
        value: '5-in-1 (Normal, Extra Fridge, Seasonal, Vacation, Home Alone)',
      },
      { groupName: 'Warranty', name: 'Compressor Guarantee', value: '20 Years Manufacturer Warranty' },
    ],
    variants: [
      {
        name: '345L Black Glass Mirror Finish',
        sku: 'REF-SAM-345-BLK-MIR',
        price: 38990.0,
        compareAtPrice: 47990.0,
        weight: 64.0,
        attributes: { Capacity: '345L', Finish: 'Black Glass' },
        initialStock: 6,
        lowStockThreshold: 2,
      },
    ],
  });

  // 11. Daikin 1.5 Ton 5-Star Inverter Split AC (Electronics - Appliances)
  await seedSingleProduct({
    name: 'Daikin 1.5 Ton 5-Star Neo Inverter Split AC with PM 2.5 Filter',
    slug: 'daikin-1-5-ton-inverter-split-ac',
    shortDescription: 'Heavy-duty cooling up to 54°C ambient with Dew Clean self-cleaning evaporator and 100% copper.',
    description:
      'Engineered for extreme North Indian summers. Features PM 2.5 air purification filter, Power Chill mode for instant 20-minute room cooling, and eco-friendly R32 refrigerant.',
    categorySlug: 'home-appliances',
    brandSlug: 'daikin',
    isFeatured: false,
    isBestSeller: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80',
        altText: 'Daikin Inverter Split AC',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Cooling Efficiency', name: 'Tonnage', value: '1.5 Ton (Suitable for 150-180 sq ft)' },
      { groupName: 'Cooling Efficiency', name: 'Energy Rating', value: '5 Star Super High ISEER (5.2)' },
      { groupName: 'Durability', name: 'Condenser Coil', value: '100% Inner Grooved Pure Copper' },
      { groupName: 'Air Quality', name: 'Filtration', value: 'PM 2.5 Microparticle Filter' },
      { groupName: 'Warranty', name: 'Warranty', value: '1 Year Unit + 5 Years PCB + 10 Years Compressor' },
    ],
    variants: [
      {
        name: '1.5 Ton Pure White Unit',
        sku: 'AC-DAIK-15-5ST-WHT',
        price: 45990.0,
        compareAtPrice: 54990.0,
        weight: 43.0,
        attributes: { Tonnage: '1.5 Ton', Star: '5 Star' },
        initialStock: 8,
        lowStockThreshold: 2,
      },
    ],
  });

  // 12. Whirlpool 240L Protton Triple Door Frost-Free Refrigerator (Electronics - Appliances)
  await seedSingleProduct({
    name: 'Whirlpool 240L Protton 3-Door Multi-Door Frost Free Refrigerator',
    slug: 'whirlpool-240l-triple-door-refrigerator',
    shortDescription: 'Exclusive 3-door design with separate 32L Active Fresh vegetable drawer that prevents odor mixing.',
    description:
      'Unique multi-door format keeps vegetables fresher for twice as long. Features 6th Sense ActiveFresh technology, Microblock protection, and lowest energy consumption in its class.',
    categorySlug: 'home-appliances',
    brandSlug: 'whirlpool',
    isFeatured: false,
    isBestSeller: false,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
        altText: 'Whirlpool 3 Door Refrigerator',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Capacity & Design', name: 'Capacity', value: '240 Litres' },
      { groupName: 'Capacity & Design', name: 'Door Format', value: '3 Independent Doors (Freezer, Refrigerator, Veg Zone)' },
      { groupName: 'Freshness Tech', name: 'Active Fresh Zone', value: '32 Litres Largest Veg Drawer with Moisture Retention' },
      { groupName: 'Energy', name: 'Power Consumption', value: 'Uses less power than a 60W CFL bulb' },
      { groupName: 'Warranty', name: 'Compressor Guarantee', value: '10 Years Manufacturer Warranty' },
    ],
    variants: [
      {
        name: '240L Alpha Steel Metallic',
        sku: 'REF-WHR-240-3DR-STL',
        price: 26990.0,
        compareAtPrice: 33990.0,
        weight: 56.0,
        attributes: { Doors: '3 Door', Finish: 'Alpha Steel' },
        initialStock: 9,
        lowStockThreshold: 3,
      },
    ],
  });

  // 13. Sleepwell Ortho Pro Pocket Spring & Memory Foam Mattress (Furniture - Bedroom)
  await seedSingleProduct({
    name: 'Sleepwell Ortho Pro Ergonomic Spine Support Memory Foam Mattress',
    slug: 'sleepwell-ortho-pro-mattress',
    shortDescription: 'Doctor recommended 3-zone pocket spring with body-contouring cool gel memory foam.',
    description:
      'Waking up refreshed without back stiffness. Certified by the Indian Ergonomics Society with zero partner disturbance pocket springs and breathable anti-microbial quilted top.',
    categorySlug: 'bedroom',
    brandSlug: 'sleepwell',
    isFeatured: true,
    isBestSeller: false,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
        altText: 'Sleepwell Ortho Pro Mattress',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Thickness & Dimensions', name: 'Thickness', value: '8 Inches (20.3 cm)' },
      { groupName: 'Foam & Spring', name: 'Core Layer', value: 'Individually Encased Zero-Disturbance Pocket Springs' },
      { groupName: 'Foam & Spring', name: 'Comfort Layer', value: 'Cool Gel Infused Memory Foam' },
      { groupName: 'Cover', name: 'Fabric', value: 'Knitted European Jacquard with Neem Fresche Anti-Bacterial' },
      { groupName: 'Warranty', name: 'Warranty Period', value: '10 Years Full Warranty' },
    ],
    variants: [
      {
        name: 'King (78 x 72 x 8 in)',
        sku: 'MAT-SLP-ORTHO-KNG8',
        price: 23999.0,
        compareAtPrice: 31999.0,
        weight: 35.0,
        attributes: { Size: 'King Size', Thickness: '8 inch' },
        initialStock: 12,
        lowStockThreshold: 3,
      },
      {
        name: 'Queen (78 x 60 x 8 in)',
        sku: 'MAT-SLP-ORTHO-QUN8',
        price: 19999.0,
        compareAtPrice: 26999.0,
        weight: 29.0,
        attributes: { Size: 'Queen Size', Thickness: '8 inch' },
        initialStock: 14,
        lowStockThreshold: 3,
      },
    ],
  });

  // 14. Nordic Minimalist Solid Oak Coffee Table (Furniture - Living Room)
  await seedSingleProduct({
    name: 'Nordic Minimalist Solid Oak Coffee Table with Storage Drawers',
    slug: 'nordic-solid-oak-coffee-table',
    shortDescription: 'Scandinavian beveled edge design with 2 soft-close drawers and open shelf in natural oak finish.',
    description:
      'Clean modern lines that elevate your living space. Handcrafted from sustainably harvested European Oak with smooth rounded corners safe for children and homes with pets.',
    categorySlug: 'living-room',
    brandSlug: 'urban-teak',
    isFeatured: false,
    isBestSeller: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
        altText: 'Nordic Oak Coffee Table',
        isPrimary: true,
      },
    ],
    specifications: [
      { groupName: 'Dimensions', name: 'Size', value: '44 x 22 x 18 inches (L x W x H)' },
      { groupName: 'Wood & Finish', name: 'Material', value: 'Solid White Oak + Hardwood Veneer' },
      { groupName: 'Storage', name: 'Drawers', value: '2 Soft-Close Concealed Hardware Drawers' },
      { groupName: 'Warranty', name: 'Guarantee', value: '5 Years Structural Guarantee' },
    ],
    variants: [
      {
        name: 'Natural Honey Oak',
        sku: 'COF-NORD-OAK-NAT',
        price: 14999.0,
        compareAtPrice: 19999.0,
        weight: 24.0,
        attributes: { Finish: 'Natural Oak' },
        initialStock: 10,
        lowStockThreshold: 3,
      },
    ],
  });
}

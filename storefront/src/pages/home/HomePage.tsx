import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../services/api/client.js';
import { Product, Category, Banner, DeliveryCheckResult } from '../../types/index.js';
import { ProductCard } from '../../components/product/ProductCard.js';
import { toast } from 'sonner';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  MapPin,
  CheckCircle2,
  Star,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Percent,
  Check,
  Copy,
  ChevronDown,
  Phone,
  Clock,
  Layers,
  Award,
  BadgeCheck,
  PackageCheck,
  Flame,
  Armchair,
  Bed,
  Tv,
  Refrigerator,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Merchandising Tab Filter
  const [activeCatalogTab, setActiveCatalogTab] = useState<'all' | 'living' | 'bedroom' | 'appliances' | 'bestsellers'>('all');

  // Pincode Delivery Estimator
  const [pincode, setPincode] = useState('160071');
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeResult, setPincodeResult] = useState<DeliveryCheckResult | null>(null);

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Copied Promo Code feedback
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes, bannerRes, catalogRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/categories'),
          api.get('/banners').catch(() => ({ data: { data: [] } })),
          api.get('/products?limit=24').catch(() => ({ data: { data: [] } })),
        ]);
        setFeaturedProducts(prodRes.data?.data || []);
        setCategories(catRes.data?.data || []);
        const activeBanners = (bannerRes.data?.data || []).filter((b: Banner) => b.isActive);
        setBanners(activeBanners);
        setAllProducts(catalogRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-rotate hero banners every 6 seconds if multiple exist
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText('WELCOME10');
    setCopiedCode(true);
    toast.success('Coupon code WELCOME10 copied! 10% off at checkout.');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim() || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit postal pincode');
      return;
    }

    setPincodeChecking(true);
    try {
      const response = await api.get(`/delivery/check-pincode?pincode=${pincode.trim()}`);
      setPincodeResult(response.data?.data);
    } catch {
      setPincodeResult({ serviceable: false, message: 'Could not verify delivery zone' });
    } finally {
      setPincodeChecking(false);
    }
  };

  const activeBanner = banners.length > 0 ? banners[currentBannerIdx] : null;

  // Filter products for the active catalog tab
  const filteredTabProducts = allProducts.filter((product) => {
    if (activeCatalogTab === 'all') return true;
    if (activeCatalogTab === 'living') {
      return product.category?.slug?.includes('living') || product.name.toLowerCase().includes('sofa') || product.name.toLowerCase().includes('table');
    }
    if (activeCatalogTab === 'bedroom') {
      return product.category?.slug?.includes('bedroom') || product.name.toLowerCase().includes('bed') || product.name.toLowerCase().includes('mattress') || product.name.toLowerCase().includes('wardrobe') || product.name.toLowerCase().includes('almirah');
    }
    if (activeCatalogTab === 'appliances') {
      return product.category?.slug?.includes('appliance') || product.name.toLowerCase().includes('refrigerator') || product.name.toLowerCase().includes('ac') || product.name.toLowerCase().includes('machine');
    }
    if (activeCatalogTab === 'bestsellers') {
      return product.isBestSeller || product.isFeatured;
    }
    return true;
  });

  const displayTabProducts = filteredTabProducts.length > 0 ? filteredTabProducts.slice(0, 8) : featuredProducts.slice(0, 8);

  const FAQ_ITEMS = [
    {
      q: 'How does Cash on Delivery with in-person inspection work?',
      a: 'We operate with zero customer risk. When our showroom van arrives at your residence, our team unboxes the furniture or appliance in your room of choice. You inspect the wood grain, alignment, finish, or appliance power before handing over cash or paying via instant UPI scan.'
    },
    {
      q: 'Do your delivery technicians assemble the furniture in my room?',
      a: 'Yes, absolutely. Every solid wood bed, wardrobe, modular table, and dining set includes complimentary in-home technician assembly. Our carpenters level the pieces, secure all structural bolts, and take away all packing debris at zero surcharge.'
    },
    {
      q: 'Are brand warranties on Samsung, LG, and Godrej appliances genuine?',
      a: '100% genuine. Grand Living is an authorized dealer partner in the Tricity. Every consumer appliance carries the manufacturer’s original warranty card stamped with our official authorized dealer seal, along with a formal GST tax invoice.'
    },
    {
      q: 'What does the 5-Year Solid Wood Guarantee cover?',
      a: 'Our solid Sheesham and Teak wood furniture is kiln-dried and pressure-treated against wood borers and termites. We provide a written 5-year guarantee against termite infestation, structural joint failure, and excessive timber warping under normal home conditions.'
    },
    {
      q: 'Can I visit the physical showroom in Mohali before ordering?',
      a: 'We welcome you to visit us! Our flagship experience studio is located at SCO 45-48, Sector 70, Mohali. We are open every day from 10:00 AM to 09:00 PM so you can test recliner cushions, feel wood textures, and consult with our master woodworkers.'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      <Helmet>
        <title>Grand Living | Handcrafted Wood Furniture &amp; Branded Electronics Showroom Mohali</title>
        <meta
          name="description"
          content="Grand Living physical showroom in Sector 70, Mohali. Shop solid Sheesham wood wardrobes, sofas, and Samsung & LG appliances with Cash on Delivery & Free Assembly."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Grand Living Furniture &amp; Electronics" />
        <meta property="og:title" content="Grand Living | Premium Furniture &amp; Branded Electronics Showroom" />
        <meta
          property="og:description"
          content="Direct from our Mohali showroom: Handcrafted Teak wood beds, wardrobes, and Samsung/LG appliances with Cash on Delivery."
        />
        <meta
          property="og:image"
          content="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Grand Living | Furniture &amp; Electronics Showroom" />
      </Helmet>

      {/* 1. Main Hero Banner & Quick Metrics */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-2 sm:pt-4 space-y-4">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white min-h-[560px] sm:min-h-[660px] flex items-center shadow-xl border border-neutral-800/60">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={
                activeBanner?.imageUrl ||
                'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=80'
              }
              alt={activeBanner?.title || 'Grand Living Furniture Showroom'}
              className="w-full h-full object-cover transition-all duration-700 brightness-[0.70]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent sm:bg-gradient-to-r sm:from-neutral-950 sm:via-neutral-950/75 sm:to-transparent" />
          </div>

          <div className="relative z-10 max-w-3xl px-6 sm:px-12 lg:px-16 py-16 sm:py-24 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-medium text-neutral-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Mohali Flagship Showroom • Direct Dedicated Fleet</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[1.06] text-white">
              {activeBanner?.title ? (
                <span>{activeBanner.title}</span>
              ) : (
                <>
                  Architectural Wood. <br />
                  <span className="font-medium text-neutral-100">Certified Brands.</span>
                </>
              )}
            </h1>

            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed font-normal max-w-xl">
              {activeBanner?.subtitle ||
                'Handcrafted Sheesham & Teak wood furniture and energy-efficient Samsung & LG appliances. Delivered in-person across the Tricity with inspection on delivery.'}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/products?category=living-room"
                className="px-8 py-3.5 bg-white hover:bg-neutral-100 text-neutral-950 text-xs font-semibold uppercase tracking-widest rounded-full transition-all flex items-center gap-2 group shadow-lg"
              >
                <span>Shop Solid Wood</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/products?category=home-appliances"
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium uppercase tracking-widest rounded-full border border-white/25 transition-all backdrop-blur-md flex items-center gap-2"
              >
                <span>Certified Appliances</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Carousel Navigation Arrows & Segmented Bars */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => setCurrentBannerIdx((prev) => (prev - 1 + banners.length) % banners.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-neutral-950/40 hover:bg-neutral-950/80 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-colors"
                aria-label="Previous Banner"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentBannerIdx((prev) => (prev + 1) % banners.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-neutral-950/40 hover:bg-neutral-950/80 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-colors"
                aria-label="Next Banner"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentBannerIdx(i)}
                    className={`h-1 transition-all rounded-full ${
                      i === currentBannerIdx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* 3. Shop By Department */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-neutral-200/60 pb-4">
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-neutral-400">
              Department Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight mt-1">
              Curated Living Spaces
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs uppercase tracking-widest font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 group"
          >
            <span>All Departments</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group relative rounded-3xl overflow-hidden aspect-[3/4] bg-neutral-100 border border-neutral-200/70 shadow-2xs hover:border-neutral-400/80 transition-all"
            >
              <img
                src={
                  category.image ||
                  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'
                }
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-700 ease-out brightness-[0.85]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <h3 className="text-sm sm:text-base font-semibold leading-tight tracking-tight group-hover:text-neutral-200 transition-colors">
                  {category.name}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-neutral-300 mt-1 inline-flex items-center gap-1 font-medium">
                  <span>Explore Pieces</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Interactive Merchandising Tabs ("Trending & New Arrivals") */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200/60">
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-neutral-400">
              Immediate Warehouse Staging
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight mt-1">
              Trending Showroom Collection
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-1">
              Select a space below to browse pieces ready for same-day inspection and white-glove delivery.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'All Pieces' },
              { key: 'living', label: 'Living Room' },
              { key: 'bedroom', label: 'Bedroom & Beds' },
              { key: 'appliances', label: 'Appliances & AC' },
              { key: 'bestsellers', label: 'Best Sellers' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCatalogTab(tab.key as any)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeCatalogTab === tab.key
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {displayTabProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 5. Architectural Promotional Banner: Season Staging Edit */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="rounded-3xl bg-neutral-950 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden border border-neutral-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-amber-400 text-[10px] font-semibold uppercase tracking-widest">
              <Percent className="w-3 h-3" />
              Limited Staging Season Offer
            </span>
            <h2 className="text-3xl sm:text-5xl font-light tracking-tight leading-tight">
              Furnish your entire home. <br />
              <span className="font-medium text-neutral-100">Pay 10% less with WELCOME10.</span>
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-lg font-normal">
              Combine solid wood living suites with inverter home electronics. Enjoy verified doorstep inspection, free assembly, and cash payment on arrival.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyCoupon}
                className="px-5 py-2.5 rounded-full bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-xs font-mono font-semibold flex items-center gap-2 transition-all"
              >
                <span>Code: WELCOME10</span>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
              </button>
              <Link
                to="/products"
                className="px-6 py-2.5 rounded-full bg-white text-neutral-950 text-xs font-semibold uppercase tracking-widest hover:bg-neutral-100 transition-colors"
              >
                Apply To Collection
              </Link>
            </div>
          </div>

          <div className="relative z-10 w-full lg:w-96 p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-200">
              White-Glove Promise
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero advance deposit required</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>2-Man delivery crew carries to any floor</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full bolt tightening &amp; wood oil finishing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Original GST invoice for warranty</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Shop The Room: Curated Room Lookbooks */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-neutral-200/60">
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-neutral-400">
              Interior Staging Guides
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight mt-1">
              Shop The Room
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-1">
              Curated bundles designed by master woodworkers to harmonize wood finishes, comfort, and appliance fit.
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs uppercase tracking-widest font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 group"
          >
            <span>Browse All Collections</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Look 1 */}
          <div className="group bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-2xs hover:border-neutral-900 transition-all flex flex-col justify-between">
            <div>
              <div className="aspect-[16/10] bg-neutral-100 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"
                  alt="The Scandinavian Living Room"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-700"
                />
                <span className="absolute top-3 left-3 px-3 py-1 bg-neutral-950/80 backdrop-blur-md text-white rounded-full text-[10px] font-semibold uppercase tracking-wider">
                  Living Suite
                </span>
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-base font-semibold text-neutral-950 tracking-tight">
                  The Nordic Oak Living Room
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Featuring solid oak coffee table with storage, 3-seater linen couch, and low-profile TV console.
                </p>
                <div className="pt-2 text-xs font-semibold text-neutral-900">
                  Bundle from ₹34,999 • Free Installation
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <Link
                to="/products?category=living-room"
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors text-center block"
              >
                View Living Suite
              </Link>
            </div>
          </div>

          {/* Look 2 */}
          <div className="group bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-2xs hover:border-neutral-900 transition-all flex flex-col justify-between">
            <div>
              <div className="aspect-[16/10] bg-neutral-100 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80"
                  alt="The Master Sheesham Bedroom"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-700"
                />
                <span className="absolute top-3 left-3 px-3 py-1 bg-neutral-950/80 backdrop-blur-md text-white rounded-full text-[10px] font-semibold uppercase tracking-wider">
                  Master Bedroom
                </span>
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-base font-semibold text-neutral-950 tracking-tight">
                  The Heritage Teak Bedroom
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Solid hydraulic storage bed, 4-door seasoned teak almirah, and doctor-recommended orthopedic mattress.
                </p>
                <div className="pt-2 text-xs font-semibold text-neutral-900">
                  Bundle from ₹52,999 • 5-Yr Guarantee
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <Link
                to="/products?category=bedroom"
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors text-center block"
              >
                View Bedroom Suite
              </Link>
            </div>
          </div>

          {/* Look 3 */}
          <div className="group bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-2xs hover:border-neutral-900 transition-all flex flex-col justify-between">
            <div>
              <div className="aspect-[16/10] bg-neutral-100 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80"
                  alt="The Modern Kitchen & Appliance Staging"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-700"
                />
                <span className="absolute top-3 left-3 px-3 py-1 bg-neutral-950/80 backdrop-blur-md text-white rounded-full text-[10px] font-semibold uppercase tracking-wider">
                  Cooling &amp; Kitchen
                </span>
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-base font-semibold text-neutral-950 tracking-tight">
                  The Smart Home Appliance Hub
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Whirlpool 3-door protton refrigerator, LG 5-star inverter AC, and digital automatic washing machine.
                </p>
                <div className="pt-2 text-xs font-semibold text-neutral-900">
                  Official 10-Yr Compressor Warranty
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <Link
                to="/products?category=home-appliances"
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors text-center block"
              >
                View Appliance Suite
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Interactive Tricity Pincode Delivery Estimator */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="rounded-3xl bg-neutral-50 border border-neutral-200/80 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-neutral-400">
              Instant Fleet Verification
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight">
              Check Delivery &amp; Free Assembly for Your Pincode
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
              We operate our own dedicated logistics vans across Mohali, Chandigarh, and Panchkula. Enter your sector pincode to check dispatch schedule.
            </p>
          </div>

          <div className="w-full lg:w-auto max-w-md space-y-3">
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-Digit PIN (e.g. 160071)"
                value={pincode}
                maxLength={6}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 text-xs px-4 py-3 bg-white border border-neutral-200 rounded-full focus:outline-none focus:border-neutral-900 font-mono text-neutral-900"
              />
              <button
                type="submit"
                disabled={pincodeChecking}
                className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors shrink-0"
              >
                {pincodeChecking ? 'Checking...' : 'Check PIN'}
              </button>
            </form>

            {pincodeResult && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                  pincodeResult.serviceable
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {pincodeResult.serviceable ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Local Fleet Serviceable: {pincodeResult.zone?.name}</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Delivered in {pincodeResult.zone?.estimatedDays} days by showroom van • Free Assembly &amp; Cash on Delivery Enabled
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Pincode Not in Active Fleet Route</p>
                      <p className="text-[11px]">{pincodeResult.message || 'Call our showroom for custom long-distance transport.'}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 9. Physical Studio Showcase Experience */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="rounded-3xl bg-neutral-900 text-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-neutral-800 shadow-xl">
          <div className="lg:col-span-6 p-8 sm:p-14 lg:p-16 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-semibold">
                Studio Experience
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white leading-tight">
                Touch the wood grain. <br />
                <span className="font-medium text-neutral-100">Test the comfort.</span>
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-md font-normal">
                Online photos can’t convey the weight of solid seasoned Sheesham or the cooling efficiency of an LG Inverter AC. Visit our Sector 70 showroom to touch, sit, inspect, and consult with our master woodworkers.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-neutral-400 mt-1 shrink-0" strokeWidth={1.5} />
                <div className="text-xs">
                  <p className="font-semibold text-white">Grand Living Flagship Studio</p>
                  <p className="text-neutral-400 mt-0.5">SCO 45-48, Sector 70, Mohali, Punjab 160071</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+919876543210"
                  className="px-6 py-2.5 rounded-full bg-white text-neutral-950 text-xs font-semibold uppercase tracking-widest hover:bg-neutral-100 transition-colors"
                >
                  Call Showroom
                </a>
                <Link
                  to="/products"
                  className="px-6 py-2.5 rounded-full border border-neutral-700 text-white text-xs font-medium uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                >
                  Browse Catalogue
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[340px] lg:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"
              alt="Grand Living Showroom Interior"
              className="w-full h-full object-cover brightness-90"
            />
          </div>
        </div>
      </section>

      {/* 10. Customer Testimonials */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-neutral-400">
            Client Voices
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight">
            Verified Homeowners
          </h2>
          <p className="text-neutral-500 text-xs">Residents across Mohali, Chandigarh &amp; Panchkula.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-7 rounded-3xl border border-neutral-200/70 shadow-2xs space-y-4">
            <div className="flex text-neutral-900 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" />
              ))}
            </div>
            <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed font-normal">
              "Ordered the 3-Door Royal Solid Wood Almirah yesterday afternoon. The showroom confirmed by phone, and their team carried it up to our 2nd floor room this morning. Impeccable teak finish."
            </p>
            <div className="pt-2 border-t border-neutral-100">
              <p className="font-semibold text-neutral-950 text-xs">Gurpreet Singh</p>
              <p className="text-neutral-400 text-[11px]">Sector 69, Mohali</p>
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-neutral-200/70 shadow-2xs space-y-4">
            <div className="flex text-neutral-900 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" />
              ))}
            </div>
            <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed font-normal">
              "Purchased an LG 5-Star Split AC and a Nordic solid oak coffee table together. Being able to inspect both upon arrival before paying cash made the decision effortless. Great local service."
            </p>
            <div className="pt-2 border-t border-neutral-100">
              <p className="font-semibold text-neutral-950 text-xs">Simran Kaur</p>
              <p className="text-neutral-400 text-[11px]">Sector 38, Chandigarh</p>
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-neutral-200/70 shadow-2xs space-y-4">
            <div className="flex text-neutral-900 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" />
              ))}
            </div>
            <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed font-normal">
              "The solid wood dining table is genuinely heavy timber, not particle board. Their carpenters assembled all six chairs and the table in 40 minutes and cleaned up everything."
            </p>
            <div className="pt-2 border-t border-neutral-100">
              <p className="font-semibold text-neutral-950 text-xs">Vikram Malhotra</p>
              <p className="text-neutral-400 text-[11px]">Sector 4, Panchkula</p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Frequently Asked Questions (FAQ) Accordion */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-neutral-400">
            Help &amp; Answers
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-neutral-500 text-xs">Everything you need to know about purchasing, delivery, and guarantees.</p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-neutral-200/80 divide-y divide-neutral-100 overflow-hidden shadow-2xs">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors"
                >
                  <span className="text-sm font-semibold text-neutral-950 tracking-tight">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 12. Showroom Concierge Banner */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="rounded-3xl bg-neutral-100/70 border border-neutral-200 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-950 tracking-tight">
              Need custom sizing or direct showroom assistance?
            </h3>
            <p className="text-xs text-neutral-500">
              Speak with our senior woodwork consultant or schedule a private studio tour in Sector 70, Mohali.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:+919876543210"
              className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+91 98765 43210</span>
            </a>
            <Link
              to="/products"
              className="px-6 py-3 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-2xs"
            >
              Explore All Collections
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

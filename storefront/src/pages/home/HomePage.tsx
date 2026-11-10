import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../services/api/client.js';
import { Product, Category, Banner } from '../../types/index.js';
import { ProductCard } from '../../components/product/ProductCard.js';
import { ArrowRight, ShieldCheck, Truck, Sparkles, MapPin, CheckCircle2, Star, ChevronLeft, ChevronRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes, bannerRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/categories'),
          api.get('/banners').catch(() => ({ data: { data: [] } })),
        ]);
        setFeaturedProducts(prodRes.data?.data || []);
        setCategories(catRes.data?.data || []);
        const activeBanners = (bannerRes.data?.data || []).filter((b: Banner) => b.isActive);
        setBanners(activeBanners);
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

  const activeBanner = banners.length > 0 ? banners[currentBannerIdx] : null;

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      <Helmet>
        <title>Grand Living | Handcrafted Wood Furniture & Branded Electronics Showroom Mohali</title>
        <meta
          name="description"
          content="Grand Living physical showroom in Sector 70, Mohali. Shop solid Sheesham wood wardrobes, sofas, and Samsung & LG appliances with Cash on Delivery & Free Assembly."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Grand Living Furniture & Electronics" />
        <meta property="og:title" content="Grand Living | Premium Furniture & Branded Electronics Showroom" />
        <meta
          property="og:description"
          content="Direct from our Mohali showroom: Handcrafted Teak wood beds, wardrobes, and Samsung/LG appliances with Cash on Delivery."
        />
        <meta
          property="og:image"
          content="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Grand Living | Furniture & Electronics Showroom" />
        <meta
          name="twitter:image"
          content="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
        />
      </Helmet>

      {/* 1. Main Hero Banner */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-2 sm:pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white min-h-[540px] sm:min-h-[640px] flex items-center shadow-xl border border-neutral-800/60">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={
                activeBanner?.imageUrl ||
                'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=80'
              }
              alt={activeBanner?.title || 'Grand Living Furniture Showroom'}
              className="w-full h-full object-cover transition-all duration-700 brightness-[0.72]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent sm:bg-gradient-to-r sm:from-neutral-950 sm:via-neutral-950/75 sm:to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl px-6 sm:px-12 lg:px-16 py-16 sm:py-24 space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[1.06] text-white">
              {activeBanner?.title ? (
                <span>{activeBanner.title}</span>
              ) : (
                <>
                  Solid Wood Living. <br />
                  <span className="font-medium text-neutral-100">Certified Brands.</span>
                </>
              )}
            </h1>

            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed font-normal max-w-xl">
              {activeBanner?.subtitle ||
                'Handcrafted Sheesham & Teak wood furniture and energy-efficient Samsung & LG appliances. Delivered in-person across the Tricity with inspection on delivery.'}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              {activeBanner?.linkUrl ? (
                <Link
                  to={activeBanner.linkUrl}
                  className="px-8 py-3.5 bg-white hover:bg-neutral-100 text-neutral-950 text-xs font-semibold uppercase tracking-widest rounded-full transition-all flex items-center gap-2 group shadow-lg"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/products?category=living-room"
                    className="px-8 py-3.5 bg-white hover:bg-neutral-100 text-neutral-950 text-xs font-semibold uppercase tracking-widest rounded-full transition-all flex items-center gap-2 group shadow-lg"
                  >
                    <span>Shop Furniture</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/products?category=home-appliances"
                    className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium uppercase tracking-widest rounded-full border border-white/25 transition-all backdrop-blur-md"
                  >
                    Appliances
                  </Link>
                </>
              )}
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

      {/* 2. Showroom Trust Pillars */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200/70 p-6 rounded-2xl space-y-2 shadow-2xs hover:border-neutral-400/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-3">
              <Truck className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-neutral-950 text-sm tracking-tight">Direct Local Delivery</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">
              Showroom vehicle dispatch across Mohali, Chandigarh &amp; Panchkula. No parcel transit damage.
            </p>
          </div>

          <div className="bg-white border border-neutral-200/70 p-6 rounded-2xl space-y-2 shadow-2xs hover:border-neutral-400/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-3">
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-neutral-950 text-sm tracking-tight">Inspect on Delivery (COD)</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">
              Check the solid wood finish and fitment at your doorstep before completing payment.
            </p>
          </div>

          <div className="bg-white border border-neutral-200/70 p-6 rounded-2xl space-y-2 shadow-2xs hover:border-neutral-400/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-3">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-neutral-950 text-sm tracking-tight">Authorised Brand Warranties</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">
              Genuine manufacturer stamped warranty on Samsung, LG, Godrej and 5-year solid wood guarantee.
            </p>
          </div>

          <div className="bg-white border border-neutral-200/70 p-6 rounded-2xl space-y-2 shadow-2xs hover:border-neutral-400/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-3">
              <MapPin className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-neutral-950 text-sm tracking-tight">Physical Showroom</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">
              Experience the pieces in person at SCO 45-48, Sector 70, Mohali. Open daily 10:00 – 21:00.
            </p>
          </div>
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-100 border border-neutral-200/70 shadow-2xs hover:border-neutral-400/80 transition-all"
            >
              <img
                src={
                  category.image ||
                  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'
                }
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-700 ease-out brightness-[0.88]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-sm sm:text-base font-semibold leading-tight tracking-tight group-hover:text-neutral-200 transition-colors">
                  {category.name}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5 inline-block font-medium">
                  Discover →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Featured Showroom Products */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-neutral-200/60 pb-4">
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-neutral-400">
              Immediate Dispatch
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight mt-1">
              Featured Pieces
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-1">
              Selected handcrafted solid wood furniture and certified electronics ready in Mohali warehouse.
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs uppercase tracking-widest font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 group"
          >
            <span>Complete Catalogue ({featuredProducts.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-2xl h-80 border border-neutral-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Physical Studio Showcase Experience */}
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

      {/* 6. Customer Testimonials */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-neutral-400">
            Client Voices
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight">
            Verified Homeowners
          </h2>
          <p className="text-neutral-500 text-xs">Residents across Mohali, Chandigarh &amp; Panchkula.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-7 rounded-2xl border border-neutral-200/70 shadow-2xs space-y-4">
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

          <div className="bg-white p-7 rounded-2xl border border-neutral-200/70 shadow-2xs space-y-4">
            <div className="flex text-neutral-900 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" />
              ))}
            </div>
            <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed font-normal">
              "Got the LG 1.5 Ton AC with Cash on Delivery. Better price than online platforms, delivered within 24 hours with original GST invoice and authorized company warranty stamp."
            </p>
            <div className="pt-2 border-t border-neutral-100">
              <p className="font-semibold text-neutral-950 text-xs">Dr. Ananya Verma</p>
              <p className="text-neutral-400 text-[11px]">Sector 35, Chandigarh</p>
            </div>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-neutral-200/70 shadow-2xs space-y-4">
            <div className="flex text-neutral-900 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" />
              ))}
            </div>
            <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed font-normal">
              "The ergonomic Matrix desk chair is top tier. Being able to inspect before paying cash made it completely risk-free. Highly recommend Grand Living for your home office."
            </p>
            <div className="pt-2 border-t border-neutral-100">
              <p className="font-semibold text-neutral-950 text-xs">Vikram Sethi</p>
              <p className="text-neutral-400 text-[11px]">Phase 7, Mohali</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

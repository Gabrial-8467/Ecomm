import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
      {/* 1. Main Hero Banner */}
      <section className="relative overflow-hidden bg-stone-900 text-white min-h-[520px] sm:min-h-[600px] flex items-center transition-all duration-700">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={
              activeBanner?.imageUrl ||
              'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=80'
            }
            alt={activeBanner?.title || 'Luxury Furniture Showroom'}
            className="w-full h-full object-cover transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Direct From Physical Showroom
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              {activeBanner?.title || 'Handcrafted Wood Furniture & Branded Electronics.'}
            </h1>

            <p className="text-stone-300 text-base sm:text-lg leading-relaxed font-light">
              {activeBanner?.subtitle ||
                'Experience the luxury of premium solid Sheesham wood wardrobes, sofas, and office furniture alongside energy-efficient Samsung & LG home electronics. Delivered safely by our dedicated local fleet with Cash on Delivery.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              {activeBanner?.linkUrl ? (
                <Link
                  to={activeBanner.linkUrl}
                  className="px-7 py-3.5 bg-amber-800 hover:bg-amber-900 text-white font-medium rounded-xl transition-all shadow-lg shadow-amber-950/40 flex items-center gap-2 group"
                >
                  <span>Explore Offer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/products?category=living-room"
                    className="px-7 py-3.5 bg-amber-800 hover:bg-amber-900 text-white font-medium rounded-xl transition-all shadow-lg shadow-amber-950/40 flex items-center gap-2 group"
                  >
                    <span>Explore Furniture</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/products?category=home-appliances"
                    className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all backdrop-blur-md"
                  >
                    Shop Electronics
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows & Indicators if multiple banners */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentBannerIdx((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center border border-white/20 transition-colors"
              aria-label="Previous Banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentBannerIdx((prev) => (prev + 1) % banners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center border border-white/20 transition-colors"
              aria-label="Next Banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBannerIdx(i)}
                  className={`h-2 transition-all rounded-full ${
                    i === currentBannerIdx ? 'w-8 bg-amber-500' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to banner ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 2. Shop By Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
              Curated Collections
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900 mt-1">Shop By Department</h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 group"
          >
            <span>View All Departments</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-stone-100 border border-stone-200/80 shadow-xs hover:shadow-lg transition-all"
            >
              <img
                src={
                  category.image ||
                  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'
                }
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-serif text-base sm:text-lg font-bold leading-tight group-hover:text-amber-300 transition-colors">
                  {category.name}
                </h3>
                <span className="text-[11px] text-stone-300 mt-1 inline-block">
                  Explore Collection →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Showroom Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
              In-Stock Showroom Units
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900 mt-1">Featured Best Sellers</h2>
            <p className="text-stone-500 text-sm mt-1">
              Top rated by our local homeowners and ready for immediate delivery.
            </p>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 group"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-2xl h-80 border border-stone-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Why Buy From Our Physical Store */}
      <section className="bg-stone-100 py-16 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
              The Physical Store Advantage
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900 mt-1">Why Local Shoppers Trust Us</h2>
            <p className="text-stone-600 text-sm mt-2">
              Unlike nameless online marketplaces, we are an established showroom in Sector 70, Mohali.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-lg">Safe Showroom Delivery</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Our own trained staff deliver your almirahs, beds, and ACs safely to your room, avoiding courier mishandling.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-lg">Cash on Delivery</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Inspect your furniture or appliances at your doorstep before handing over cash or paying via UPI to our delivery staff.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-lg">Authentic Brand Warranties</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Direct official dealer stamped warranty on Samsung, LG, and Godrej appliances + 5-year wood guarantee.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-lg">Visit & Try Before Order</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Want to touch the wood finish or sit on the sofa? Visit our Sector 70 showroom anytime between 10am - 9pm!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="font-serif text-3xl font-bold text-stone-900">What Our Customers Say</h2>
          <p className="text-stone-500 text-sm mt-1">Verified local buyers in Mohali and Chandigarh.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
            </div>
            <p className="text-stone-700 text-sm italic">
              "Ordered the 3-Door Royal Almirah yesterday afternoon. The store called within an hour to confirm, and their delivery team set it up in our 2nd floor bedroom this morning. Outstanding finish!"
            </p>
            <div>
              <p className="font-bold text-stone-900 text-sm">Gurpreet Singh</p>
              <p className="text-stone-400 text-xs">Sector 69, Mohali</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
            </div>
            <p className="text-stone-700 text-sm italic">
              "Got the LG 1.5 Ton AC with Cash on Delivery. The price was better than online marketplaces and it was delivered within 24 hours with an original GST bill and warranty stamp."
            </p>
            <div>
              <p className="font-bold text-stone-900 text-sm">Dr. Ananya Verma</p>
              <p className="text-stone-400 text-xs">Sector 35, Chandigarh</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
            </div>
            <p className="text-stone-700 text-sm italic">
              "The ergonomic Matrix chair is top tier. Being able to order online with Cash on Delivery made it completely risk free. Highly recommend Grand Living for your home office!"
            </p>
            <div>
              <p className="font-bold text-stone-900 text-sm">Vikram Sethi</p>
              <p className="text-stone-400 text-xs">Phase 7, Mohali</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

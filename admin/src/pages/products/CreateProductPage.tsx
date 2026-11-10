import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Category, Brand } from '../../types/index.js';
import { Plus, Trash2, ArrowLeft, Layers, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface VariantForm {
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  weight?: number;
  initialStock: number;
  lowStockThreshold: number;
}

interface SpecForm {
  groupName: string;
  name: string;
  value: string;
}

export const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>('ACTIVE');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Images
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  ]);

  // Variants (at least one is required)
  const [variants, setVariants] = useState<VariantForm[]>([
    {
      name: 'Default',
      sku: 'SKU-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      price: 9999,
      compareAtPrice: 12999,
      weight: 15,
      initialStock: 10,
      lowStockThreshold: 3,
    },
  ]);

  // Dynamic Specifications
  const [specs, setSpecs] = useState<SpecForm[]>([
    { groupName: 'General', name: 'Material', value: 'Solid Wood' },
    { groupName: 'General', name: 'Warranty', value: '3 Years' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [cRes, bRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);
        setCategories(cRes.data?.data || []);
        setBrands(bRes.data?.data || []);
        if (cRes.data?.data?.[0]) setCategoryId(cRes.data.data[0].id);
      } catch (err) {
        console.error('Failed to load categories/brands:', err);
      }
    }
    loadMeta();
  }, []);

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        name: 'Option ' + (variants.length + 1),
        sku: 'SKU-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        price: 9999,
        compareAtPrice: 12999,
        initialStock: 5,
        lowStockThreshold: 2,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length === 1) {
      toast.error('At least one variant or default SKU is required.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { groupName: 'General', name: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;
    setImages([...images, imageUrl.trim()]);
    setImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (variants.length === 0) {
      toast.error('Please define at least one variant');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/products', {
        name,
        shortDescription,
        description,
        categoryId,
        brandId: brandId || undefined,
        status,
        isFeatured,
        isBestSeller,
        images: images.map((url, idx) => ({
          url,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
        variants: variants.map((v) => ({
          name: v.name,
          sku: v.sku.toUpperCase(),
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
          weight: v.weight ? Number(v.weight) : undefined,
          initialStock: Number(v.initialStock),
          lowStockThreshold: Number(v.lowStockThreshold),
        })),
        specifications: specs.filter((s) => s.name && s.value),
      });

      toast.success('Product and variants created successfully!');
      navigate('/products');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex items-center gap-4">
        <Link to="/products" className="p-2 text-slate-400 hover:text-white rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Showroom Product</h1>
          <p className="text-xs text-slate-400">
            Define product specifications, variants, and initial physical inventory
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Basic Information */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            1. Basic Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Product Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royal 3-Door Solid Wood Wardrobe Almirah"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Brand</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              >
                <option value="">Showroom Handcrafted / In-House</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Short Description (Card Subtitle)
            </label>
            <input
              type="text"
              placeholder="Brief highlighted benefit (e.g. 5-Star AI Inverter with 100% Copper Condenser)"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Detailed Description
            </label>
            <textarea
              rows={4}
              placeholder="Full showroom product overview, craftsmanship, dimensions and details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 bg-slate-800 border-slate-700"
              />
              Mark as Featured Product
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 bg-slate-800 border-slate-700"
              />
              Mark as Best Seller
            </label>
          </div>
        </div>

        {/* 2. Variants & Inventory (Mandatory) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                2. Product Variants & Physical Inventory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Each option has an independent SKU, price, and tracked stock quantity
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddVariant}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((v, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase">
                    Variant #{idx + 1}
                  </span>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Variant Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Walnut Finish or 253 Litres"
                      value={v.name}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].name = e.target.value;
                        setVariants(copy);
                      }}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      SKU (Unique Identifier)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ALM-ROYAL-01"
                      value={v.sku}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].sku = e.target.value.toUpperCase();
                        setVariants(copy);
                      }}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={v.price}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].price = Number(e.target.value);
                        setVariants(copy);
                      }}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Compare Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Original MRP"
                      value={v.compareAtPrice || ''}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].compareAtPrice = e.target.value ? Number(e.target.value) : undefined;
                        setVariants(copy);
                      }}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Initial Physical Stock
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={v.initialStock}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].initialStock = Number(e.target.value);
                        setVariants(copy);
                      }}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={v.lowStockThreshold}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].lowStockThreshold = Number(e.target.value);
                        setVariants(copy);
                      }}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Dynamic Specifications */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">3. Dynamic Key-Value Specifications</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add dimensions, wood type, BEE energy stars, warranty terms
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSpec}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Spec
            </button>
          </div>

          <div className="space-y-3">
            {specs.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Group (e.g. Dimensions)"
                  value={s.groupName}
                  onChange={(e) => {
                    const copy = [...specs];
                    copy[idx].groupName = e.target.value;
                    setSpecs(copy);
                  }}
                  className="w-1/3 text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Name (e.g. Height)"
                  value={s.name}
                  onChange={(e) => {
                    const copy = [...specs];
                    copy[idx].name = e.target.value;
                    setSpecs(copy);
                  }}
                  className="w-1/3 text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 6.5 Feet)"
                  value={s.value}
                  onChange={(e) => {
                    const copy = [...specs];
                    copy[idx].value = e.target.value;
                    setSpecs(copy);
                  }}
                  className="w-1/3 text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Images */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-500" />
            4. Product Photos
          </h2>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste Cloudinary or web image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700"
            >
              Add URL
            </button>
          </div>

          <div className="flex gap-3 flex-wrap">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700">
                <img src={img} alt="preview" className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 bg-amber-600 text-white text-[9px] font-bold px-1.5 rounded">
                    Primary
                  </span>
                )}
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-rose-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Product & Initializing Stock...' : 'Save & Publish Product'}
        </button>
      </form>
    </div>
  );
};

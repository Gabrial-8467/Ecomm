import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Product, Category, Brand } from '../../types/index.js';
import {
  ArrowLeft,
  ExternalLink,
  Layers,
  Save,
  Trash2,
  Plus,
  Eye,
  Edit3,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  UploadCloud,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface EditVariantForm {
  id?: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  weight?: number | null;
  lowStockThreshold?: number;
}

interface EditSpecForm {
  groupName: string;
  name: string;
  value: string;
}

export const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview');

  // Edit Form State
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState<Product['status']>('ACTIVE');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [variants, setVariants] = useState<EditVariantForm[]>([]);
  const [specs, setSpecs] = useState<EditSpecForm[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProductAndMeta();
  }, [id]);

  async function fetchProductAndMeta() {
    setIsLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get('/categories'),
        api.get('/brands'),
      ]);

      const p: Product = prodRes.data?.data;
      setProduct(p);
      setCategories(catRes.data?.data || []);
      setBrands(brandRes.data?.data || []);

      // Populate form state
      setName(p.name);
      setShortDescription(p.shortDescription || '');
      setDescription(p.description || '');
      setCategoryId(p.categoryId);
      setBrandId(p.brandId || '');
      setStatus(p.status);
      setIsFeatured(p.isFeatured);
      setIsBestSeller(p.isBestSeller);

      setVariants(
        p.variants?.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          weight: v.weight ? Number(v.weight) : null,
          lowStockThreshold: v.inventory?.lowStockThreshold ?? 5,
        })) || []
      );

      setSpecs(
        p.specifications?.map((s) => ({
          groupName: s.groupName || 'General',
          name: s.name,
          value: s.value,
        })) || []
      );

      setImages(p.images?.map((img) => img.url) || []);
    } catch (err) {
      console.error('Failed to load product details:', err);
      toast.error('Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await api.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedData = res.data?.data;
      if (Array.isArray(uploadedData)) {
        const newUrls = uploadedData.map((item: any) => item.url);
        setImages((prev) => [...prev, ...newUrls]);
        toast.success(`Successfully uploaded ${newUrls.length} image(s)!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) return;
    setImages((prev) => [...prev, imageUrl.trim()]);
    setImageUrl('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!name.trim()) {
      toast.error('Product title is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        categoryId,
        brandId: brandId || null,
        status,
        isFeatured,
        isBestSeller,
        specifications: specs.filter((s) => s.name.trim() && s.value.trim()),
        images: images.map((url, idx) => ({
          url,
          sortOrder: idx,
          isPrimary: idx === 0,
        })),
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku.toUpperCase(),
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          weight: v.weight ? Number(v.weight) : null,
          lowStockThreshold: Number(v.lowStockThreshold || 5),
        })),
      };

      const response = await api.put(`/products/${product.id}`, payload);
      setProduct(response.data?.data);
      toast.success('Product and variants updated successfully!');
      setActiveTab('overview');
      fetchProductAndMeta();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { groupName: 'General', name: '', value: '' }]);
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  if (isLoading || !product) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-48" />
        <div className="h-96 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  const totalStock = product.variants?.reduce(
    (acc, v) => acc + (v.inventory?.availableQuantity || 0),
    0
  );
  const totalReserved = product.variants?.reduce(
    (acc, v) => acc + (v.inventory?.reservedQuantity || 0),
    0
  );

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <Link
            to="/products"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{product.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  product.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {product.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Category: <span className="font-semibold text-slate-700">{product.category?.name}</span> • Brand:{' '}
              <span className="font-semibold text-slate-700">{product.brand?.name || 'In-House'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`http://localhost:5173/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
            <span>Storefront View</span>
          </a>

          {activeTab === 'overview' ? (
            <button
              onClick={() => setActiveTab('edit')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Product & Variants</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel Editing
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Product Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'edit'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Details & Pricing</span>
        </button>
      </div>

      {activeTab === 'overview' ? (
        /* ================= OVERVIEW TAB ================= */
        <div className="space-y-8">
          {/* Main Info Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white border border-slate-200/90 rounded-3xl p-6 lg:p-8 shadow-xs">
            {/* Gallery Left */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-2xs">
                <img
                  src={
                    product.images?.find((img) => img.isPrimary)?.url ||
                    product.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Description & Badges Right */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg uppercase tracking-wider">
                  {product.category?.name}
                </span>
                {product.brand && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg">
                    {product.brand.name}
                  </span>
                )}
                {product.isFeatured && (
                  <span className="px-3 py-1 bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold rounded-lg">
                    ★ Featured Showcase
                  </span>
                )}
                {product.isBestSeller && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg">
                    Best Seller
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
                <p className="text-sm font-mono text-slate-400 mt-0.5">slug: {product.slug}</p>
              </div>

              {product.shortDescription && (
                <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  {product.shortDescription}
                </p>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Product Description
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Aggregated Stock Counter */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">Available Physical Units</span>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">{totalStock} units</div>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-800 uppercase">Reserved In Pending Orders</span>
                  <div className="text-2xl font-black text-amber-700 mt-0.5">{totalReserved} units</div>
                </div>
              </div>
            </div>
          </div>

          {/* Variants Table Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs space-y-4">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-600" />
                  Showroom Variants & Live Stock ({product.variants?.length || 0})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specific SKUs, customer pricing, physical inventory counts, and safety limits
                </p>
              </div>
              <button
                onClick={() => setActiveTab('edit')}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors"
              >
                Edit Variant Prices
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-6">SKU Code</th>
                    <th className="py-3.5 px-6">Variant Name / Finish</th>
                    <th className="py-3.5 px-6">Selling Price</th>
                    <th className="py-3.5 px-6">Compare MRP</th>
                    <th className="py-3.5 px-6">Available Stock</th>
                    <th className="py-3.5 px-6">Reserved Stock</th>
                    <th className="py-3.5 px-6">Alert Limit</th>
                    <th className="py-3.5 px-6 text-right">Quick Stock Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {product.variants?.map((v) => {
                    const isLowStock = (v.inventory?.availableQuantity || 0) <= (v.inventory?.lowStockThreshold || 5);

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-amber-800">
                          {v.sku}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {v.name}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                          ₹{Number(v.price).toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          {v.compareAtPrice ? (
                            <span className="line-through">₹{Number(v.compareAtPrice).toLocaleString('en-IN')}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded-full ${
                              isLowStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {v.inventory?.availableQuantity || 0} units
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-amber-700">
                          {v.inventory?.reservedQuantity || 0} units
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          ≤ {v.inventory?.lowStockThreshold || 5} units
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            to={`/inventory?search=${v.sku}`}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-200 transition-colors"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
                            <span>Audit Stock</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Specifications Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 lg:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Technical & Material Specifications
            </h3>

            {product.specifications && product.specifications.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {product.specifications.map((s) => (
                  <div key={s.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      {s.groupName || 'Specification'}
                    </span>
                    <p className="font-bold text-slate-900 text-xs">{s.name}</p>
                    <p className="text-xs text-slate-600 font-medium">{s.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">No custom specifications defined for this product.</p>
            )}
          </div>
        </div>
      ) : (
        /* ================= EDIT TAB ================= */
        <form onSubmit={handleSave} className="space-y-8">
          {/* 1. Basic Info */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 lg:p-8 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              1. Title & Descriptions
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Product Title
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Brand
                </label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
                >
                  <option value="">Showroom Handcrafted / In-House</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Catalog Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
                >
                  <option value="ACTIVE">ACTIVE (In Store)</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Short Description (Card Subtitle)
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Detailed Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm p-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white"
              />
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
                />
                Mark as Featured Product
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
                />
                Mark as Best Seller
              </label>
            </div>
          </div>

          {/* 2. Variants & Prices */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 lg:p-8 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              2. Variants & Pricing Configuration
            </h2>

            <div className="space-y-4">
              {variants.map((v, idx) => (
                <div key={v.id || idx} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase">
                      Variant #{idx + 1}: {v.name}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500">{v.sku}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Variant Name
                      </label>
                      <input
                        type="text"
                        required
                        value={v.name}
                        onChange={(e) => {
                          const copy = [...variants];
                          copy[idx].name = e.target.value;
                          setVariants(copy);
                        }}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
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
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Compare Price MRP (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Optional MRP"
                        value={v.compareAtPrice || ''}
                        onChange={(e) => {
                          const copy = [...variants];
                          copy[idx].compareAtPrice = e.target.value ? Number(e.target.value) : null;
                          setVariants(copy);
                        }}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Low Stock Alert Limit
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={v.lowStockThreshold || 5}
                        onChange={(e) => {
                          const copy = [...variants];
                          copy[idx].lowStockThreshold = Number(e.target.value);
                          setVariants(copy);
                        }}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Specifications */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 lg:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">3. Specifications</h2>
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-200"
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
                    className="w-1/3 text-xs px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Name (e.g. Finish)"
                    value={s.name}
                    onChange={(e) => {
                      const copy = [...specs];
                      copy[idx].name = e.target.value;
                      setSpecs(copy);
                    }}
                    className="w-1/3 text-xs px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Teak Wood)"
                    value={s.value}
                    onChange={(e) => {
                      const copy = [...specs];
                      copy[idx].value = e.target.value;
                      setSpecs(copy);
                    }}
                    className="w-1/3 text-xs px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Images */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 lg:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  4. Product Photos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload images directly from your device or paste existing image URLs
                </p>
              </div>
              <label className="cursor-pointer px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-200 transition-colors">
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-amber-700" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Upload Photos'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Or paste image URL (Cloudinary / CDN / web)..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
              >
                Add URL
              </button>
            </div>

            <div className="flex gap-3 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
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
                      className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-rose-600 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save All Changes'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

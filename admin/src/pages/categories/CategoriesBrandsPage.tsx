import React, { useEffect, useState } from 'react';
import { api } from '../../services/api/client.js';
import { Category, Brand } from '../../types/index.js';
import {
  Layers,
  Award,
  Plus,
  Trash2,
  Edit2,
  UploadCloud,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export const CategoriesBrandsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [catSortOrder, setCatSortOrder] = useState(0);
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);
  const [isUploadingCatImg, setIsUploadingCatImg] = useState(false);

  // Brand Modal State
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [isBrandSubmitting, setIsBrandSubmitting] = useState(false);
  const [isUploadingBrandLogo, setIsUploadingBrandLogo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cRes, bRes] = await Promise.all([api.get('/categories'), api.get('/brands')]);
      setCategories(cRes.data?.data || []);
      setBrands(bRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load categories/brands:', err);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Category handlers
  const openAddCategory = () => {
    setEditingCatId(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatImage('');
    setCatParentId('');
    setCatSortOrder(categories.length);
    setCatModalOpen(true);
  };

  const openEditCategory = (c: Category) => {
    setEditingCatId(c.id);
    setCatName(c.name);
    setCatSlug(c.slug);
    setCatDesc(c.description || '');
    setCatImage(c.image || '');
    setCatParentId(c.parentId || '');
    setCatSortOrder(c.sortOrder || 0);
    setCatModalOpen(true);
  };

  const handleCategoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCatImg(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (url) {
        setCatImage(url);
        toast.success('Category banner uploaded');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload image');
    } finally {
      setIsUploadingCatImg(false);
      e.target.value = '';
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('Category title is required');
      return;
    }

    setIsCatSubmitting(true);
    try {
      const payload: any = {
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        image: catImage.trim() || undefined,
        parentId: catParentId || undefined,
        sortOrder: Number(catSortOrder),
      };
      if (catSlug.trim()) payload.slug = catSlug.trim();

      if (editingCatId) {
        await api.put(`/categories/${editingCatId}`, payload);
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', payload);
        toast.success('New category created');
      }

      setCatModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save category');
    } finally {
      setIsCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success(`Deleted category "${name}"`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete category');
    }
  };

  // Brand handlers
  const openAddBrand = () => {
    setEditingBrandId(null);
    setBrandName('');
    setBrandSlug('');
    setBrandLogo('');
    setBrandModalOpen(true);
  };

  const openEditBrand = (b: Brand) => {
    setEditingBrandId(b.id);
    setBrandName(b.name);
    setBrandSlug(b.slug);
    setBrandLogo(b.logo || '');
    setBrandModalOpen(true);
  };

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBrandLogo(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (url) {
        setBrandLogo(url);
        toast.success('Brand logo uploaded');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingBrandLogo(false);
      e.target.value = '';
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error('Brand name is required');
      return;
    }

    setIsBrandSubmitting(true);
    try {
      const payload: any = {
        name: brandName.trim(),
        logo: brandLogo.trim() || undefined,
      };
      if (brandSlug.trim()) payload.slug = brandSlug.trim();

      if (editingBrandId) {
        await api.put(`/brands/${editingBrandId}`, payload);
        toast.success('Brand updated successfully');
      } else {
        await api.post('/brands', payload);
        toast.success('New brand registered');
      }

      setBrandModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save brand');
    } finally {
      setIsBrandSubmitting(false);
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete brand "${name}"?`)) return;
    try {
      await api.delete(`/brands/${id}`);
      toast.success(`Deleted brand "${name}"`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete brand');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catalog Taxonomy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage showroom department categories, subcategories, and manufacturer brands
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'categories'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>Categories ({categories.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('brands')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'brands'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>Brands ({brands.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={activeTab === 'categories' ? openAddCategory : openAddBrand}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'categories' ? 'Add Category' : 'Add Brand'}</span>
          </button>
        </div>
      </div>

      {/* Categories View */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Subheader */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-slate-800">Product Categories & Taxonomy</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {categories.length} {categories.length === 1 ? 'category' : 'categories'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">Image</th>
                  <th className="py-3.5 px-6">Category Name & Details</th>
                  <th className="py-3.5 px-6">URL Slug</th>
                  <th className="py-3.5 px-6">Parent Department</th>
                  <th className="py-3.5 px-6">Display Order</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-xs font-medium text-slate-500">Loading catalog categories...</p>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <p className="text-sm font-semibold text-slate-600 mb-1">No categories found</p>
                      <p className="text-xs text-slate-400">Click "Add Category" above to create your first category.</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => {
                    const parent = categories.find((p) => p.id === c.parentId);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-6">
                          <img
                            src={
                              c.image ||
                              'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=120&q=80'
                            }
                            alt={c.name}
                            className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                          />
                        </td>
                        <td className="py-3.5 px-6">
                          <p className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                            {c.name}
                          </p>
                          {c.description ? (
                            <p className="text-[11px] text-slate-500 font-normal truncate max-w-sm mt-0.5">
                              {c.description}
                            </p>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal italic">No description</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="font-mono text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                            /{c.slug}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          {parent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>{parent.name}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[11px] font-semibold border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Root Department</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            #{c.sortOrder ?? 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditCategory(c)}
                              className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200 shadow-2xs"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(c.id, c.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 shadow-2xs"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Brands View */}
      {activeTab === 'brands' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Subheader */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-slate-800">Showroom Brand Directory</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">Brand Identity & Logo</th>
                  <th className="py-3.5 px-6">Brand Name</th>
                  <th className="py-3.5 px-6">URL Slug</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-xs font-medium text-slate-500">Loading showroom brands...</p>
                    </td>
                  </tr>
                ) : brands.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-slate-400">
                      <p className="text-sm font-semibold text-slate-600 mb-1">No brands registered</p>
                      <p className="text-xs text-slate-400">Click "Add Brand" above to register manufacturer brands.</p>
                    </td>
                  </tr>
                ) : (
                  brands.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-6">
                        {b.logo ? (
                          <img
                            src={b.logo}
                            alt={b.name}
                            className="w-14 h-9 rounded-lg object-contain bg-white p-1 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-14 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs border border-slate-200 shadow-2xs">
                            {b.name[0]?.toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <p className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors text-sm">
                          {b.name}
                        </p>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-mono text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                          /{b.slug}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditBrand(b)}
                            className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200 shadow-2xs"
                            title="Edit Brand"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBrand(b.id, b.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 shadow-2xs"
                            title="Delete Brand"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingCatId ? 'Edit Category' : 'Create Showroom Category'}
              </h3>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Chairs or Smart Refrigerators"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Slug (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Parent Department
                  </label>
                  <select
                    value={catParentId}
                    onChange={(e) => setCatParentId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="">None (Top-level Root)</option>
                    {categories
                      .filter((c) => c.id !== editingCatId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short showroom summary..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-700">
                    Category Banner Image
                  </label>
                  <label className="cursor-pointer text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1">
                    {isUploadingCatImg ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3 h-3" />
                    )}
                    <span>{isUploadingCatImg ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingCatImg}
                      onChange={handleCategoryUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Or paste image URL..."
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(Number(e.target.value))}
                  className="w-24 text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCatSubmitting}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isCatSubmitting ? 'Saving...' : editingCatId ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Create/Edit Modal */}
      {brandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingBrandId ? 'Edit Brand' : 'Register Manufacturer Brand'}
              </h3>
              <button
                type="button"
                onClick={() => setBrandModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Godrej Interio, Samsung, Durian"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={brandSlug}
                  onChange={(e) => setBrandSlug(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-700">
                    Brand Logo Image
                  </label>
                  <label className="cursor-pointer text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1">
                    {isUploadingBrandLogo ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3 h-3" />
                    )}
                    <span>{isUploadingBrandLogo ? 'Uploading...' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingBrandLogo}
                      onChange={handleBrandLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Or paste logo URL..."
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBrandSubmitting}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isBrandSubmitting ? 'Saving...' : editingBrandId ? 'Update Brand' : 'Register Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

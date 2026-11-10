import React, { useEffect, useState } from 'react';
import { api } from '../../services/api/client.js';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  UploadCloud,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export const BannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('/products');
  const [position, setPosition] = useState('hero');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/banners/admin');
      setBanners(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load banners:', err);
      toast.error('Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setLinkUrl('/products');
    setPosition('hero');
    setIsActive(true);
    setSortOrder(banners.length);
    setModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingId(b.id);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setImageUrl(b.imageUrl);
    setLinkUrl(b.linkUrl || '/products');
    setPosition(b.position);
    setIsActive(b.isActive);
    setSortOrder(b.sortOrder);
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (url) {
        setImageUrl(url);
        toast.success('Banner image uploaded successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toast.error('Title and banner image are mandatory');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || '/products',
        position: position.trim(),
        isActive,
        sortOrder: Number(sortOrder),
      };

      if (editingId) {
        await api.put(`/banners/${editingId}`, payload);
        toast.success('Banner updated successfully');
      } else {
        await api.post('/banners', payload);
        toast.success('Promotional banner published');
      }

      setModalOpen(false);
      loadBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete banner "${title}"?`)) return;
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner deleted');
      loadBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete banner');
    }
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      await api.put(`/banners/${b.id}`, { isActive: !b.isActive });
      toast.success(b.isActive ? 'Banner deactivated' : 'Banner activated');
      loadBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Homepage Banners CMS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish seasonal promotional banners, festive discounts, and showroom hero sliders
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Banners Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Subheader */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-800">Showroom Banners & Sliders</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {banners.length} {banners.length === 1 ? 'banner' : 'banners'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-6">Banner Preview</th>
                <th className="py-3.5 px-6">Headline & Copy</th>
                <th className="py-3.5 px-6">Placement</th>
                <th className="py-3.5 px-6">Destination Link</th>
                <th className="py-3.5 px-6">Live Status</th>
                <th className="py-3.5 px-6">Sequence</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-medium text-slate-500">Loading showroom banners...</p>
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600 mb-1">No promotional banners yet</p>
                    <p className="text-xs text-slate-400">Click "Add New Banner" above to publish your first homepage banner.</p>
                  </td>
                </tr>
              ) : (
                banners.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-6">
                      <div className="w-28 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
                        <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors text-sm">
                        {b.title}
                      </p>
                      {b.subtitle ? (
                        <p className="text-[11px] text-slate-500 font-normal truncate max-w-sm mt-0.5">
                          {b.subtitle}
                        </p>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal italic">No subtitle copy</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase font-mono">
                        {b.position}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-amber-900 truncate max-w-[160px]">
                      <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 inline-block truncate max-w-full">
                        {b.linkUrl || '/products'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(b)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-all shadow-2xs ${b.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${b.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{b.isActive ? 'Live' : 'Draft'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        #{b.sortOrder}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200 shadow-2xs"
                          title="Edit Banner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(b.id, b.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 shadow-2xs"
                          title="Delete Banner"
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

      {/* Banner Create/Edit Modal */}
      {modalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">
            {editingId ? 'Edit Promotional Banner' : 'Create Showroom Banner'}
          </h3>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveBanner} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Banner Headline *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Festive Living Room Makeover: Flat 25% Off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Subtitle / Promo Text (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Complimentary delivery & technician installation included"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase text-slate-700">
                Banner Background / Hero Image *
              </label>
              <label className="cursor-pointer text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1">
                {isUploading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <UploadCloud className="w-3 h-3" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Upload Image File'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <input
              type="url"
              required
              placeholder="Or paste high-res banner image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
            />
            {imageUrl && (
              <div className="mt-2 w-full h-24 rounded-xl overflow-hidden border border-slate-200">
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Click Link / Route
              </label>
              <input
                type="text"
                placeholder="e.g. /products?category=living-room"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Placement Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
              >
                <option value="hero">Hero Main Slider</option>
                <option value="promotional">Mid-page Promotional</option>
                <option value="festive">Festive Seasonal Deal</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Display Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-24 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-600"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-amber-600 rounded border-slate-300 focus:ring-amber-600"
              />
              <span className="text-xs font-bold text-slate-700">Publish Immediately (Active)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { useNavigate } from 'react-router-dom';
import { AdvertisementsService, type Advertisement, type AdStatus } from '../../services/advertisements';
import { Plus, Edit2, Trash2, Eye, EyeOff, BarChart3, MousePointer, Image as ImageIcon } from 'lucide-react';
import { Button, Badge } from '../../components/ui';

export const AdminAdsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const navigate = useNavigate();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin()) {
      navigate('/');
      return;
    }
    loadAds();
  }, [isSuperAdmin, navigate]);

  const loadAds = async () => {
    try {
      setLoading(true);
      const data = await AdvertisementsService.getAll();
      setAds(data);
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Advertisement',
      message: 'Are you sure you want to delete this advertisement? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'error'
    });
    
    if (!confirmed) return;
    
    try {
      await AdvertisementsService.delete(id);
      setAds(ads.filter(ad => ad.id !== id));
      showAlert({
        type: 'success',
        title: 'Success',
        message: 'Advertisement deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete ad:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete advertisement'
      });
    }
  };

  const toggleStatus = async (ad: Advertisement) => {
    const newStatus: AdStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const updated = await AdvertisementsService.update(ad.id, { status: newStatus });
      setAds(ads.map(a => a.id === ad.id ? updated : a));
      showAlert({
        type: 'success',
        title: 'Success',
        message: `Advertisement ${newStatus === 'ACTIVE' ? 'activated' : 'paused'} successfully`
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to update advertisement status'
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Advertisement Management
          </h1>
          <p className="text-slate-600 text-base mt-2 font-medium">
            Manage and monitor sponsored content across the platform
          </p>
        </div>
        <Button
          onClick={() => showAlert({ type: 'info', title: 'Coming Soon', message: 'Advertisement creation feature is coming soon!' })}
          icon={<Plus size={20} />}
          size="lg"
        >
          Create Advertisement
        </Button>
      </div>

      {/* Stats Cards with improved gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-blue-900/80 uppercase tracking-wide">Total Ads</h3>
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-black text-blue-900">{ads.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-emerald-900/80 uppercase tracking-wide">Active</h3>
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <Eye className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-4xl font-black text-emerald-900">{ads.filter(a => a.status === 'ACTIVE').length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-purple-900/80 uppercase tracking-wide">Impressions</h3>
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-4xl font-black text-purple-900">
              {ads.reduce((sum, ad) => sum + ad.impressions, 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-orange-900/80 uppercase tracking-wide">Clicks</h3>
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <MousePointer className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-4xl font-black text-orange-900">
              {ads.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Ads List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border-2 border-slate-200 rounded-2xl shadow-md overflow-hidden animate-pulse">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-72 h-56 lg:h-auto bg-gradient-to-br from-gray-200 to-gray-300" />
                  <div className="flex-1 p-6 space-y-4">
                    <div className="h-7 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="flex gap-3 mt-6">
                      <div className="h-11 bg-gray-200 rounded w-28" />
                      <div className="h-11 bg-gray-200 rounded w-24" />
                      <div className="h-11 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-300 shadow-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 mb-6 shadow-md">
              <ImageIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">No advertisements yet</h3>
            <p className="text-slate-600 max-w-md mx-auto mb-8 text-base">
              Create your first advertisement to start displaying sponsored content and reach your audience.
            </p>
            <Button
              onClick={() => showAlert({ type: 'info', title: 'Coming Soon', message: 'Advertisement creation feature is coming soon!' })}
              icon={<Plus size={20} />}
              size="lg"
            >
              Create Advertisement
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="group bg-card border-2 border-slate-200 rounded-2xl shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <div className="relative lg:w-72 h-56 lg:h-auto bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={ad.status === 'ACTIVE' ? 'success' : ad.status === 'PAUSED' ? 'warning' : 'default'}
                        size="lg"
                        icon
                      >
                        {ad.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-2 text-slate-900 truncate group-hover:text-blue-600 transition-colors">{ad.title}</h3>
                      {ad.description && (
                        <p className="text-slate-600 line-clamp-2 text-base">{ad.description}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Priority</p>
                        <p className="text-2xl font-black text-slate-900">{ad.priority}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Impressions</p>
                        <p className="text-2xl font-black text-purple-900">{ad.impressions.toLocaleString()}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                        <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">Clicks</p>
                        <p className="text-2xl font-black text-orange-900">{ad.clicks.toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">CTR</p>
                        <p className="text-2xl font-black text-blue-900">
                          {ad.impressions > 0
                            ? ((ad.clicks / ad.impressions) * 100).toFixed(2)
                            : '0.00'}
                          %
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => toggleStatus(ad)}
                        variant="secondary"
                        size="md"
                        icon={ad.status === 'ACTIVE' ? <EyeOff size={16} /> : <Eye size={16} />}
                      >
                        {ad.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                      </Button>
                      <Button
                        onClick={() => {/* TODO: Open edit modal */}}
                        variant="outline"
                        size="md"
                        icon={<Edit2 size={16} />}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(ad.id)}
                        variant="destructive"
                        size="md"
                        icon={<Trash2 size={16} />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

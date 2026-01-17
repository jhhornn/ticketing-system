import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AdvertisementsService, Advertisement, AdPlacement, AdStatus } from '../../services/advertisements';
import { Plus, Edit2, Trash2, Eye, EyeOff, TrendingUp } from 'lucide-react';

export const AdminAdsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    if (!confirm('Are you sure you want to delete this advertisement?')) return;
    
    try {
      await AdvertisementsService.delete(id);
      setAds(ads.filter(ad => ad.id !== id));
    } catch (error) {
      console.error('Failed to delete ad:', error);
      alert('Failed to delete advertisement');
    }
  };

  const toggleStatus = async (ad: Advertisement) => {
    const newStatus: AdStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const updated = await AdvertisementsService.update(ad.id, { status: newStatus });
      setAds(ads.map(a => a.id === ad.id ? updated : a));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update advertisement status');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Advertisement Management
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Manage sponsored content across the platform
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-soft hover:shadow-glow hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Create Advertisement
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Ads</h3>
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{ads.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Active</h3>
            <Eye className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{ads.filter(a => a.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Impressions</h3>
            <Eye className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {ads.reduce((sum, ad) => sum + ad.impressions, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Clicks</h3>
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {ads.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Ads List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border shadow-soft">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No advertisements yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Create your first advertisement to start displaying sponsored content.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Create Advertisement
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="bg-card border rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <div className="lg:w-64 h-48 lg:h-auto bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold mb-2 truncate">{ad.title}</h3>
                        {ad.description && (
                          <p className="text-muted-foreground line-clamp-2">{ad.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ad.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : ad.status === 'PAUSED'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {ad.status}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Priority</p>
                        <p className="text-lg font-semibold">{ad.priority}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Impressions</p>
                        <p className="text-lg font-semibold">{ad.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p className="text-lg font-semibold">{ad.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CTR</p>
                        <p className="text-lg font-semibold">
                          {ad.impressions > 0
                            ? ((ad.clicks / ad.impressions) * 100).toFixed(2)
                            : '0.00'}
                          %
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleStatus(ad)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
                      >
                        {ad.status === 'ACTIVE' ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {/* TODO: Open edit modal */}}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
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

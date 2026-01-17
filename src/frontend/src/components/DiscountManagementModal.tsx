import React, { useState, useEffect } from 'react';
import { X, Plus, ToggleLeft, ToggleRight, Calendar, Users, Percent, DollarSign } from 'lucide-react';
import { DiscountsService, type Discount, type CreateDiscountData } from '../services/discounts';

interface DiscountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  eventName: string;
}

export const DiscountManagementModal: React.FC<DiscountManagementModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName,
}) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState<CreateDiscountData>({
    code: '',
    amount: 0,
    type: 'PERCENTAGE',
    eventId,
  });

  useEffect(() => {
    if (isOpen) {
      loadDiscounts();
    }
  }, [isOpen, eventId]);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DiscountsService.getByEventId(eventId);
      setDiscounts(data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load discounts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DiscountsService.create(createFormData);
      await loadDiscounts();
      setIsCreating(false);
      setCreateFormData({
        code: '',
        amount: 0,
        type: 'PERCENTAGE',
        eventId,
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create discount');
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    try {
      if (discount.isActive) {
        await DiscountsService.deactivate(parseInt(discount.id));
      } else {
        await DiscountsService.activate(parseInt(discount.id));
      }
      await loadDiscounts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to toggle discount');
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    try {
      await DiscountsService.delete(parseInt(id));
      await loadDiscounts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete discount');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (discount: Discount) => {
    if (!discount.validUntil) return false;
    return new Date(discount.validUntil) < new Date();
  };

  const isLimitReached = (discount: Discount) => {
    if (!discount.usageLimit) return false;
    return discount.usageCount >= discount.usageLimit;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Discount Management</h2>
            <p className="text-gray-600">{eventName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: '#fafafa' }}>
          {/* Create Discount Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Create New Discount
              </button>
            ) : (
              <form onSubmit={handleCreateDiscount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Discount Code *</label>
                    <input
                      type="text"
                      value={createFormData.code}
                      onChange={(e) => setCreateFormData({ ...createFormData, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER2025"
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Type *</label>
                    <select
                      value={createFormData.type}
                      onChange={(e) => setCreateFormData({ ...createFormData, type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED_AMOUNT">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      {createFormData.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount ($)'} *
                    </label>
                    <input
                      type="number"
                      value={createFormData.amount}
                      onChange={(e) => setCreateFormData({ ...createFormData, amount: parseFloat(e.target.value) })}
                      min="0"
                      max={createFormData.type === 'PERCENTAGE' ? '100' : undefined}
                      step="0.01"
                      required
                      className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Usage Limit (Early Bird)</label>
                    <input
                      type="number"
                      value={createFormData.usageLimit || ''}
                      onChange={(e) => setCreateFormData({ ...createFormData, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Leave empty for unlimited"
                      min="1"
                      className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Valid From</label>
                    <input
                      type="datetime-local"
                      value={createFormData.validFrom || ''}
                      onChange={(e) => setCreateFormData({ ...createFormData, validFrom: e.target.value })}
                      className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Valid Until</label>
                    <input
                      type="datetime-local"
                      value={createFormData.validUntil || ''}
                      onChange={(e) => setCreateFormData({ ...createFormData, validUntil: e.target.value })}
                      className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
                  >
                    Create Discount
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Discounts List */}
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-semibold">Error loading discounts</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={loadDiscounts}
                className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-8 text-gray-600">Loading discounts...</div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No discounts created yet. Create one to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {discounts.map((discount) => (
                <div
                  key={discount.id}
                  className={`border rounded-lg p-4 ${
                    !discount.isActive
                      ? 'bg-muted/50 border-muted'
                      : isExpired(discount) || isLimitReached(discount)
                      ? 'bg-destructive/10 border-destructive/30'
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-lg font-bold bg-primary/10 px-3 py-1 rounded">
                          {discount.code}
                        </code>
                        <div className="flex items-center gap-2 text-sm">
                          {discount.type === 'PERCENTAGE' ? (
                            <span className="flex items-center gap-1 text-primary">
                              <Percent className="w-4 h-4" />
                              {discount.amount}% off
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-primary">
                              <DollarSign className="w-4 h-4" />
                              ${discount.amount} off
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(discount.validFrom)}
                          {discount.validUntil && ` - ${formatDate(discount.validUntil)}`}
                        </div>
                        {discount.usageLimit && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {discount.usageCount} / {discount.usageLimit} used
                          </div>
                        )}
                        {!discount.usageLimit && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {discount.usageCount} used
                          </div>
                        )}
                      </div>

                      {isExpired(discount) && (
                        <div className="mt-2 text-destructive text-sm font-medium">⚠️ Expired</div>
                      )}
                      {isLimitReached(discount) && (
                        <div className="mt-2 text-destructive text-sm font-medium">⚠️ Usage limit reached</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(discount)}
                        className={`p-2 rounded-lg transition-colors ${
                          discount.isActive
                            ? 'text-primary hover:bg-primary/10'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                        title={discount.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {discount.isActive ? (
                          <ToggleRight className="w-6 h-6" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteDiscount(discount.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// src/frontend/src/components/EventSectionsModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Edit } from 'lucide-react';
import { EventSectionsService, type EventSection, type CreateSectionData, type SectionType } from '../services/EventSectionsService';
import { useModal } from '../context/ModalContext';

interface EventSectionsModalProps {
  eventId: number;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EventSectionsModal: React.FC<EventSectionsModalProps> = ({
  eventId,
  eventName,
  isOpen,
  onClose,
}) => {
  const { showAlert, showConfirm } = useModal();
  const [sections, setSections] = useState<EventSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSection, setEditingSection] = useState<EventSection | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateSectionData>({
    eventId,
    name: '',
    type: 'GENERAL',
    price: 0,
    totalCapacity: 100,
    generateSeats: false,
    rows: 10,
    seatsPerRow: 10,
  });

  useEffect(() => {
    if (isOpen) {
      loadSections();
    }
  }, [isOpen, eventId]);


  const loadSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EventSectionsService.getByEvent(eventId);
      setSections(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string }; status?: number }; message?: string };
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load sections';
      console.error('Failed to load sections:', error);
      setError(`Failed to load sections: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      await EventSectionsService.create(formData);
      await loadSections();
      setIsAdding(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create section');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Delete Section',
      message: 'Are you sure you want to delete this section? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'error'
    });

    if (!confirmed) return;

    try {
      setError(null);
      await EventSectionsService.delete(id);
      await loadSections();
      showAlert({
        type: 'success',
        title: 'Success',
        message: 'Section deleted successfully'
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to delete section';
      setError(errorMessage);
      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    }
  };

  const resetForm = () => {
    setFormData({
      eventId,
      name: '',
      type: 'GENERAL',
      price: 0,
      totalCapacity: 100,
      generateSeats: false,
      rows: 10,
      seatsPerRow: 10,
    });
    setEditingSection(null);
  };

  const handleEdit = (section: EventSection) => {
    setEditingSection(section);
    setFormData({
      eventId,
      name: section.name,
      type: section.type,
      price: section.price,
      totalCapacity: section.totalCapacity,
      generateSeats: false,
      rows: 10,
      seatsPerRow: 10,
    });
    setIsAdding(true);
  };

  const handleUpdate = async () => {
    if (!editingSection) return;

    try {
      setError(null);
      await EventSectionsService.update(editingSection.id, {
        name: formData.name,
        price: formData.price,
        totalCapacity: formData.totalCapacity,
      });
      
      await loadSections();
      setIsAdding(false);
      resetForm();
      
      showAlert({
        type: 'success',
        title: 'Success',
        message: 'Section updated successfully'
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to update section';
      setError(errorMessage);
      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    }
  };

  const handleTypeChange = (type: SectionType) => {
    setFormData({
      ...formData,
      type,
      generateSeats: type === 'ASSIGNED',
    });
  };

  const handleCapacityChange = (totalCapacity: number) => {
    // Auto-adjust rows/seatsPerRow to match capacity for ASSIGNED sections
    if (formData.type === 'ASSIGNED' && formData.generateSeats) {
      const rows = Math.ceil(Math.sqrt(totalCapacity));
      const seatsPerRow = Math.ceil(totalCapacity / rows);
      setFormData({ ...formData, totalCapacity, rows, seatsPerRow });
    } else {
      setFormData({ ...formData, totalCapacity });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Sections</h2>
            <p className="text-sm text-gray-600 mt-1">{eventName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Important Notice */}
          {sections.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Section Deletion Rules</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Sections cannot be deleted after bookings have been made</li>
                    <li>• Sections inherited from registered venues (auto-created) cannot be deleted</li>
                    <li>• Manually created sections can be deleted even if event uses a registered venue</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Existing Sections */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading sections...</div>
          ) : sections.length === 0 && !isAdding ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No sections yet</p>
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add First Section
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{section.name}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              section.type === 'GENERAL'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {section.type === 'GENERAL' ? 'General Admission' : 'Assigned Seating'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Price:</span>
                            <span className="ml-2 font-medium">
                              {section.price === 0 ? 'Free' : `$${section.price.toFixed(2)}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Capacity:</span>
                            <span className="ml-2 font-medium">{section.totalCapacity}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Available:</span>
                            <span className="ml-2 font-medium text-green-600">
                              {section.available}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Sold:</span>
                            <span className="ml-2 font-medium text-blue-600">
                              {section.allocated}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(section)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded hover:bg-blue-50 transition-colors"
                          title="Edit section"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(section.id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
                          title="Delete section"
                          disabled={section.allocated > 0}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {section.allocated > 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠️ Cannot delete - tickets already allocated
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Another Section
                </button>
              )}
            </>
          )}

          {/* Add/Edit Section Form */}
          {isAdding && (
            <div className="border-2 border-blue-300 rounded-lg p-6 bg-blue-50">
              <h3 className="font-semibold text-lg mb-4">
                {editingSection ? 'Edit Section' : 'Add New Section'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., General Admission, VIP, Balcony"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {!editingSection && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleTypeChange('GENERAL')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          formData.type === 'GENERAL'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-semibold">General Admission</div>
                        <div className="text-xs text-gray-600 mt-1">
                          First come, first served
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTypeChange('ASSIGNED')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          formData.type === 'ASSIGNED'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        <div className="font-semibold">Assigned Seating</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Specific seat selection
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFormData({ ...formData, price: 0 });
                        } else {
                          setFormData({ ...formData, price: parseFloat(value) || 0 });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Capacity *
                      {editingSection && editingSection.allocated > 0 && (
                        <span className="text-xs text-amber-600 ml-2">
                          (Min: {editingSection.allocated} - tickets already sold)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min={editingSection?.allocated || 1}
                      value={formData.totalCapacity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFormData({ ...formData, totalCapacity: 0 });
                        } else {
                          handleCapacityChange(parseInt(value) || 0);
                        }
                      }}
                      onBlur={() => {
                        // Set minimum value on blur if empty
                        const minCapacity = editingSection?.allocated || 1;
                        if (formData.totalCapacity < minCapacity) {
                          handleCapacityChange(minCapacity);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={editingSection?.allocated === editingSection?.totalCapacity}
                    />
                    {editingSection?.allocated === editingSection?.totalCapacity && (
                      <p className="text-xs text-amber-600 mt-1">
                        Cannot change capacity - all seats are sold
                      </p>
                    )}
                  </div>
                </div>

                {!editingSection && formData.type === 'ASSIGNED' && formData.generateSeats && (
                  <div className="bg-white border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={formData.generateSeats}
                        onChange={(e) =>
                          setFormData({ ...formData, generateSeats: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Auto-generate seats
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Rows</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.rows}
                          onChange={(e) => {
                            const rows = parseInt(e.target.value) || 1;
                            const seatsPerRow = formData.seatsPerRow || 1;
                            setFormData({
                              ...formData,
                              rows,
                              totalCapacity: rows * seatsPerRow,
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Seats per Row</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.seatsPerRow}
                          onChange={(e) => {
                            const seatsPerRow = parseInt(e.target.value) || 1;
                            const rows = formData.rows || 1;
                            setFormData({
                              ...formData,
                              seatsPerRow,
                              totalCapacity: rows * seatsPerRow,
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Will generate {formData.rows || 0} × {formData.seatsPerRow || 0} ={' '}
                      {(formData.rows || 0) * (formData.seatsPerRow || 0)} seats
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={editingSection ? handleUpdate : handleCreate}
                    disabled={!formData.name || formData.totalCapacity < (editingSection?.allocated || 1)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {editingSection ? 'Update Section' : 'Create Section'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

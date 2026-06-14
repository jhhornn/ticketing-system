// src/frontend/src/components/EventSectionsModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Edit, Info } from 'lucide-react';
import { EventSectionsService, type EventSection, type CreateSectionData, type SectionType } from '../services/event-sections';
import { useModal } from '../hooks/useModal';

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
  const [, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSection, setEditingSection] = useState<EventSection | null>(null);

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

  const loadSections = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EventSectionsService.getByEvent(eventId);
      setSections(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string }; status?: number }; message?: string };
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load sections';
      console.error('Failed to load sections:', error);
      showAlert({ 
        type: 'error', 
        title: 'Failed to Load Sections', 
        message: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, showAlert, setError]);

  useEffect(() => {
    if (isOpen) {
      loadSections();
    }
  }, [isOpen, loadSections]);

  const handleCreate = async () => {
    try {
      setError(null);
      await EventSectionsService.create(formData);
      await loadSections();
      setIsAdding(false);
      resetForm();
      showAlert({ type: 'success', title: 'Success', message: 'Section created successfully' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to create section';
      showAlert({ 
        type: 'error', 
        title: 'Failed to Create Section', 
        message: errorMessage 
      });
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
      showAlert({ type: 'success', title: 'Success', message: 'Section deleted successfully' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to delete section';
      setError(errorMessage);
      showAlert({ type: 'error', title: 'Error', message: errorMessage });
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
      generateSeats: section.type === 'ASSIGNED', // Assume if editing assigned, seats were generated
      rows: 10, // These would need to be fetched/stored if accurate representation needed
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
      
      showAlert({ type: 'success', title: 'Success', message: 'Section updated successfully' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to update section';
      setError(errorMessage);
      showAlert({ type: 'error', title: 'Error', message: errorMessage });
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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-4xl rounded-xl border shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold font-poppins">Manage Sections</h2>
            <p className="text-sm text-muted-foreground">{eventName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-muted/30 border border-border rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-1">Important Notes on Sections:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Sections cannot be deleted if they have allocated tickets.</li>
                <li>Sections inherited from registered venues cannot be deleted or modified beyond capacity.</li>
                <li>Changes to capacity in assigned seating will attempt to re-generate seat layouts.</li>
              </ul>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading sections...</div>
          ) : sections.length === 0 && !isAdding ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold font-poppins mb-2">No Sections Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                Add the first section to your event to define ticket types and capacities.
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} />
                Add First Section
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="border rounded-lg p-4 bg-card shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{section.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 text-xs rounded-full font-bold ${
                            section.type === 'GENERAL'
                              ? 'bg-blue-500/20 text-blue-700'
                              : 'bg-purple-500/20 text-purple-700'
                          }`}
                        >
                          {section.type === 'GENERAL' ? 'General Admission' : 'Assigned Seating'}
                        </span>
                        {section.allocated > 0 && (
                            <span className="px-2.5 py-0.5 text-xs rounded-full font-bold bg-green-500/20 text-green-700">
                                {section.allocated} Sold
                            </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div>Price: <span className="font-medium text-foreground">{section.price === 0 ? 'Free' : `$${section.price.toFixed(2)}`}</span></div>
                        <div>Capacity: <span className="font-medium text-foreground">{section.totalCapacity}</span></div>
                        <div>Available: <span className="font-medium text-green-500">{section.available}</span></div>
                        <div>Allocated: <span className="font-medium text-orange-500">{section.allocated}</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={() => handleEdit(section)}
                            className="p-2 rounded-full hover:bg-secondary transition-colors"
                            title="Edit section"
                        >
                            <Edit size={18} />
                        </button>
                        <button
                            onClick={() => handleDelete(section.id)}
                            className="p-2 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                            title="Delete section"
                            disabled={section.allocated > 0}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </div>
                ))}
              </div>

              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full border-2 border-dashed border-border rounded-lg p-4 text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <Plus size={20} />
                  Add Another Section
                </button>
              )}
            </>
          )}

          {isAdding && (
            <div className="border border-primary rounded-lg p-6 bg-primary/10 mt-6">
              <h3 className="font-bold text-xl mb-4">{editingSection ? 'Edit Section' : 'Add New Section'}</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="sectionName" className="text-sm font-semibold">Section Name</label>
                  <input
                    type="text"
                    id="sectionName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., General Admission, VIP, Balcony"
                    className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                  />
                </div>

                {!editingSection && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Section Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleTypeChange('GENERAL')}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          formData.type === 'GENERAL'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-secondary'
                        }`}
                      >
                        <div className="font-bold">General Admission</div>
                        <div className="text-xs text-muted-foreground mt-1">First come, first served.</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTypeChange('ASSIGNED')}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          formData.type === 'ASSIGNED'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-secondary'
                        }`}
                      >
                        <div className="font-bold">Assigned Seating</div>
                        <div className="text-xs text-muted-foreground mt-1">Specific seat selection.</div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-semibold">Price ($)</label>
                    <input
                      type="number"
                      id="price"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="totalCapacity" className="text-sm font-semibold">
                      Total Capacity
                      {editingSection && editingSection.allocated > 0 && (
                        <span className="ml-2 text-xs text-orange-500">(Min: {editingSection.allocated})</span>
                      )}
                    </label>
                    <input
                      type="number"
                      id="totalCapacity"
                      min={editingSection?.allocated || 1}
                      value={formData.totalCapacity}
                      onChange={(e) => handleCapacityChange(parseInt(e.target.value) || 0)}
                      onBlur={(e) => {
                        const minCapacity = editingSection?.allocated || 1;
                        if (parseInt(e.target.value) < minCapacity) {
                            handleCapacityChange(minCapacity);
                        }
                      }}
                      className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                      disabled={!!(editingSection && editingSection.allocated === editingSection.totalCapacity)}
                    />
                    {editingSection && editingSection.allocated === editingSection.totalCapacity && (
                      <p className="text-xs text-orange-500 mt-1">Cannot change capacity - all seats are sold.</p>
                    )}
                  </div>
                </div>

                {!editingSection && formData.type === 'ASSIGNED' && (
                  <div className="space-y-2 p-4 border rounded-lg bg-background">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="generateSeats"
                        checked={formData.generateSeats}
                        onChange={(e) => setFormData({ ...formData, generateSeats: e.target.checked })}
                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                      />
                      <label htmlFor="generateSeats" className="text-sm font-semibold">Auto-generate Seats</label>
                    </div>
                    {formData.generateSeats && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2">
                          <label htmlFor="rows" className="text-xs font-semibold text-muted-foreground">Rows</label>
                          <input
                            type="number"
                            id="rows"
                            min="1"
                            value={formData.rows}
                            onChange={(e) => {
                              const rows = parseInt(e.target.value) || 1;
                              const seatsPerRow = formData.seatsPerRow || 1;
                              setFormData({ ...formData, rows, totalCapacity: rows * seatsPerRow });
                            }}
                            className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="seatsPerRow" className="text-xs font-semibold text-muted-foreground">Seats per Row</label>
                          <input
                            type="number"
                            id="seatsPerRow"
                            min="1"
                            value={formData.seatsPerRow}
                            onChange={(e) => {
                              const seatsPerRow = parseInt(e.target.value) || 1;
                              const rows = formData.rows || 1;
                              setFormData({ ...formData, seatsPerRow, totalCapacity: rows * seatsPerRow });
                            }}
                            className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                          />
                        </div>
                        <p className="col-span-2 text-xs text-muted-foreground mt-1">
                          Generates {formData.rows || 0} × {formData.seatsPerRow || 0} = {(formData.rows || 0) * (formData.seatsPerRow || 0)} seats.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={editingSection ? handleUpdate : handleCreate}
                    disabled={!formData.name || formData.totalCapacity < (editingSection?.allocated || 1) || loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Save size={18} />
                    {editingSection ? 'Update Section' : 'Add Section'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      resetForm();
                    }}
                    className="px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-6 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

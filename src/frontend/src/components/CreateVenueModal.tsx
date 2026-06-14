import React, { useState } from 'react';
import { VenuesService, type CreateVenueData, type SectionType } from '../services/venues';
import { ModalActionButton } from './ui';
import { X, Building, MapPin, Users, Plus, Trash2, Armchair } from 'lucide-react';

interface CreateVenueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateVenueModal: React.FC<CreateVenueModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<CreateVenueData>({
        name: '',
        address: '',
        capacity: 0,
        city: '',
        state: '',
        country: '',
        sections: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await VenuesService.create(formData);
            onSuccess();
            onClose();
            setFormData({
                name: '',
                address: '',
                capacity: 0,
                city: '',
                state: '',
                country: '',
                sections: [],
            });
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            setError(error.response?.data?.message || error.message || 'Failed to create venue');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value,
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-xl border shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold font-poppins">Add New Venue</h2>
                        <p className="text-sm text-muted-foreground">Create a new venue for hosting events</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                                <Building className="w-4 h-4 text-primary" />
                                Venue Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                                placeholder="e.g., Grand Concert Hall"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                Address
                            </label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                                placeholder="e.g., 123 Main Street"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="city" className="text-sm font-semibold">City</label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                                    placeholder="e.g., New York"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="state" className="text-sm font-semibold">State</label>
                                <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                                    placeholder="e.g., NY"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="country" className="text-sm font-semibold">Country</label>
                                <input
                                    type="text"
                                    id="country"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                                    placeholder="e.g., USA"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="capacity" className="text-sm font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                Capacity
                            </label>
                            <input
                                type="number"
                                id="capacity"
                                name="capacity"
                                value={formData.capacity || ''}
                                onChange={handleChange}
                                required
                                min="1"
                                className="w-full bg-input rounded-md border px-3 py-2 text-sm"
                                placeholder="e.g., 1000"
                            />
                            <p className="text-xs text-muted-foreground">Maximum number of people the venue can accommodate</p>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Armchair className="w-4 h-4 text-primary" />
                                    Venue Sections
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            sections: [
                                                ...(prev.sections || []),
                                                { name: '', type: 'ASSIGNED', totalCapacity: 0 },
                                            ],
                                        }));
                                    }}
                                    className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-primary/90 transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Section
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">Define reusable sections for events at this venue</p>

                            {formData.sections && formData.sections.length > 0 ? (
                                <div className="space-y-3">
                                    {formData.sections.map((section, index) => (
                                        <div key={index} className="border rounded-lg p-4 bg-muted/30">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-semibold">Section {index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            sections: prev.sections?.filter((_, i) => i !== index),
                                                        }));
                                                    }}
                                                    className="p-1 text-destructive hover:bg-destructive/10 rounded-full"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold">Section Name</label>
                                                    <input
                                                        type="text"
                                                        value={section.name}
                                                        onChange={(e) => {
                                                            const newSections = [...(formData.sections || [])];
                                                            newSections[index] = { ...newSections[index], name: e.target.value };
                                                            setFormData(prev => ({ ...prev, sections: newSections }));
                                                        }}
                                                        required
                                                        className="w-full bg-input rounded-md border px-2 py-1.5 text-sm"
                                                        placeholder="e.g., VIP, Orchestra"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold">Type</label>
                                                    <select
                                                        value={section.type}
                                                        onChange={(e) => {
                                                            const newSections = [...(formData.sections || [])];
                                                            newSections[index] = { 
                                                                ...newSections[index], 
                                                                type: e.target.value as SectionType,
                                                                ...(e.target.value === 'GENERAL' ? { rows: undefined, seatsPerRow: undefined } : {}),
                                                            };
                                                            setFormData(prev => ({ ...prev, sections: newSections }));
                                                        }}
                                                        className="w-full bg-input rounded-md border px-2 py-1.5 text-sm"
                                                    >
                                                        <option value="ASSIGNED">Assigned Seating</option>
                                                        <option value="GENERAL">General Admission</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-1 mt-3">
                                                <label className="text-xs font-semibold">Total Capacity</label>
                                                <input
                                                    type="number"
                                                    value={section.totalCapacity || ''}
                                                    onChange={(e) => {
                                                        const newSections = [...(formData.sections || [])];
                                                        newSections[index] = { ...newSections[index], totalCapacity: parseInt(e.target.value) || 0 };
                                                        setFormData(prev => ({ ...prev, sections: newSections }));
                                                    }}
                                                    required
                                                    min="1"
                                                    className="w-full bg-input rounded-md border px-2 py-1.5 text-sm"
                                                    placeholder="e.g., 100"
                                                />
                                            </div>

                                            {section.type === 'ASSIGNED' && (
                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold">Rows</label>
                                                        <input
                                                            type="number"
                                                            value={section.rows || ''}
                                                            onChange={(e) => {
                                                                const newSections = [...(formData.sections || [])];
                                                                newSections[index] = { ...newSections[index], rows: parseInt(e.target.value) || undefined };
                                                                setFormData(prev => ({ ...prev, sections: newSections }));
                                                            }}
                                                            required={section.type === 'ASSIGNED'}
                                                            min="1"
                                                            className="w-full bg-input rounded-md border px-2 py-1.5 text-sm"
                                                            placeholder="e.g., 10"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold">Seats Per Row</label>
                                                        <input
                                                            type="number"
                                                            value={section.seatsPerRow || ''}
                                                            onChange={(e) => {
                                                                const newSections = [...(formData.sections || [])];
                                                                newSections[index] = { ...newSections[index], seatsPerRow: parseInt(e.target.value) || undefined };
                                                                setFormData(prev => ({ ...prev, sections: newSections }));
                                                            }}
                                                            required={section.type === 'ASSIGNED'}
                                                            min="1"
                                                            className="w-full bg-input rounded-md border px-2 py-1.5 text-sm"
                                                            placeholder="e.g., 10"
                                                        />
                                                    </div>
                                                    {section.type === 'ASSIGNED' && section.rows && section.seatsPerRow && (
                                                        <p className="col-span-2 text-xs text-muted-foreground mt-1">
                                                            💡 Generates {section.rows * section.seatsPerRow} individual seats.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                                    <Armchair className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm mb-3">No sections defined yet</p>
                                    <p className="text-xs">Add sections to organize seating within your venue.</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <ModalActionButton
                                type="button"
                                variant="cancel"
                                fullWidth
                                onClick={onClose}
                                className="rounded-md text-sm transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </ModalActionButton>
                            <ModalActionButton
                                type="submit"
                                variant="primary"
                                fullWidth
                                className="rounded-md text-sm transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Venue'}
                            </ModalActionButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

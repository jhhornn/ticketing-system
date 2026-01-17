import React, { useState } from 'react';
import { VenuesService, type CreateVenueData, type SectionType } from '../services/venues';
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
            // Reset form
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value,
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-xl border shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Add New Venue</h2>
                        <p className="text-sm text-muted-foreground">Create a new venue for hosting events</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                                <Building className="w-4 h-4 text-primary" />
                                Venue Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Grand Concert Hall"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                Address
                            </label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="123 Main Street"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="city" className="text-sm font-medium">
                                    City
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="New York"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="state" className="text-sm font-medium">
                                    State
                                </label>
                                <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="NY"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="country" className="text-sm font-medium">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    id="country"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="USA"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="capacity" className="text-sm font-medium flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                Capacity <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="number"
                                id="capacity"
                                name="capacity"
                                value={formData.capacity || ''}
                                onChange={handleChange}
                                required
                                min="1"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="1000"
                            />
                            <p className="text-xs text-muted-foreground">Maximum number of people the venue can accommodate</p>
                        </div>

                        {/* Sections */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium flex items-center gap-2">
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
                                    className="h-8 px-3 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md font-medium transition-colors gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Section
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">Define reusable sections that will be automatically inherited when creating events at this venue</p>

                            {formData.sections && formData.sections.length > 0 ? (
                                <div className="space-y-3">
                                    {formData.sections.map((section, index) => (
                                        <div key={index} className="border rounded-lg p-4 space-y-3 bg-secondary/30">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Section {index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            sections: prev.sections?.filter((_, i) => i !== index),
                                                        }));
                                                    }}
                                                    className="text-destructive hover:text-destructive/80 p-1 hover:bg-destructive/10 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium">Section Name *</label>
                                                    <input
                                                        type="text"
                                                        value={section.name}
                                                        onChange={(e) => {
                                                            const newSections = [...(formData.sections || [])];
                                                            newSections[index] = { ...newSections[index], name: e.target.value };
                                                            setFormData(prev => ({ ...prev, sections: newSections }));
                                                        }}
                                                        required
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                        placeholder="VIP, Orchestra, Balcony"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium">Type *</label>
                                                    <select
                                                        value={section.type}
                                                        onChange={(e) => {
                                                            const newSections = [...(formData.sections || [])];
                                                            newSections[index] = { 
                                                                ...newSections[index], 
                                                                type: e.target.value as SectionType,
                                                                // Clear rows/seatsPerRow if switching to GENERAL
                                                                ...(e.target.value === 'GENERAL' ? { rows: undefined, seatsPerRow: undefined } : {}),
                                                            };
                                                            setFormData(prev => ({ ...prev, sections: newSections }));
                                                        }}
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    >
                                                        <option value="ASSIGNED">Assigned Seating</option>
                                                        <option value="GENERAL">General Admission</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium">Total Capacity *</label>
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
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    placeholder="100"
                                                />
                                            </div>

                                            {section.type === 'ASSIGNED' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium">Rows *</label>
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
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="10"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium">Seats Per Row *</label>
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
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="10"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {section.type === 'ASSIGNED' && section.rows && section.seatsPerRow && (
                                                <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                                                    💡 Will generate {section.rows * section.seatsPerRow} individual seats (rows × seats per row)
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                    <Armchair className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground mb-3">No sections defined yet</p>
                                    <p className="text-xs text-muted-foreground">Sections are optional but recommended for organized seating</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Venue'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

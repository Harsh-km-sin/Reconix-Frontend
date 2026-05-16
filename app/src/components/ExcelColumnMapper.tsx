import { useState, useEffect } from 'react';
import { ArrowRight, Check, MapPin, Save, List } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ColumnMapping {
    required: string[];
    optional: string[];
}

interface FileData {
    fileName: string;
    selectedSheet: string | null;
    headers: string[];
    rawRows: any[];
}

export function ExcelColumnMapper({
    fileData,
    jobType,
    onMappingComplete,
    onBack
}: {
    fileData: FileData;
    jobType: string;
    onMappingComplete: (mappedData: any[]) => void;
    onBack: () => void;
}) {
    const getRequiredFields = (): ColumnMapping => {
        switch (jobType) {
            case 'INVOICE_REVERSAL':
                return {
                    required: ['Invoice Number', 'Amount'],
                    optional: ['Vendor Name', 'Date']
                };
            case 'OVERPAYMENT_ALLOCATION':
                return {
                    required: ['Vendor Name', 'Amount'],
                    optional: ['Invoice Number', 'Overpayment Ref']
                };
            default:
                return { required: ['Reference', 'Amount'], optional: [] };
        }
    };

    const fields = getRequiredFields();
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [templates, setTemplates] = useState<any[]>([]);
    const [showTemplateNameInput, setShowTemplateNameInput] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, [jobType]);

    const fetchTemplates = async () => {
        try {
            const res: any = await api.get(`/excel/mapping?jobType=${jobType}`);
            setTemplates(res);
        } catch (error) {
            console.error('Failed to fetch templates');
        }
    };

    const saveTemplate = async () => {
        if (!newTemplateName.trim()) {
            toast.error('Please provide a template name');
            return;
        }
        try {
            await api.post('/excel/mapping', {
                name: newTemplateName,
                jobType,
                mapping
            });
            toast.success('Template saved!');
            setShowTemplateNameInput(false);
            setNewTemplateName('');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to save template');
        }
    };

    const applyTemplate = (template: any) => {
        // Only apply headers that actually exist in the current file
        const newMapping: Record<string, string> = {};
        Object.entries(template.mapping).forEach(([target, source]) => {
            if (fileData.headers.includes(source as string)) {
                newMapping[target] = source as string;
            }
        });
        setMapping(newMapping);
        toast.success(`Applied template: ${template.name}`);
    };

    const handleMap = (targetField: string, sourceHeader: string) => {
        setMapping(prev => ({ ...prev, [targetField]: sourceHeader }));
    };

    const isComplete = fields.required.every(f => mapping[f]);

    const handleComplete = () => {
        if (!isComplete) return;

        // Transform rawRows into mapped format
        const mappedData = fileData.rawRows.map(row => {
            const item: any = {};
            Object.entries(mapping).forEach(([target, source]) => {
                // Ensure field names are consistent for the review screen
                item[target] = row[source];
            });
            return item;
        });

        onMappingComplete(mappedData);
    };

    return (
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-8 animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Map Excel Columns</h3>
                    <p className="text-[#555555]">
                        Match your spreadsheet columns from "{fileData.selectedSheet}" to our required fields.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    {templates.length > 0 && (
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] rounded-md text-sm font-medium hover:bg-[#F5F5F5]">
                                <List className="w-4 h-4" /> Load Template
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#E0E0E0] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible z-50">
                                <div className="p-3 border-b border-[#F5F5F5] font-semibold text-xs text-[#8A8A8A] uppercase tracking-wider">Your Templates</div>
                                <div className="max-h-48 overflow-y-auto">
                                    {templates.map(t => (
                                        <button 
                                            key={t.id}
                                            onClick={() => applyTemplate(t)}
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-[#E5F6FC] hover:text-[#13B5EA] transition-colors border-b last:border-0 border-[#F5F5F5]"
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 bg-[#E5F6FC] px-4 py-2 rounded-lg">
                        <MapPin className="w-4 h-4 text-[#13B5EA]" />
                        <span className="font-bold text-[#13B5EA] text-sm">{Object.keys(mapping).length} / {fields.required.length + fields.optional.length} Mapped</span>
                    </div>
                </div>
            </div>

            {/* Template Save Section */}
            {isComplete && !showTemplateNameInput && (
                <div className="mb-8 p-4 bg-[#F8F9FA] border border-dashed border-[#E0E0E0] rounded-lg flex items-center justify-between">
                    <p className="text-sm text-[#555555]">Save this mapping as a template for future uploads?</p>
                    <button 
                        onClick={() => setShowTemplateNameInput(true)}
                        className="flex items-center gap-2 text-sm font-bold text-[#13B5EA] hover:underline"
                    >
                        <Save className="w-4 h-4" /> Save as Template
                    </button>
                </div>
            )}

            {showTemplateNameInput && (
                <div className="mb-8 p-4 bg-[#F8F9FA] border border-[#13B5EA] rounded-lg flex items-center gap-3">
                    <input 
                        type="text" 
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Template Name (e.g. QBR Vendor List)"
                        className="flex-1 h-10 px-3 border border-[#E0E0E0] rounded focus:outline-none focus:border-[#13B5EA]"
                    />
                    <button 
                        onClick={saveTemplate}
                        className="px-4 h-10 bg-[#13B5EA] text-white rounded font-bold text-sm hover:bg-[#0E92BC]"
                    >
                        Save
                    </button>
                    <button 
                        onClick={() => setShowTemplateNameInput(false)}
                        className="px-4 h-10 bg-white border border-[#E0E0E0] text-[#555555] rounded font-bold text-sm hover:bg-[#F5F5F5]"
                    >
                        Cancel
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Required Fields */}
                <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide mb-4">
                        Required Fields <span className="text-[#E53935]">*</span>
                    </h4>
                    <div className="space-y-4">
                        {fields.required.map(field => (
                            <div key={field} className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="font-medium text-[#1A1A1A]">{field}</label>
                                    {mapping[field] && (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-[#3BB54A]">
                                            <Check className="w-3 h-3" /> Mapped
                                        </span>
                                    )}
                                </div>
                                <select
                                    value={mapping[field] || ''}
                                    onChange={(e) => handleMap(field, e.target.value)}
                                    className={`w-full h-10 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#13B5EA]/20 transition-colors
                    ${mapping[field] ? 'border-[#13B5EA] bg-[#E5F6FC]' : 'border-[#E0E0E0]'}
                  `}
                                >
                                    <option value="" disabled>Select column from Excel...</option>
                                    {fileData.headers.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Optional Fields */}
                {fields.optional.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-[#8A8A8A] uppercase tracking-wide mb-4">
                            Optional Fields
                        </h4>
                        <div className="space-y-4">
                            {fields.optional.map(field => (
                                <div key={field} className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-4 opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="font-medium text-[#1A1A1A]">{field}</label>
                                        {mapping[field] && (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-[#3BB54A]">
                                                <Check className="w-3 h-3" /> Mapped
                                            </span>
                                        )}
                                    </div>
                                    <select
                                        value={mapping[field] || ''}
                                        onChange={(e) => handleMap(field, e.target.value)}
                                        className={`w-full h-10 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#13B5EA]/20 transition-colors
                     ${mapping[field] ? 'border-[#13B5EA] bg-[#E5F6FC]' : 'border-[#E0E0E0]'}
                   `}
                                    >
                                        <option value="">Select column (Optional)...</option>
                                        {fileData.headers.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-[#E0E0E0] flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 text-[#555555] font-medium hover:text-[#1A1A1A] transition-colors"
                >
                    Cancel Mapping
                </button>
                <button
                    onClick={handleComplete}
                    disabled={!isComplete}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#13B5EA] text-white rounded-md font-medium hover:bg-[#0E92BC] disabled:opacity-50 transition-colors"
                >
                    Review Data <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

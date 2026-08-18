import { useState, useEffect } from 'react';
import { ArrowRight, Check, MapPin, Save, List } from 'lucide-react';
import { api } from '@/lib/api';
import { JOB_TYPE } from '@/types';
import toast from 'react-hot-toast';
import type { ColumnMapping, ExcelColumnMapperProps } from '@/modules/jobs/types';

export function ExcelColumnMapper({
    fileData,
    jobType,
    onMappingComplete,
    onBack
}: ExcelColumnMapperProps) {
    const getRequiredFields = (): ColumnMapping => {
        switch (jobType) {
            case JOB_TYPE.INVOICE_REVERSAL:
                return {
                    required: ['Invoice Number', 'Amount'],
                    optional: ['Vendor Name', 'Date']
                };
            case JOB_TYPE.OVERPAYMENT_ALLOCATION:
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

    const fetchTemplates = async () => {
        try {
            const res: any = await api.get(`/excel/mapping?jobType=${jobType}`);
            setTemplates(res);
        } catch (error) {
            console.error('Failed to fetch templates');
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [jobType]);

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
        <div className="bg-surface border border-line rounded-xl p-8 animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-ink mb-2">Map Excel Columns</h3>
                    <p className="text-ink-mid">
                        Match your spreadsheet columns from "{fileData.selectedSheet}" to our required fields.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    {templates.length > 0 && (
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-line rounded-md text-sm font-medium hover:bg-line-light">
                                <List className="w-4 h-4" /> Load Template
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-64 bg-surface border border-line rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible z-50">
                                <div className="p-3 border-b border-line-light font-semibold text-xs text-ink-light uppercase tracking-wider">Your Templates</div>
                                <div className="max-h-48 overflow-y-auto">
                                    {templates.map(t => (
                                        <button 
                                            key={t.id}
                                            onClick={() => applyTemplate(t)}
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-brand-light hover:text-brand transition-colors border-b last:border-0 border-line-light"
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 bg-brand-light px-4 py-2 rounded-lg">
                        <MapPin className="w-4 h-4 text-brand" />
                        <span className="font-bold text-brand text-sm">{Object.keys(mapping).length} / {fields.required.length + fields.optional.length} Mapped</span>
                    </div>
                </div>
            </div>

            {/* Template Save Section */}
            {isComplete && !showTemplateNameInput && (
                <div className="mb-8 p-4 bg-[#F8F9FA] border border-dashed border-line rounded-lg flex items-center justify-between">
                    <p className="text-sm text-ink-mid">Save this mapping as a template for future uploads?</p>
                    <button 
                        onClick={() => setShowTemplateNameInput(true)}
                        className="flex items-center gap-2 text-sm font-bold text-brand hover:underline"
                    >
                        <Save className="w-4 h-4" /> Save as Template
                    </button>
                </div>
            )}

            {showTemplateNameInput && (
                <div className="mb-8 p-4 bg-[#F8F9FA] border border-brand rounded-lg flex items-center gap-3">
                    <input 
                        type="text" 
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Template Name (e.g. QBR Vendor List)"
                        className="flex-1 h-10 px-3 border border-line rounded focus:outline-none focus:border-brand"
                    />
                    <button 
                        onClick={saveTemplate}
                        className="px-4 h-10 bg-brand text-white rounded font-bold text-sm hover:bg-brand-hover"
                    >
                        Save
                    </button>
                    <button 
                        onClick={() => setShowTemplateNameInput(false)}
                        className="px-4 h-10 bg-surface border border-line text-ink-mid rounded font-bold text-sm hover:bg-line-light"
                    >
                        Cancel
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Required Fields */}
                <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-ink uppercase tracking-wide mb-4">
                        Required Fields <span className="text-danger">*</span>
                    </h4>
                    <div className="space-y-4">
                        {fields.required.map(field => (
                            <div key={field} className="bg-page border border-line rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="font-medium text-ink">{field}</label>
                                    {mapping[field] && (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-success">
                                            <Check className="w-3 h-3" /> Mapped
                                        </span>
                                    )}
                                </div>
                                <select
                                    value={mapping[field] || ''}
                                    onChange={(e) => handleMap(field, e.target.value)}
                                    className={`w-full h-10 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors
                    ${mapping[field] ? 'border-brand bg-brand-light' : 'border-line'}
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
                        <h4 className="text-sm font-semibold text-ink-light uppercase tracking-wide mb-4">
                            Optional Fields
                        </h4>
                        <div className="space-y-4">
                            {fields.optional.map(field => (
                                <div key={field} className="bg-page border border-line rounded-lg p-4 opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="font-medium text-ink">{field}</label>
                                        {mapping[field] && (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-success">
                                                <Check className="w-3 h-3" /> Mapped
                                            </span>
                                        )}
                                    </div>
                                    <select
                                        value={mapping[field] || ''}
                                        onChange={(e) => handleMap(field, e.target.value)}
                                        className={`w-full h-10 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors
                     ${mapping[field] ? 'border-brand bg-brand-light' : 'border-line'}
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

            <div className="mt-8 pt-6 border-t border-line flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 text-ink-mid font-medium hover:text-ink transition-colors"
                >
                    Cancel Mapping
                </button>
                <button
                    onClick={handleComplete}
                    disabled={!isComplete}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-md font-medium hover:bg-brand-hover disabled:opacity-50 transition-colors"
                >
                    Review Data <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

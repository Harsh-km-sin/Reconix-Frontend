import { useState } from 'react';
import { bankAccounts } from '@/constants/options';
import { Search, Calendar, DollarSign, Building2, Check, Loader2, ArrowRight, Plus } from 'lucide-react';

interface FormData {
  supplierId: string;
  supplierName: string;
  amount: string;
  paymentDate: string;
  bankAccountId: string;
  description: string;
}

const suppliers: { id: string; name: string; xeroId: string }[] = [];

export function CreateOverpayment() {
  const [formData, setFormData] = useState<FormData>({
    supplierId: '',
    supplierName: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    bankAccountId: '',
    description: '',
  });
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOpId, setCreatedOpId] = useState('');

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.xeroId.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const isValid = formData.supplierId && formData.amount && parseFloat(formData.amount) > 0 && formData.bankAccountId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setCreatedOpId(`OP-${Math.floor(10000 + Math.random() * 90000)}`);
    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleSupplierSelect = (supplier: typeof suppliers[0]) => {
    setFormData(prev => ({
      ...prev,
      supplierId: supplier.id,
      supplierName: supplier.name,
    }));
    setSupplierSearch(supplier.name);
    setShowSupplierDropdown(false);
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  return (
    <div className="max-w-[600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Create Overpayment</h1>
        <p className="text-[#555555]">Record a new overpayment in Xero</p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-[#555555] mb-1.5">
              Supplier <span className="text-[#E53935]">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setShowSupplierDropdown(true);
                  if (!e.target.value) {
                    setFormData(prev => ({ ...prev, supplierId: '', supplierName: '' }));
                  }
                }}
                onFocus={() => setShowSupplierDropdown(true)}
                placeholder="Search suppliers..."
                className="w-full h-11 pl-10 pr-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
              />
            </div>
            
            {showSupplierDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E0E0E0] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto animate-fade-in">
                {filteredSuppliers.map(supplier => (
                  <button
                    key={supplier.id}
                    type="button"
                    onClick={() => handleSupplierSelect(supplier)}
                    className="w-full px-4 py-3 text-left hover:bg-[#F5F5F5] transition-colors border-b border-[#F5F5F5] last:border-b-0"
                  >
                    <p className="text-sm font-medium text-[#1A1A1A]">{supplier.name}</p>
                    <p className="text-xs text-[#8A8A8A] font-mono">{supplier.xeroId}</p>
                  </button>
                ))}
                {filteredSuppliers.length === 0 && (
                  <div className="px-4 py-3 text-sm text-[#8A8A8A]">No suppliers found</div>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[#555555] mb-1.5">
              Overpayment Amount <span className="text-[#E53935]">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full h-11 pl-10 pr-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
              />
            </div>
            {formData.amount && (
              <p className="mt-1.5 text-sm text-[#3BB54A]">
                {formatCurrency(formData.amount)}
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-[#555555] mb-1.5">
              Payment Date <span className="text-[#E53935]">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                className="w-full h-11 pl-10 pr-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
              />
            </div>
          </div>

          {/* Bank Account */}
          <div>
            <label className="block text-sm font-medium text-[#555555] mb-1.5">
              Bank Account <span className="text-[#E53935]">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <select
                value={formData.bankAccountId}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                className="w-full h-11 pl-10 pr-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none appearance-none bg-white"
              >
                <option value="">Select bank account...</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} — {account.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#555555] mb-1.5">
              Description <span className="text-[#8A8A8A]">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Refund for overpayment on INV-123"
              rows={3}
              className="w-full px-4 py-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F5]">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2.5 text-[#555555] hover:text-[#1A1A1A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-md font-semibold text-sm transition-all duration-150 hover:bg-[#0E92BC] hover:scale-[1.02] active:scale-[0.98] disabled:bg-[#E0E0E0] disabled:text-[#8A8A8A] disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Overpayment'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-[450px] p-8 text-center animate-scale-in">
            <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-[#3BB54A]" />
            </div>
            
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Overpayment Created!</h2>
            <p className="text-[#555555] mb-6">
              <span className="font-mono text-[#13B5EA]">{createdOpId}</span> created for {formData.supplierName}
            </p>
            <p className="text-2xl font-bold text-[#3BB54A] mb-8">
              {formatCurrency(formData.amount)}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSuccess(false);
                  window.location.href = '/allocation';
                }}
                className="w-full px-6 py-2.5 bg-[#13B5EA] text-white rounded-md font-semibold text-sm hover:bg-[#0E92BC] transition-colors flex items-center justify-center gap-2"
              >
                Allocate Bills Now
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setFormData({
                    supplierId: '',
                    supplierName: '',
                    amount: '',
                    paymentDate: new Date().toISOString().split('T')[0],
                    bankAccountId: '',
                    description: '',
                  });
                  setSupplierSearch('');
                }}
                className="w-full px-6 py-2.5 border border-[#E0E0E0] text-[#555555] rounded-md text-sm font-medium hover:border-[#13B5EA] hover:text-[#13B5EA] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Another
              </button>
              
              <button
                onClick={() => {
                  setShowSuccess(false);
                  window.location.href = '/';
                }}
                className="text-sm text-[#13B5EA] hover:underline"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

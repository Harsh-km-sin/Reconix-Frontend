import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Settings } from 'lucide-react';
import type { CompanySwitcherProps } from '@/app/layout/types';

/** Which Xero organisation the session is pointed at. */
export function CompanySwitcher({
  companies,
  companyId,
  onSwitchCompany,
}: CompanySwitcherProps) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const navigate = useNavigate();

  const currentName = companyId
    ? (companies.find((c) => c.companyId === companyId)?.companyName ?? 'Select company')
    : (companies[0]?.companyName ?? 'Select company');

  const handleSelect = async (targetId: string) => {
    if (targetId === companyId) {
      setOpen(false);
      return;
    }
    setSwitching(targetId);
    const ok = onSwitchCompany ? await onSwitchCompany(targetId) : false;
    setSwitching(null);
    if (ok) {
      setOpen(false);
      // Every page holds company-scoped data; a reload is the honest way to
      // drop all of it rather than refetching each screen piecemeal.
      window.location.reload();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-line-light transition-all bg-surface border border-transparent hover:border-line shadow-sm hover:shadow-md h-10"
      >
        <div className="w-6 h-6 rounded bg-brand-light flex items-center justify-center">
          <Building2 className="w-3.5 h-3.5 text-brand" />
        </div>
        <span className="font-bold text-sm text-ink">{currentName}</span>
        <ChevronRight
          className={`w-4 h-4 text-ink-light transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-line py-3 animate-slide-up z-[60] overflow-hidden">
          <div className="px-4 pb-2 mb-2 border-b border-line-light flex items-center justify-between">
            <span className="text-[10px] font-black text-ink-light uppercase tracking-[0.1em]">
              Organizations
            </span>
            <span className="text-[10px] font-bold text-success bg-success-light px-2 py-0.5 rounded-full">
              {companies.length} Organizations
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            {companies.length === 0 ? (
              <div className="px-4 py-4 text-center text-sm text-ink-light italic">
                No companies assigned
              </div>
            ) : (
              companies.map((company) => {
                const isCurrent = company.companyId === companyId;
                return (
                  <button
                    key={company.companyId}
                    disabled={switching !== null}
                    onClick={() => handleSelect(company.companyId)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-light transition-colors relative group ${
                      isCurrent ? 'bg-page' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-brand text-white shadow-lg'
                          : 'bg-line-light text-ink-light group-hover:bg-surface group-hover:text-brand'
                      }`}
                    >
                      {switching === company.companyId ? (
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        company.companyName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${
                          isCurrent ? 'text-ink' : 'text-ink-mid group-hover:text-ink'
                        }`}
                      >
                        {company.companyName}
                      </p>
                      <p className="text-[10px] text-ink-light font-medium">Xero Organization</p>
                    </div>
                    {isCurrent && (
                      <div className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_rgb(var(--brand))]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-2 px-3 pt-2 border-t border-line-light">
            <button
              onClick={() => {
                navigate('/companies');
                setOpen(false);
              }}
              className="w-full h-9 flex items-center justify-center gap-2 text-xs font-bold text-brand hover:bg-brand-light rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Organization Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

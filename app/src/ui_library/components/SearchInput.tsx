import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/ui_library/hooks/useDebounce';

export interface SearchInputProps {
  /** The committed value. Kept in sync with what the user is typing. */
  value: string;
  /** Fired after the user stops typing for `delay` ms, not on every keystroke. */
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce in ms. Pass 0 to fire immediately. */
  delay?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * A search box that debounces.
 *
 * The input stays responsive because it holds its own draft state; `onChange`
 * only fires once typing settles, so the caller can wire it straight to an API
 * call without spamming the server.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  delay = 300,
  disabled = false,
  className = '',
}: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebounce(draft, delay);

  // Let the caller reset the field (e.g. "Clear filters") without a fight.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // `value` is deliberately not a dependency: reacting to it here would undo
    // the reset above by immediately re-committing the old draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light pointer-events-none" />
      <input
        type="search"
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-9 bg-surface border border-line rounded-md text-sm text-ink placeholder:text-ink-light focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all disabled:opacity-50"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-light hover:text-ink-mid rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

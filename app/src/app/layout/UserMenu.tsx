import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Settings, User as UserIcon } from 'lucide-react';
import type { UserMenuProps } from '@/app/layout/types';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

/** Avatar dropdown: who is signed in, and how to stop being signed in. */
export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const goTo = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-line-light transition-colors"
      >
        <img
          src={user?.avatar || FALLBACK_AVATAR}
          alt={user?.fullName || 'User avatar'}
          className="w-8 h-8 rounded-full"
        />
        <ChevronLeft
          className={`w-4 h-4 text-ink-light transition-transform ${open ? '-rotate-90' : 'rotate-90'}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-surface rounded-lg shadow-lg border border-line py-2 animate-fade-in">
          <div className="px-4 py-3 border-b border-line-light">
            <p className="font-semibold text-sm text-ink">{user?.fullName}</p>
            <p className="text-xs text-ink-light">{user?.email}</p>
          </div>

          <button
            onClick={() => goTo('/settings')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-mid hover:bg-line-light transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => goTo('/settings')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-mid hover:bg-line-light transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          <div className="border-t border-line mt-2 pt-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger-light transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

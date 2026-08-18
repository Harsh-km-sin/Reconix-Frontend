import { useState } from 'react';
import { Bell } from 'lucide-react';
import type { AppNotification, NotificationsMenuProps } from '@/app/layout/types';

const DOT_TONE: Record<AppNotification['type'], string> = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-brand',
};

/** Bell dropdown. The feed is not wired to a source yet, so it renders empty. */
export function NotificationsMenu({ notifications }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={
          notifications.length > 0
            ? `Notifications, ${notifications.length} unread`
            : 'Notifications'
        }
        className="relative p-2 rounded-md hover:bg-line-light transition-colors"
      >
        <Bell className="w-5 h-5 text-ink-mid" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-surface rounded-lg shadow-lg border border-line py-2 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2 border-b border-line-light">
            <span className="font-semibold text-sm text-ink">Notifications</span>
            <button className="text-xs text-brand hover:underline">Mark all read</button>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-ink-light">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="px-4 py-3 hover:bg-line-light transition-colors border-b border-line-light last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${DOT_TONE[notif.type]}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">{notif.title}</p>
                      <p className="text-xs text-ink-mid mt-0.5">{notif.message}</p>
                      <p className="text-xs text-ink-light mt-1">{notif.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-line mt-2 pt-2 px-4">
            <button className="text-sm text-brand hover:underline">View All</button>
          </div>
        </div>
      )}
    </div>
  );
}

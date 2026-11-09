import React from 'react';
import { AppNotification } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import { formatDateTimeIN } from '../../services/gstCalculator';
import { Bell, CheckCheck, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface NotificationDrawerProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notifications,
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    ERPStorage.markAllNotificationsAsRead();
    onRefresh();
  };

  const handleMarkRead = (id: string) => {
    ERPStorage.markNotificationAsRead(id);
    onRefresh();
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'ALERT':
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">Notifications & Dispatch Alerts</h3>
              <p className="text-[11px] text-slate-400">
                {notifications.filter((n) => !n.isRead).length} unread alerts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No recent notifications or alerts.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1 ${
                  n.isRead
                    ? 'bg-slate-50/50 border-slate-200 opacity-80'
                    : 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getIcon(n.type)}
                    <span className="font-bold text-slate-900">{n.title}</span>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed pl-6">{n.message}</p>
                <div className="text-[10px] text-slate-400 pl-6 font-mono">
                  {formatDateTimeIN(n.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

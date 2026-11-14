import React, { useState } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Trash2, 
  Check, 
  ArrowRight,
  WifiOff
} from 'lucide-react';
import { AppNotification } from '../../types';
import { iotService } from '../../services/iotService';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onNavigateToDevice: (deviceId?: string) => void;
  onNavigateToReports: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onNavigateToDevice,
  onNavigateToReports,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.read;
    if (filterType === 'critical') return n.type === 'critical';
    if (filterType === 'warning') return n.type === 'warning';
    return true;
  });

  const handleMarkAllRead = () => {
    iotService.markAllNotificationsRead();
  };

  const handleMarkRead = (id: string) => {
    iotService.markNotificationRead(id);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden box-border space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Pusat Notifikasi & Peringatan Dini
          </h2>
          <p className="text-xs text-slate-500">
            Pemberitahuan otomatis saat keranjang mencapai 80%, 90%, atau ada laporan warga masuk
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tandai Semua Dibaca</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-[#0077B6] text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('unread')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterType === 'unread'
              ? 'bg-cyan-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Belum Dibaca ({notifications.filter((n) => !n.read).length})
        </button>
        <button
          onClick={() => setFilterType('critical')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterType === 'critical'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Penuh Kritis ≥ 90% ({notifications.filter((n) => n.type === 'critical').length})
        </button>
        <button
          onClick={() => setFilterType('warning')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterType === 'warning'
              ? 'bg-amber-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Waspada ≥ 80% ({notifications.filter((n) => n.type === 'warning').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length > 0 ? (
          filteredNotifs.map((item) => {
            let Icon = Info;
            let iconBg = 'bg-cyan-100 text-[#0077B6]';
            let cardBorder = 'border-slate-200';

            if (item.type === 'critical') {
              Icon = ShieldAlert;
              iconBg = 'bg-red-100 text-red-600';
              cardBorder = 'border-red-200 bg-red-50/20';
            } else if (item.type === 'warning') {
              Icon = AlertTriangle;
              iconBg = 'bg-amber-100 text-amber-600';
              cardBorder = 'border-amber-200 bg-amber-50/20';
            } else if (item.type === 'success') {
              Icon = CheckCircle2;
              iconBg = 'bg-emerald-100 text-emerald-600';
            }

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border bg-white shadow-sm flex items-start justify-between gap-4 transition-all ${cardBorder} ${
                  !item.read ? 'ring-1 ring-cyan-400' : 'opacity-85'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {item.message}
                    </p>
                    <span className="text-[11px] text-slate-400 block pt-1">
                      {item.timestamp}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                  {item.deviceId && (
                    <button
                      onClick={() => onNavigateToDevice(item.deviceId)}
                      className="px-2.5 py-1 text-xs font-semibold text-[#0077B6] hover:bg-cyan-50 rounded-md transition-colors flex items-center gap-1"
                    >
                      <span>Periksa Alat</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {item.reportId && (
                    <button
                      onClick={onNavigateToReports}
                      className="px-2.5 py-1 text-xs font-semibold text-[#0077B6] hover:bg-cyan-50 rounded-md transition-colors flex items-center gap-1"
                    >
                      <span>Lihat Tiket</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!item.read && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                      title="Tandai dibaca"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Tidak ada notifikasi dalam kategori ini.
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  User, 
  FileCheck, 
  ShieldCheck, 
  FileText,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface HistoryItem {
  id: string;
  previousStatus?: string | null;
  newStatus: string;
  actionTitle: string;
  comment?: string | null;
  createdAt: string | Date;
  changedBy?: {
    name: string;
    role: {
      name: string;
      displayName: string;
    };
  } | null;
}

export default function ApplicationTimeline({ histories }: { histories: HistoryItem[] }) {
  if (!histories || histories.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-xs">
        Belum ada riwayat aktivitas yang tercatat.
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'NEED_REVISION':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'HEAD_REVIEW':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'SUPERADMIN_REVIEW':
        return <FileCheck className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
      {histories.map((item, idx) => {
        const dateObj = new Date(item.createdAt);
        const dateStr = dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const timeStr = dateObj.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={item.id || idx} className="relative group">
            {/* Dot marker */}
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-slate-300 group-hover:border-emerald-500 flex items-center justify-center transition-colors shadow-sm">
              <span className="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-emerald-600" />
            </div>

            <div className="bg-slate-50 hover:bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.newStatus)}
                  <h5 className="font-bold text-xs text-slate-800">{item.actionTitle}</h5>
                </div>
                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  <span>{dateStr}</span> • <span className="font-mono">{timeStr} WIB</span>
                </div>
              </div>

              {item.changedBy && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Petugas: <strong>{item.changedBy.name}</strong></span>
                  <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                    {item.changedBy.role.displayName}
                  </span>
                </div>
              )}

              {item.comment && (
                <div className="mt-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                  {item.comment}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ShieldAlert, 
  Search, 
  User, 
  Clock, 
  FileText, 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import AdminSidebar from '@/components/AdminSidebar';

export default function AuditLogsPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const [meRes, logRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/audit-logs'),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        }

        if (logRes.ok) {
          const logData = await logRes.json();
          setLogs(logData.logs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.action?.toLowerCase().includes(term) ||
      l.userEmail?.toLowerCase().includes(term) ||
      l.userRole?.toLowerCase().includes(term) ||
      l.entity?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <DashboardHeader user={user || { name: 'Admin', email: '', role: 'STAFF' }} />

      <div className="flex-1 flex">
        <AdminSidebar role={user?.role || 'STAFF'} />

        <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-x-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-emerald-700" />
                Catatan Jejak Audit Sistem (Audit Trail)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Rekaman akuntabilitas seluruh aktivitas login, permohonan, verifikasi, dan penerbitan SKTM
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari aktivitas, email pengguna, atau role..."
              className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Aksi / Aktivitas</th>
                    <th className="py-3 px-4">Entitas Terkait</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada catatan audit yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {log.userEmail || 'Sistem / Anonim'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded font-mono">
                            {log.userRole || 'PUBLIC'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {log.entity} {log.entityId && `(${log.entityId.substring(0, 8)}...)`}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

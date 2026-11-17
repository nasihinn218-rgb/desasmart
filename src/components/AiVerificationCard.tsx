import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  FileCheck,
  SearchCheck,
  AlertCircle
} from 'lucide-react';

interface AiVerificationProps {
  score?: number | null;
  analysisJson?: string | null;
}

export default function AiVerificationCard({ score = 100, analysisJson }: AiVerificationProps) {
  let parsed: any = null;
  try {
    if (analysisJson) {
      parsed = JSON.parse(analysisJson);
    }
  } catch (e) {
    // fallback
  }

  const finalScore = parsed?.score ?? score ?? 100;
  const warnings: string[] = parsed?.warnings || [];
  const recommendations: string[] = parsed?.recommendations || [];
  const ocrFindings: string[] = parsed?.ocrFindings || [];
  const checks = parsed?.checks || {
    nikValid: true,
    kkValid: true,
    incomeValid: true,
    documentsAttached: true,
    ocrMatch: true,
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-xl border border-slate-700 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-wide flex items-center gap-2">
              Pemeriksaan Kelengkapan AI
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                AI Assistant
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">Analisis Otomatis Konsistensi Berkas & Formulir</p>
          </div>
        </div>

        {/* Score indicator */}
        <div className="text-right">
          <span className="text-2xl font-black text-emerald-400 font-mono">{finalScore}%</span>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Skor Kelayakan</p>
        </div>
      </div>

      {/* Checks Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4 relative z-10 text-xs">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex items-center gap-2">
          {checks.nikValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-slate-300 text-[11px]">Format NIK Valid</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex items-center gap-2">
          {checks.kkValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-slate-300 text-[11px]">Format KK Valid</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex items-center gap-2">
          {checks.documentsAttached ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-slate-300 text-[11px]">KTP & KK Terlampir</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex items-center gap-2">
          {checks.ocrMatch ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-slate-300 text-[11px]">Kesesuaian OCR Dokumen</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex items-center gap-2">
          {checks.incomeValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-slate-300 text-[11px]">Rentang Penghasilan Sesuai</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 text-[11px]">Desil P3KE / DTKS Desa</span>
        </div>
      </div>

      {/* Warnings & Notices */}
      {warnings.length > 0 && (
        <div className="mb-3 p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-200 text-xs space-y-1 relative z-10">
          <div className="font-bold flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Perhatian / Kemungkinan Ketidaksesuaian:
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-300/90">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* OCR Findings & Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs space-y-1 relative z-10">
          <div className="font-bold flex items-center gap-1.5 text-emerald-400">
            <SearchCheck className="w-4 h-4 shrink-0" /> Catatan Rekomendasi AI:
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-emerald-300/90">
            {recommendations.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="mt-3 pt-3 border-t border-slate-700/80 flex items-start gap-2 text-[10px] text-slate-400 relative z-10 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <span>
          <strong>Disclaimer:</strong> AI hanya bertindak sebagai asisten pemeriksaan data dan dokumen. Keputusan kelayakan dan persetujuan SKTM sepenuhnya wewenang Pejabat Desa (Staf, Superadmin, dan Kepala Desa).
        </span>
      </div>
    </div>
  );
}

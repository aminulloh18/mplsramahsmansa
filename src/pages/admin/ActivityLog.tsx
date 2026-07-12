import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, Trash2, Calendar } from 'lucide-react';
import { ActivityLog as LogType } from '../../types/database.types';
import { localDb } from '../../services/localDb';
import ConfirmModal from '../../components/ConfirmModal';

export default function ActivityLog() {
  const [logs, setLogs] = useState<LogType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete modal states
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const loadLogs = () => {
    setLogs(localDb.getLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearTrigger = () => {
    setIsClearModalOpen(true);
  };

  const handleConfirmClear = () => {
    localDb.clearLogs();
    setIsClearModalOpen(false);
    loadLogs();
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Log Audit Keamanan & Aktivitas</h2>
          <p className="text-xs text-slate-500">
            Riwayat komparatif seluruh aksi panitia untuk memastikan transparansi alokasi siswa dan audit data.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadLogs}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Log"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleClearTrigger}
            className="px-4 py-2 bg-rose-950/10 border border-rose-500/10 hover:bg-rose-950/20 hover:border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Kosongkan Log
          </button>
        </div>
      </div>

      {/* Filter strip */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Cari email panitia, aksi, atau rincian..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 pl-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
      </div>

      {/* Log Feed Card */}
      <div className="bg-[#1E293B]/40 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900/60 flex items-start gap-4 hover:border-slate-800 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <ShieldAlert className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
                    <span className="font-bold text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{log.details}</p>
                  <p className="text-[10px] text-slate-500">
                    Oleh: <strong className="font-mono text-slate-400">{log.user_email}</strong>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-slate-500 italic text-xs">
              Belum ada log riwayat aktivitas yang terekam atau cocok dengan pencarian.
            </div>
          )}
        </div>
      </div>

      {/* CLEAR LOGS CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Kosongkan Riwayat Log"
        message="Apakah Anda yakin ingin mengosongkan seluruh riwayat log aktivitas? Tindakan ini tidak dapat dibatalkan."
        confirmText="Kosongkan"
        cancelText="Batal"
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
}

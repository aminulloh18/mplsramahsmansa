import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  isDanger = true,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10"
          >
            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 rounded-lg p-1.5 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon & Title */}
            <div className="flex items-start gap-4 mt-1">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isDanger ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
              }`}>
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-lg cursor-pointer ${
                  isDanger 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

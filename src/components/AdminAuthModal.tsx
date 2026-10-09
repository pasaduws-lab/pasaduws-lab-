import React, { useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const ADMIN_PASSWORD_HASH = 'passaduws888';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD_HASH) {
      setError('');
      setPassword('');
      onSuccess();
    } else {
      setError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-amber-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">ยืนยันสิทธิ์ผู้ดูแลระบบ (Admin)</h3>
              <p className="text-xs text-blue-200">งานพัสดุและทรัพย์สิน อบต.วังซ้าย</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed mb-4">
            <p className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
              <Lock className="w-3.5 h-3.5" />
              พื้นที่ควบคุมเฉพาะผู้ดูแลระบบ
            </p>
            การเพิ่ม แก้ไข หรือลบข้อมูลครุภัณฑ์ สงวนสิทธิ์เฉพาะเจ้าหน้าที่ผู้ดูแลระบบเท่านั้น กรุณากรอกรหัสผ่านเพื่อดำเนินการ
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              รหัสผ่านผู้ดูแลระบบ
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
              autoFocus
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />

            {error && (
              <p className="mt-2 text-xs text-rose-600 font-bold animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              ยืนยันสิทธิ์
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


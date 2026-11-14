import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { AuthUser } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMessage(null);
    setShowPassword(false);
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Silakan masukkan email Anda.');
      return;
    }

    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    authService
      .login(username, password)
      .then((result) => {
        if (result.success && result.user) {
          setUsername('');
          setPassword('');
          setShowPassword(false);
          setErrorMessage(null);
          onLoginSuccess(result.user);
          onClose();
        } else {
          setErrorMessage(
            result.message || 'Email atau kata sandi tidak sesuai. Silakan periksa kembali.'
          );
        }
      })
      .catch(() => {
        setErrorMessage('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0f2942]/45 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-lg border border-slate-200 z-10 my-8">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f8fafc] border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/assets/aistudio/1__1__22a3ff2f.png"
                alt="Logo Portal"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <h3
                id="login-modal-title"
                className="font-bold text-[#0f2942] text-base sm:text-lg tracking-tight leading-snug"
              >
                Masuk ke Portal JAKSEA
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Silakan masuk menggunakan akun terdaftar untuk mengakses layanan operasional.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-[#0f2942] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup jendela login"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-username"
              className="block text-xs font-semibold text-[#0f2942]"
            >
              Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Masukkan email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f8fafc] border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8] focus:border-[#0284c7] text-[#0f2942] placeholder-slate-400 text-sm transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-[#0f2942]"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Masukkan kata sandi"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#f8fafc] border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8] focus:border-[#0284c7] text-[#0f2942] placeholder-slate-400 text-sm transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0f2942] p-1 focus:outline-none cursor-pointer rounded-lg"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white bg-[#0f2942] hover:bg-[#1e3a8a] transition-all duration-200 ease-out active:scale-95 disabled:opacity-60 cursor-pointer text-sm mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-[#38bdf8] transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                <span>Masuk ke Portal</span>
              </span>
            )}
          </button>
        </form>

        {/* Access Footer */}
        <div className="pt-3 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500">
            Akses terbatas untuk pengelola dan petugas lapangan.
          </p>
        </div>
      </div>
    </div>
  );
};
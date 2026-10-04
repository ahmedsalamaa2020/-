import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SystemUser, Language } from '../types';
import { translations } from '../translations/i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: SystemUser[];
  onLoginSuccess: (user: SystemUser) => void;
  lang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  onLoginSuccess,
  lang,
}) => {
  const t = translations[lang];

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const foundUser = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.passwordHash === password.trim() &&
        u.active
    );

    if (foundUser) {
      onLoginSuccess(foundUser);
      onClose();
    } else {
      setErrorMsg(t.invalidAuth);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl mx-auto flex items-center justify-center mb-3 border border-blue-200 dark:border-blue-800">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
            {t.loginTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' ? 'أدخل اسم المستخدم وكلمة المرور للدخول للنظام' : 'Enter user credentials to access system features'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.username}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute top-3 rtl:right-3 ltr:left-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder={t.enterUsername}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.password}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute top-3 rtl:right-3 ltr:left-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder={t.enterPassword}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/20 transition mt-2"
          >
            {t.login}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] font-bold text-slate-400 mb-2">
            {lang === 'ar' ? 'حسابات اختيارية سريعة للتجربة:' : 'Quick Demo Logins:'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleQuickFill('dev', 'dev123')}
              className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
            >
              Developer (dev / dev123)
            </button>
            <button
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
            >
              Admin (admin / admin123)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

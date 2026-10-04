import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldAlert, Eye, EyeOff, ShieldCheck, Sparkles, LogIn, Car, Clock, AlertTriangle } from 'lucide-react';
import { SystemUser, Language, AppSettings } from '../types';
import { translations } from '../translations/i18n';

interface LoginScreenProps {
  users: SystemUser[];
  onLoginSuccess: (user: SystemUser) => void;
  settings: AppSettings;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onRestoreDevAccount?: () => void;
  logoutReason?: 'inactivity' | 'manual' | 'lock' | 'screen_closed' | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLoginSuccess,
  settings,
  lang,
  onLanguageChange,
  onRestoreDevAccount,
  logoutReason,
}) => {
  const t = translations[lang];

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      const trimmedPass = password.trim();

      const foundUser = users.find(
        (u) =>
          u.username.toLowerCase() === trimmedUser &&
          u.passwordHash === trimmedPass
      );

      if (foundUser) {
        if (!foundUser.active) {
          setErrorMsg(
            lang === 'ar'
              ? 'هذا الحساب معطل حالياً من قبل إدارة النظام'
              : 'This account has been disabled by system administrator'
          );
          setIsLoading(false);
          return;
        }

        onLoginSuccess(foundUser);
      } else {
        setErrorMsg(t.invalidAuth);
        setIsLoading(false);
      }
    }, 150);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg(null);
  };

  // Check if active users exist
  const hasUsers = users && users.length > 0;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black p-4 relative overflow-hidden font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={() => onLanguageChange(lang === 'ar' ? 'en' : 'ar')}
          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
        >
          <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 my-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center mb-7">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="w-16 h-16 object-cover rounded-2xl mx-auto mb-3.5 border-2 border-blue-500/40 shadow-lg shadow-blue-500/20"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl mx-auto flex items-center justify-center mb-3.5 shadow-lg shadow-blue-500/25">
              <Car className="w-8 h-8" />
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {settings.appName || (lang === 'ar' ? 'نظام إدارة أسطول السيارات' : 'AutoFleet Pro Fleet Management')}
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1.5">
            {settings.organizationName || (lang === 'ar' ? 'بوابة تسجيل الدخول الآمن للنظام' : 'Secure Enterprise Sign In Portal')}
          </p>
        </div>

        {/* Timeout / Inactivity / Lock Reason Banner */}
        {logoutReason === 'inactivity' && (
          <div className="mb-5 p-3.5 bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl text-amber-300 text-xs font-bold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <Clock className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-black text-amber-200">
                {lang === 'ar' ? 'تم تسجيل الخروج التلقائي لعدم النشاط' : 'Auto Logged Out Due to Inactivity'}
              </p>
              <p className="text-[11px] text-amber-300/90 font-normal mt-0.5 leading-relaxed">
                {lang === 'ar'
                  ? 'تم قفل الجلسة بعد 30 دقيقة من التوقف عن العمل لحماية بياناتك. يرجى إدخال اسم المستخدم والرقم السري للمتابعة.'
                  : 'Session locked after 30 minutes of inactivity to protect your data. Please re-enter your username & password.'}
              </p>
            </div>
          </div>
        )}

        {logoutReason === 'lock' && (
          <div className="mb-5 p-3.5 bg-blue-500/15 border-2 border-blue-500/40 rounded-2xl text-blue-300 text-xs font-bold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <Lock className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
            <div>
              <p className="font-black text-blue-200">
                {lang === 'ar' ? 'تم قفل الشاشة لحماية النظام' : 'Screen Locked'}
              </p>
              <p className="text-[11px] text-blue-300/90 font-normal mt-0.5 leading-relaxed">
                {lang === 'ar'
                  ? 'يرجى إدخال اسم المستخدم والرقم السري لإلغاء القفل ومتابعة العمل.'
                  : 'Please enter your username and password to unlock and continue.'}
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-in shake">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-200 mb-1.5 flex items-center justify-between">
              <span>{lang === 'ar' ? 'اسم المستخدم' : 'Username'}</span>
              <span className="text-[10px] text-slate-400 font-normal">{lang === 'ar' ? 'مطلوب للدخول' : 'Required'}</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute top-3 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
              <input
                type="text"
                required
                autoFocus
                placeholder={lang === 'ar' ? 'أدخل اسم المستخدم (مثال: admin)' : 'Enter username'}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm font-semibold text-white placeholder-slate-500 transition outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-200 mb-1.5 flex items-center justify-between">
              <span>{lang === 'ar' ? 'الرقم السري / كلمة المرور' : 'Password'}</span>
              <span className="text-[10px] text-slate-400 font-normal">{lang === 'ar' ? 'مطلوب للدخول' : 'Required'}</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute top-3 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={lang === 'ar' ? 'أدخل الرقم السري' : 'Enter password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full rtl:pr-10 ltr:pl-10 rtl:pl-10 ltr:pr-10 py-2.5 bg-slate-800/90 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm font-semibold text-white placeholder-slate-500 transition outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 rtl:left-3.5 ltr:right-3.5 text-slate-400 hover:text-white transition p-0.5"
                title={showPassword ? (lang === 'ar' ? 'إخفاء الرقم السري' : 'Hide password') : (lang === 'ar' ? 'إظهار الرقم السري' : 'Show password')}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'خروج تلقائي بعد 30 دقيقة من عدم النشاط أو عند إغلاق الشاشة'
                : 'Auto logout after 30 mins of inactivity or screen close'}
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/30 active:scale-[0.99] transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تسجيل الدخول للنظام' : 'Sign In to System'}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins if demo users exist and setting is enabled */}
        {hasUsers && settings.showLoginDemoUsers !== false && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] font-bold text-slate-500 mb-2.5">
              {lang === 'ar' ? 'حسابات تجريبية سريعة للنظام (اضغط للملء التلقائي):' : 'Quick Demo Logins (Click to autofill):'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {users.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickFill(u.username, u.passwordHash)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title={lang === 'ar' ? `تسجيل الدخول كـ ${u.fullName}` : `Sign in as ${u.fullName}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{u.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* In case all users were wiped or none exist */}
        {!hasUsers && onRestoreDevAccount && (
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-amber-400 font-bold mb-2">
              {lang === 'ar' ? 'لا يوجد مستخدمون مسجلون حالياً' : 'No registered users found'}
            </p>
            <button
              type="button"
              onClick={onRestoreDevAccount}
              className="px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold hover:bg-purple-600/30 transition"
            >
              {lang === 'ar' ? 'تهيئة حساب المطور الافتراضي (dev / dev123)' : 'Initialize Master Developer Account'}
            </button>
          </div>
        )}

        {/* Security & Lifetime Authorization Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-800/40 px-3 py-1 rounded-full border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'نظام مشفر ومحمي بصلاحية معتمدة' : 'Secure Enterprise Authorized Fleet'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

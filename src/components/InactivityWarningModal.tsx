import React from 'react';
import { Clock, ShieldAlert, CheckCircle, LogOut } from 'lucide-react';
import { Language } from '../types';

interface InactivityWarningModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
  lang: Language;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  remainingSeconds,
  onStayLoggedIn,
  onLogoutNow,
  lang,
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in print:hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-500/10 text-slate-100 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-500/15 border-2 border-amber-500/30 text-amber-400 rounded-2xl mx-auto flex items-center justify-center animate-pulse">
          <Clock className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-black text-white">
            {lang === 'ar' ? 'تنبيه: اقتراب انتهاء وقت الجلسة' : 'Session Timeout Warning'}
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {lang === 'ar'
              ? 'توقف النشاط على النظام لأكثر من 28 دقيقة. سيتم تسجيل الخروج التلقائي لحماية بياناتك خلال:'
              : 'No activity detected for over 28 minutes. You will be automatically logged out in:'}
          </p>
        </div>

        {/* Big Countdown Display */}
        <div className="py-3 px-6 bg-slate-950/80 rounded-2xl border border-amber-500/40 inline-block">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-amber-400">
            {formattedTime}
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          {lang === 'ar'
            ? 'انقر على "متابعة العمل" لإعادة ضبط العداد والاستمرار دون انقطاع.'
            : 'Click "Keep Working" to reset the timer and stay signed in.'}
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onLogoutNow}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تسجيل الخروج الآن' : 'Logout Now'}</span>
          </button>

          <button
            type="button"
            onClick={onStayLoggedIn}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{lang === 'ar' ? 'متابعة العمل' : 'Keep Working'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

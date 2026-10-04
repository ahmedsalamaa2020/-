import React, { useState, useEffect, useRef } from 'react';
import {
  Keyboard,
  Minimize2,
  Maximize2,
  X,
  CheckCircle2,
  Copy,
  Delete,
  CornerDownLeft,
  Sparkles,
  RefreshCw,
  Hash,
  FileText,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Language } from '../types';
import {
  normalizeArabicNumbers,
  insertTextAtCursor,
  backspaceAtCursor,
  setNativeInputValue,
} from '../utils/inputAssistant';

interface SmartTypingAssistantProps {
  lang: Language;
}

export const SmartTypingAssistant: React.FC<SmartTypingAssistantProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [activeElementInfo, setActiveElementInfo] = useState<{
    tagName: string;
    type: string;
    placeholder: string;
    name: string;
    label: string;
  } | null>(null);
  const [directInputText, setDirectInputText] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [repairSuccessNotification, setRepairSuccessNotification] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'numpad' | 'direct' | 'phrases'>('numpad');

  // Ref to track last focused input or textarea element
  const lastActiveInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Monitor active element changes across the document
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput = target instanceof HTMLInputElement;
      const isTextArea = target instanceof HTMLTextAreaElement;

      // Ignore our own assistant's textarea so we don't overwrite last focused form input
      if (target.dataset.typingAssistant === 'true') {
        return;
      }

      if (isInput || isTextArea) {
        lastActiveInputRef.current = target as HTMLInputElement | HTMLTextAreaElement;

        // Try finding label or context
        let labelText = '';
        if (target.id) {
          const labelEl = document.querySelector(`label[for="${target.id}"]`);
          if (labelEl) labelText = labelEl.textContent || '';
        }
        if (!labelText && target.closest('label')) {
          labelText = target.closest('label')?.textContent || '';
        }

        setActiveElementInfo({
          tagName: target.tagName.toLowerCase(),
          type: (target as HTMLInputElement).type || 'text',
          placeholder: (target as HTMLInputElement).placeholder || '',
          name: (target as HTMLInputElement).name || '',
          label: labelText.slice(0, 30),
        });
      }
    };

    document.addEventListener('focusin', handleFocusIn, { passive: true });
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  // Quick typing into the active element
  const handleVirtualKeyPress = (char: string) => {
    const target = lastActiveInputRef.current;
    if (target && document.body.contains(target)) {
      insertTextAtCursor(target, char);
    } else {
      // If no input focused, append to direct input text
      setDirectInputText((prev) => prev + char);
    }
  };

  const handleVirtualBackspace = () => {
    const target = lastActiveInputRef.current;
    if (target && document.body.contains(target)) {
      backspaceAtCursor(target);
    } else {
      setDirectInputText((prev) => prev.slice(0, -1));
    }
  };

  const handleVirtualClear = () => {
    const target = lastActiveInputRef.current;
    if (target && document.body.contains(target)) {
      setNativeInputValue(target, '');
      target.focus();
    } else {
      setDirectInputText('');
    }
  };

  // Inject direct text into target
  const handleInjectDirectText = () => {
    if (!directInputText) return;
    const target = lastActiveInputRef.current;
    if (target && document.body.contains(target)) {
      insertTextAtCursor(target, directInputText);
      setDirectInputText('');
      setRepairSuccessNotification(true);
      setTimeout(() => setRepairSuccessNotification(false), 2500);
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(directInputText);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  // Copy direct input
  const handleCopyDirectText = () => {
    if (!directInputText) return;
    navigator.clipboard.writeText(directInputText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Convert Arabic numbers in direct input
  const handleConvertNumbers = () => {
    setDirectInputText((prev) => normalizeArabicNumbers(prev));
  };

  // Ready-to-use business phrases for rental, finance, cars
  const phrases = [
    { cat: 'financial', text: lang === 'ar' ? 'تم استلام المبلغ نقداً بالكامل' : 'Payment received in full (Cash)' },
    { cat: 'financial', text: lang === 'ar' ? 'تم السداد عبر تحويل بنكي' : 'Paid via Bank Transfer' },
    { cat: 'financial', text: lang === 'ar' ? 'تم الدفع بواسطة بطاقة مدى / POS' : 'Paid via Mada / POS Card' },
    { cat: 'financial', text: lang === 'ar' ? 'مبلغ تأمين مسترد عند تسليم المركبة' : 'Refundable deposit upon return' },
    { cat: 'financial', text: lang === 'ar' ? 'شامل ضريبة القيمة المضافة 15%' : 'Inclusive of 15% VAT' },
    { cat: 'vehicle', text: lang === 'ar' ? 'السيارة بحالة ممتازة وخالية من الخدوش' : 'Vehicle in mint condition, scratch-free' },
    { cat: 'vehicle', text: lang === 'ar' ? 'تسليم السيارة مع المفتاح الأصلي والاستمارة' : 'Delivered with original key & registration' },
    { cat: 'vehicle', text: lang === 'ar' ? 'مستوى الوقود: ممتلئ بالكامل (Full)' : 'Fuel Level: Full' },
    { cat: 'vehicle', text: lang === 'ar' ? 'تم الفحص الدوري والصيانة الشاملة' : 'Periodic inspection & maintenance verified' },
    { cat: 'admin', text: lang === 'ar' ? 'تمت مراجعة الهوية ورخصة القيادة بنجاح' : 'ID and Driver License verified' },
    { cat: 'admin', text: lang === 'ar' ? 'موافقة الإدارة والمدير المالي' : 'Approved by Management & CFO' },
    { cat: 'admin', text: lang === 'ar' ? 'لا توجد ملاحظات أو مستحقات سابقة' : 'No prior remarks or overdue dues' },
  ];

  // System-wide input repair / re-activate action
  const handleRepairInputs = () => {
    // 1. Re-focus window
    window.focus();

    // 2. Clear potential selection artifacts
    window.getSelection()?.removeAllRanges();

    // 3. Remove any pointer-events blocking styles if inadvertently left
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.pointerEvents = 'auto';
      htmlEl.removeAttribute('aria-disabled');
    });

    // 4. Try re-focusing last active element or first input found
    if (lastActiveInputRef.current && document.body.contains(lastActiveInputRef.current)) {
      lastActiveInputRef.current.focus();
    } else {
      const firstInput = document.querySelector('input:not([type="hidden"]):not([disabled])') as HTMLInputElement | null;
      if (firstInput) firstInput.focus();
    }

    setRepairSuccessNotification(true);
    setTimeout(() => setRepairSuccessNotification(false), 3000);
  };

  const targetLabel = activeElementInfo
    ? activeElementInfo.label || activeElementInfo.placeholder || activeElementInfo.name || activeElementInfo.type
    : lang === 'ar' ? 'لم يتم تحديد حقل بعد' : 'No input selected yet';

  return (
    <>
      {/* Floating Helper Pill (Visible when minimized or closed) */}
      {isMinimized && (
        <div
          className="fixed bottom-4 left-4 z-40 print:hidden flex items-center gap-2 bg-slate-900/95 hover:bg-slate-900 text-white p-2 rounded-2xl shadow-xl border border-blue-500/40 backdrop-blur-md transition-all group"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
            title={lang === 'ar' ? 'فتح مساعد الكتابة ولوحة الأرقام المساعدة' : 'Open Typing Assistant & Keypad'}
          >
            <Keyboard className="w-4 h-4 text-white animate-pulse" />
            <span>{lang === 'ar' ? 'مساعد الكتابة الذكي ⌨️' : 'Typing Assistant ⌨️'}</span>
          </button>

          <button
            type="button"
            onClick={handleRepairInputs}
            className="px-2 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            title={lang === 'ar' ? 'إصلاح وتنشيط حقول الكتابة فوراً' : 'Quick Fix & Re-activate Inputs'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'تنشيط الحقول' : 'Re-activate'}</span>
          </button>
        </div>
      )}

      {/* Expanded Assistant Card Window */}
      {!isMinimized && (
        <div
          className="fixed bottom-4 left-4 z-40 w-88 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-blue-500/50 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 print:hidden animate-fade-in"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/15 rounded-xl border border-white/20">
                <Keyboard className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-black flex items-center gap-1.5">
                  <span>{lang === 'ar' ? 'مساعد الكتابة والإدخال الذكي' : 'Smart Typing Assistant'}</span>
                  <span className="text-3xs bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                    {lang === 'ar' ? 'مفعل' : 'Active'}
                  </span>
                </h3>
                <p className="text-3xs text-blue-100 truncate max-w-[200px]">
                  {lang === 'ar' ? 'الحقل الحالي:' : 'Current Field:'} {targetLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRepairInputs}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
                title={lang === 'ar' ? 'تنشيط وإصلاح الحقول' : 'Re-activate Inputs'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
                title={lang === 'ar' ? 'تصغير' : 'Minimize'}
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('numpad')}
              className={`flex-1 py-2 text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'numpad'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-slate-900'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'أرقام سريعة' : 'Keypad'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-2 text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'direct'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-slate-900'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'كتابة بديلة' : 'Direct Text'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('phrases')}
              className={`flex-1 py-2 text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'phrases'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-slate-900'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'ar' ? 'جمل جاهزة' : 'Presets'}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3 bg-slate-50/50 dark:bg-slate-900/60 max-h-[320px] overflow-y-auto">
            {/* TAB 1: NUMPAD */}
            {activeTab === 'numpad' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-2xs text-slate-500 px-1 font-medium">
                  <span>{lang === 'ar' ? 'انقر لإدخال الأرقام مباشرة في الحقل النشط:' : 'Click to enter digits:'}</span>
                  <button
                    type="button"
                    onClick={handleConvertNumbers}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    {lang === 'ar' ? 'تحويل ١٢٣ ↔ 123' : 'Convert 123'}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {['7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleVirtualKeyPress(digit)}
                      className="py-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-base font-black shadow-xs transition active:scale-95 cursor-pointer text-center"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleVirtualBackspace}
                    className="py-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition active:scale-95 cursor-pointer"
                    title={lang === 'ar' ? 'مسح حرف' : 'Backspace'}
                  >
                    <Delete className="w-4 h-4" />
                  </button>

                  {['4', '5', '6'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleVirtualKeyPress(digit)}
                      className="py-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-base font-black shadow-xs transition active:scale-95 cursor-pointer text-center"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleVirtualClear}
                    className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-2xs transition active:scale-95 cursor-pointer"
                  >
                    {lang === 'ar' ? 'مسح الكل' : 'Clear'}
                  </button>

                  {['1', '2', '3'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleVirtualKeyPress(digit)}
                      className="py-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-base font-black shadow-xs transition active:scale-95 cursor-pointer text-center"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleVirtualKeyPress('00')}
                    className="py-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-black shadow-xs transition active:scale-95 cursor-pointer text-center"
                  >
                    00
                  </button>

                  {['0', '.'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleVirtualKeyPress(digit)}
                      className="py-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-base font-black shadow-xs transition active:scale-95 cursor-pointer text-center"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleVirtualKeyPress('000')}
                    className="py-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-black shadow-xs transition active:scale-95 cursor-pointer text-center"
                  >
                    000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVirtualKeyPress('-')}
                    className="py-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-base font-black shadow-xs transition active:scale-95 cursor-pointer text-center"
                  >
                    -
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DIRECT INPUT TEXTBOX */}
            {activeTab === 'direct' && (
              <div className="space-y-2">
                <div className="text-2xs text-slate-500 font-medium">
                  {lang === 'ar'
                    ? 'اكتب هنا بأي لغة أو لوحة مفاتيح، ثم انقر "إدراج في الحقل" أو "نسخ":'
                    : 'Type here freely, then click "Insert" or "Copy":'}
                </div>

                <textarea
                  data-typing-assistant="true"
                  rows={3}
                  value={directInputText}
                  onChange={(e) => setDirectInputText(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب النص أو الأرقام هنا...' : 'Type text or numbers here...'}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleInjectDirectText}
                    className="flex-1 py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'إدراج في الحقل' : 'Insert into Field'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyDirectText}
                    className="py-2 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedNotification ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ' : 'Copy')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConvertNumbers}
                    className="py-2 px-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-xl text-2xs font-bold transition cursor-pointer"
                    title={lang === 'ar' ? 'تحويل الأرقام العربية إلى الإنجليزية' : 'Convert Arabic digits'}
                  >
                    ١٢٣ ➡ 123
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: READY PRESET PHRASES */}
            {activeTab === 'phrases' && (
              <div className="space-y-1.5">
                <div className="text-2xs text-slate-500 font-medium pb-0.5">
                  {lang === 'ar' ? 'انقر على أي عبارة لإدراجها مباشرة:' : 'Click to insert preset phrase:'}
                </div>

                <div className="space-y-1">
                  {phrases.map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleVirtualKeyPress(phrase.text)}
                      className="w-full text-right rtl:text-right ltr:text-left p-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate">{phrase.text}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 rtl:rotate-180" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Notice & Direct Repair */}
          <div className="p-2.5 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-2xs">
            <div className="flex items-center gap-1 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'ar' ? 'معالج الإدخال التلقائي نشط' : 'Input normalizer active'}</span>
            </div>

            <button
              type="button"
              onClick={handleRepairInputs}
              className="text-blue-600 hover:text-blue-700 font-black flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{repairSuccessNotification ? (lang === 'ar' ? 'تم التنشيط بنجاح!' : 'Fixed!') : (lang === 'ar' ? 'إصلاح الحقول' : 'Fix Inputs')}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

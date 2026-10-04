import React, { useState, useEffect } from 'react';
import { X, Printer, Check, RotateCcw, Type, Layout, Image, Sparkles, FileText, Sliders } from 'lucide-react';
import {
  PrintSettings,
  getSavedPrintSettings,
  savePrintSettings,
  DEFAULT_PRINT_SETTINGS,
} from '../utils/printSettings';
import { Language } from '../types';

interface PrintSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onSettingsChanged?: (settings: PrintSettings) => void;
}

export const PrintSettingsModal: React.FC<PrintSettingsModalProps> = ({
  isOpen,
  onClose,
  lang = 'ar',
  onSettingsChanged,
}) => {
  const [settings, setSettings] = useState<PrintSettings>(getSavedPrintSettings());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getSavedPrintSettings());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    savePrintSettings(settings);
    if (onSettingsChanged) {
      onSettingsChanged(settings);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_PRINT_SETTINGS });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in print:hidden">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 rtl" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {lang === 'ar' ? 'إعدادات الطباعة والمقاييس (إدخال يدوي مخصص)' : 'Print & Page Custom Sizing'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ar'
                  ? 'كتابة قيم حجم الخط، والمدخلات، وأبعاد وهوامش الورقة يدوياً بالكامل'
                  : 'Manual numeric inputs for font size, inputs, and paper dimensions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* 1. Font Size & Inputs Scale - Manual Numeric Input */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
              <Type className="w-4 h-4" />
              <span>{lang === 'ar' ? 'حجم الخط والمدخلات في الورقة (إدخال يدوي)' : 'Font & Inputs Sizing (Manual Input)'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Font Size in Points */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700">
                <label className="block text-slate-300 font-bold mb-1.5">
                  {lang === 'ar' ? 'حجم الخط الأساسي (بالنقاط pt):' : 'Base Font Size (pt):'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="20"
                    value={settings.customFontSizePt || 9.5}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fontSize: 'custom',
                        customFontSizePt: Math.max(5, Math.min(24, parseFloat(e.target.value) || 9.5)),
                      })
                    }
                    className="w-full bg-slate-950 text-amber-300 font-mono font-black text-sm px-3 py-2 rounded-lg border border-amber-500/50 focus:border-amber-400 focus:outline-none"
                    placeholder="9.5"
                  />
                  <span className="text-amber-400 font-bold font-mono text-xs shrink-0">pt</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {lang === 'ar' ? 'الافتراضي الموصى به: 9.5 pt' : 'Recommended: 9.5 pt'}
                </p>
              </div>

              {/* Font & Inputs Scale Percentage */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700">
                <label className="block text-slate-300 font-bold mb-1.5">
                  {lang === 'ar' ? 'نسبة مقياس الخط والمدخلات (%):' : 'Inputs & Font Scale (%):'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="40"
                    max="200"
                    value={settings.customFontScalePercent || 100}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fontSize: 'custom',
                        customFontScalePercent: Math.max(40, Math.min(250, parseInt(e.target.value, 10) || 100)),
                      })
                    }
                    className="w-full bg-slate-950 text-amber-300 font-mono font-black text-sm px-3 py-2 rounded-lg border border-amber-500/50 focus:border-amber-400 focus:outline-none"
                    placeholder="100"
                  />
                  <span className="text-amber-400 font-bold font-mono text-xs shrink-0">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {lang === 'ar' ? 'الافتراضي الموصى به: 100%' : 'Recommended: 100%'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Paper Dimensions & Margins - Manual Numeric Input */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
              <Layout className="w-4 h-4" />
              <span>{lang === 'ar' ? 'حجم وهوامش الورقة (إدخال يدوي بالأبعاد)' : 'Paper Dimensions & Margins (Manual Input)'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {/* Paper Width (mm) */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700">
                <label className="block text-slate-300 font-bold text-[11px] mb-1">
                  {lang === 'ar' ? 'عرض الورقة:' : 'Width (mm):'}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="1"
                    min="100"
                    max="500"
                    value={settings.customPaperWidthMm || 210}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        customPaperWidthMm: Math.max(50, Math.min(500, parseInt(e.target.value, 10) || 210)),
                      })
                    }
                    className="w-full bg-slate-950 text-blue-300 font-mono font-black text-xs px-2 py-1.5 rounded-lg border border-blue-500/50 focus:border-blue-400 focus:outline-none"
                    placeholder="210"
                  />
                  <span className="text-[10px] text-blue-400 font-mono font-bold">مم</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5">A4: 210 مم</span>
              </div>

              {/* Paper Height (mm) */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700">
                <label className="block text-slate-300 font-bold text-[11px] mb-1">
                  {lang === 'ar' ? 'طول الورقة:' : 'Height (mm):'}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="1"
                    min="100"
                    max="600"
                    value={settings.customPaperHeightMm || 297}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        customPaperHeightMm: Math.max(50, Math.min(600, parseInt(e.target.value, 10) || 297)),
                      })
                    }
                    className="w-full bg-slate-950 text-blue-300 font-mono font-black text-xs px-2 py-1.5 rounded-lg border border-blue-500/50 focus:border-blue-400 focus:outline-none"
                    placeholder="297"
                  />
                  <span className="text-[10px] text-blue-400 font-mono font-bold">مم</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5">A4: 297 مم</span>
              </div>

              {/* Top Margin (Safe Start below paper top edge) */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-amber-500/40">
                <label className="block text-amber-300 font-bold text-[11px] mb-1">
                  {lang === 'ar' ? 'الهامش العلوي (البداية من الأعلى):' : 'Top Margin (mm):'}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={settings.customMarginTopMm ?? 14}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(50, parseFloat(e.target.value) || 0));
                      setSettings({
                        ...settings,
                        marginWidth: 'custom',
                        customMarginTopMm: val,
                        customMarginTopBottomMm: val,
                      });
                    }}
                    className="w-full bg-slate-950 text-amber-300 font-mono font-black text-xs px-2 py-1.5 rounded-lg border border-amber-500/50 focus:border-amber-400 focus:outline-none"
                    placeholder="14"
                  />
                  <span className="text-[10px] text-amber-400 font-mono font-bold">مم</span>
                </div>
                <span className="text-[9px] text-amber-400/90 block mt-0.5 font-bold">{lang === 'ar' ? 'الموصى به: 12 - 16 مم (لتفادي قص الإطار)' : 'Recommended: 12 - 16 mm'}</span>
              </div>

              {/* Bottom Margin */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700">
                <label className="block text-slate-300 font-bold text-[11px] mb-1">
                  {lang === 'ar' ? 'الهامش السفلي:' : 'Bottom Margin (mm):'}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={settings.customMarginBottomMm ?? 4}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        marginWidth: 'custom',
                        customMarginBottomMm: Math.max(0, Math.min(50, parseFloat(e.target.value) || 0)),
                      })
                    }
                    className="w-full bg-slate-950 text-blue-300 font-mono font-black text-xs px-2 py-1.5 rounded-lg border border-blue-500/50 focus:border-blue-400 focus:outline-none"
                    placeholder="4"
                  />
                  <span className="text-[10px] text-blue-400 font-mono font-bold">مم</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5">الافتراضي: 4 مم</span>
              </div>

              {/* Left / Right Margin */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700">
                <label className="block text-slate-300 font-bold text-[11px] mb-1">
                  {lang === 'ar' ? 'هامش جانبي:' : 'Side Margins (mm):'}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={settings.customMarginLeftRightMm ?? 6}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        marginWidth: 'custom',
                        customMarginLeftRightMm: Math.max(0, Math.min(50, parseFloat(e.target.value) || 0)),
                      })
                    }
                    className="w-full bg-slate-950 text-blue-300 font-mono font-black text-xs px-2 py-1.5 rounded-lg border border-blue-500/50 focus:border-blue-400 focus:outline-none"
                    placeholder="6"
                  />
                  <span className="text-[10px] text-blue-400 font-mono font-bold">مم</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5">الافتراضي: 6 مم</span>
              </div>
            </div>
          </div>

          {/* 3. Show/Hide Logos & Images */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <Image className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  {lang === 'ar' ? 'عرض الشعارات والصور في الطباعة' : 'Show Logos & Images in Print'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {lang === 'ar'
                    ? 'إظهار شعارات الشركة وصور السيارات والتواقيع الموثقة'
                    : 'Show company logos, vehicle photos, and digital signatures'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showImages}
                onChange={(e) => setSettings({ ...settings, showImages: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* 4. Watermark Controls (العلامة المائية باسم SHAKER MOTORS) */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    {lang === 'ar' ? 'العلامة المائية في العقود (SHAKER MOTORS)' : 'Contract Watermark (SHAKER MOTORS)'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ar'
                      ? 'وضع أو إزالة العلامة المائية الشفافة في خلفية العقود والمستندات'
                      : 'Show or remove transparent watermark in background of contracts'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showWatermark ?? true}
                  onChange={(e) => setSettings({ ...settings, showWatermark: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            {(settings.showWatermark ?? true) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/60 animate-fade-in">
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700">
                  <label className="block text-slate-300 font-bold text-[11px] mb-1">
                    {lang === 'ar' ? 'نص العلامة المائية:' : 'Watermark Text:'}
                  </label>
                  <input
                    type="text"
                    value={settings.watermarkText || 'SHAKER MOTORS'}
                    onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                    className="w-full bg-slate-950 text-purple-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-purple-500/50 focus:border-purple-400 focus:outline-none"
                    placeholder="SHAKER MOTORS"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">الافتراضي: SHAKER MOTORS</span>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700">
                  <label className="block text-slate-300 font-bold text-[11px] mb-1">
                    {lang === 'ar' ? 'درجة الشفافية (%):' : 'Opacity (%):'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="2"
                      max="30"
                      step="1"
                      value={settings.watermarkOpacity ?? 8}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          watermarkOpacity: Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 8)),
                        })
                      }
                      className="w-full bg-slate-950 text-purple-300 font-mono font-bold text-xs px-3 py-1.5 rounded-lg border border-purple-500/50 focus:border-purple-400 focus:outline-none"
                      placeholder="8"
                    />
                    <span className="text-purple-400 font-bold font-mono text-xs shrink-0">%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">الافتراضي الموصى به: 8%</span>
                </div>
              </div>
            )}
          </div>

          {/* LocalStorage Note */}
          <div className="flex items-center gap-2 text-xs text-amber-400/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'القيم المدخلة يدوياً تُحفظ فوراً في المتصفح (localStorage) وتُطبق تلقائياً على كل عمليات الطباعة وتصدير PDF.'
                : 'Custom manual values are automatically saved and applied across all contract prints.'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إعادة للوضع الافتراضي' : 'Reset Defaults'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl transition shadow-lg ${
                savedSuccess ? 'bg-emerald-600' : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تم الحفظ!' : 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'حفظ القيم المخصصة' : 'Save Custom Values'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

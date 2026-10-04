import React, { useRef, useState } from 'react';
import { X, Check, RefreshCw, Fingerprint, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface FingerprintCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fingerprintDataUrl: string) => void;
  lang: Language;
  title?: string;
}

export const FingerprintCaptureModal: React.FC<FingerprintCaptureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lang,
  title,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3b82f6'; // Digital Blue / Purple Ink

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasContent(true);
  };

  const handleClear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasContent(false);
    }
  };

  const generateSimulatedFingerprint = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw realistic fingerprint whorls
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;

    for (let r = 10; r < 90; r += 7) {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, r * 0.75, r, Math.PI / 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Add minucia points / ridge breaks
    ctx.fillStyle = '#1d4ed8';
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * 60;
      const px = centerX + Math.cos(angle) * dist * 0.75;
      const py = centerY + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    setHasContent(true);
  };

  const handleConfirm = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <Fingerprint className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {title || (lang === 'ar' ? 'أخذ بصمة المستأجر الرقمية' : 'Capture Digital Fingerprint')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="p-5 flex flex-col items-center justify-center space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {lang === 'ar'
              ? 'ضع البصمة باستخدام جهاز اللمس أو الضغط على زر التوليد الآلي للبصمة الرسمية'
              : 'Touch canvas to draw or click generate to simulate biometric fingerprint'}
          </p>

          <div className="relative border-2 border-dashed border-purple-300 dark:border-purple-800/60 rounded-xl p-2 bg-purple-50/20 dark:bg-purple-950/20 shadow-inner">
            <canvas
              ref={canvasRef}
              width={260}
              height={220}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onMouseMove={draw}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="touch-none bg-white dark:bg-slate-950 rounded-lg cursor-crosshair shadow-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between w-full gap-2 pt-2">
            <button
              type="button"
              onClick={generateSimulatedFingerprint}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'توليد بصمة رقمية' : 'Auto Generate'}</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'مسح' : 'Clear'}</span>
            </button>
          </div>
        </div>

        {/* Footer Confirm */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasContent}
            className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{lang === 'ar' ? 'اعتماد البصمة' : 'Save Fingerprint'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

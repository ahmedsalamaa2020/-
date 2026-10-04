import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Upload } from 'lucide-react';
import { translations } from '../translations/i18n';
import { Language } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  lang: Language;
  title?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  lang,
  title,
}) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setCameraError(lang === 'ar' ? 'تعذر الوصول للكاميرا. يرجى التأكد من إعطاء الأذن أو رفع صورة بدلاً من ذلك.' : 'Camera access denied or unavailable. Please upload a photo instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const maxDim = 640;
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 480;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 720;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.75);
            setCapturedImage(compressed);
            stopCamera();
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              {title || t.capturePhoto}
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col items-center justify-center">
          <canvas ref={canvasRef} className="hidden" />

          {capturedImage ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden border-2 border-blue-500 shadow-md">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ {lang === 'ar' ? 'تم التقاط الصورة بنجاح' : 'Photo captured successfully'}
              </p>
            </div>
          ) : (
            <div className="w-full">
              {cameraError ? (
                <div className="p-6 text-center bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">{cameraError}</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer shadow-sm transition">
                    <Upload className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'اختر صورة من الجهاز' : 'Upload photo file'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Camera overlay guide */}
                  <div className="absolute inset-0 border-2 border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-64 border-2 border-dashed border-blue-400/70 rounded-2xl flex items-center justify-center">
                      <span className="text-xs text-white/70 bg-black/40 px-2 py-1 rounded">
                        {lang === 'ar' ? 'ضع الوجه أو الهوية هنا' : 'Align ID or face here'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          {!capturedImage ? (
            <div className="flex items-center justify-between w-full">
              <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 cursor-pointer hover:text-blue-600">
                <Upload className="w-4 h-4" />
                <span>{lang === 'ar' ? 'رفع ملف' : 'Upload file'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={takeSnapshot}
                disabled={!!cameraError}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
              >
                <Camera className="w-4 h-4" />
                <span>{t.takeSnapshot}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-3">
              <button
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t.retake}</span>
              </button>

              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-md shadow-emerald-500/20 transition"
              >
                <Check className="w-4 h-4" />
                <span>{t.confirm}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

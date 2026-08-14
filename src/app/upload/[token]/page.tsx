'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Camera, CheckCircle2, AlertCircle, Upload, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRIntakeManager } from '@/lib/hardware/qr-intake';

export default function MobileCapturePage() {
  const params = useParams();
  const token = params.token as string;

  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    const validation = QRIntakeManager.validateToken(token);
    if (validation.isValid) {
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
      setErrorMessage(validation.reason || 'Session expired.');
    }
  }, [token]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsUploaded(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    try {
      // Simulate/perform presigned R2 upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setIsUploaded(true);
      QRIntakeManager.markTokenUsed(token);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Session Expired or Invalid</h1>
        <p className="text-sm text-neutral-400 max-w-xs">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold">DCOS Mobile Intake</h1>
            <p className="text-[10px] text-neutral-400">Chairside Camera Bridge</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
          LIVE
        </Badge>
      </div>

      {/* Main Capture Zone */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-6">
        {previewUrl ? (
          <div className="w-full max-w-xs aspect-square rounded-2xl overflow-hidden border border-neutral-800 relative bg-neutral-900 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Clinical Capture" className="w-full h-full object-cover" />
            {isUploaded && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-emerald-400 p-4 text-center">
                <CheckCircle2 className="w-12 h-12 mb-2" />
                <span className="text-sm font-bold">Transferred to Desktop</span>
                <span className="text-[11px] text-neutral-400 mt-1">Stored in Cloudflare R2</span>
              </div>
            )}
          </div>
        ) : (
          <label className="w-full max-w-xs aspect-square rounded-2xl border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-neutral-900/50">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Camera className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-neutral-200">Tap to Take Photo</span>
            <span className="text-xs text-neutral-500 mt-1">Shade Match / Intraoral View</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}

        {previewUrl && !isUploaded && (
          <div className="flex gap-3 w-full max-w-xs">
            <label className="flex-1">
              <Button variant="outline" className="w-full text-xs font-semibold border-neutral-700 pointer-events-none">
                Retake
              </Button>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold gap-1.5"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" /> Push to Web
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-neutral-800 text-center">
        <p className="text-[10px] text-neutral-500">
          Encrypted R2 Presigned Direct-to-Storage Pipeline • DCOS 2.0
        </p>
      </div>
    </div>
  );
}

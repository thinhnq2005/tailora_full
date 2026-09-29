"use client";

import React, { useRef, useState, useCallback } from "react";
import MetalButton from "@/components/ui/button/MetalButton";

export type CameraCaptureProps = {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
  tenant?: any;
};

const getContrastTextColor = (hexColor: string): string => {
  const cleanHex = hexColor.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
};

export default function CameraCapture({ onCapture, onClose, tenant }: CameraCaptureProps): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isLive, setIsLive] = useState<boolean>(false);

  const themeColor = tenant?.primary_color || 'var(--theme-color)';
  const buttonTextColor = getContrastTextColor(themeColor);

  const startCamera = useCallback(async () => {
    setStatus("Đang kết nối thiết bị camera bến bãi...");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLive(true);
      setStatus("");
    } catch {
      setStatus("Không thể truy cập camera hệ thống, hãy đợi hoặc kiểm tra quyền thiết bị.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsLive(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        onCapture(base64);
        stopCamera();
      } catch {
        setStatus("Hệ thống xử lý ảnh đang lỗi, vui lòng thử lại.");
      }
    }
  }, [onCapture, stopCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div 
        className="w-full max-w-xl rounded-2xl border-2 border-black bg-white p-5 shadow-2xl"
        style={{ color: '#000000' }}
      >
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <h3 className="text-xs font-black text-black uppercase tracking-wider">QUÉT TOA HÀNG TRỰC TIẾP CAMERA</h3>
          </div>
          <button
            type="button"
            className="text-black hover:bg-gray-100 border-2 border-black px-2.5 py-1 text-xs font-bold rounded transition-colors"
            onClick={handleClose}
          >
            
          </button>
        </div>

        {status && (
          <div 
            className="mt-3 text-xs font-mono py-2 px-3 rounded border-2 border-black"
            style={{ backgroundColor: '#ffffff', color: '#000000', fontWeight: 'bold' }}
          >
            {status}
          </div>
        )}

        <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl border-2 border-black bg-gray-100">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!isLive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <span className="text-xs font-mono text-gray-400">Ống kính chưa được kích hoạt</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          {!isLive ? (
            <button
              type="button"
              className="flex-1 rounded-xl border-2 border-black font-bold text-xs uppercase tracking-wider py-3 transition-colors"
              style={{ backgroundColor: themeColor, color: buttonTextColor }}
              onClick={startCamera}
            >
              Bật Camera bến bãi
            </button>
          ) : (
            <button
              type="button"
              className="flex-1 rounded-xl border-2 border-black font-bold text-xs uppercase tracking-wider py-3 transition-colors"
              style={{ backgroundColor: themeColor, color: buttonTextColor }}
              onClick={capturePhoto}
            >
               Chụp &amp; Trích xuất ảnh
            </button>
          )}
          
          <button
            type="button"
            className="flex-1 border-2 border-black text-black hover:bg-gray-100 bg-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
            onClick={handleClose}
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
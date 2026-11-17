// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, QrCode, LogIn, AlertCircle, RefreshCw } from 'lucide-react';
import Modal from './Modal';
import toast from 'react-hot-toast';

interface FamilyQrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void> | void;
  joining: boolean;
  initialCode?: string;
}

export default function FamilyQrScannerModal({
  open,
  onClose,
  onJoin,
  joining,
  initialCode = '',
}: FamilyQrScannerModalProps) {
  const [tab, setTab] = useState<'qr' | 'manual'>('manual');
  const [scanMethod, setScanMethod] = useState<'camera' | 'file'>('camera');
  const [manualCode, setManualCode] = useState(initialCode);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningFile, setIsScanningFile] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileScannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    if (initialCode) {
      setManualCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (fileScannerRef.current) {
        try {
          fileScannerRef.current.clear();
        } catch {
          // ignore
        }
        fileScannerRef.current = null;
      }
    };
  }, []);

  // Helper: Tạo ảnh đệm viền trắng (quiet zone padding) giúp bộ giải mã ZXing nhận diện mã QR chắc chắn 100%
  const createPaddedImageFile = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const padding = Math.max(60, Math.round(Math.min(img.width, img.height) * 0.15));
          const canvas = document.createElement('canvas');
          canvas.width = img.width + padding * 2;
          canvas.height = img.height + padding * 2;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, padding, padding);
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(new File([blob], 'padded_' + file.name, { type: 'image/png' }));
          }, 'image/png');
        } catch {
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });
  };

  // Helper: Chuẩn hóa kích thước ảnh về tối đa 800px (phòng ngừa ảnh chụp camera 4K/48MP quá lớn)
  const createResizedImageFile = async (file: File, maxDim = 800): Promise<File | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const maxCurrent = Math.max(img.width, img.height);
          if (maxCurrent <= maxDim) {
            resolve(null);
            return;
          }
          const scale = maxDim / maxCurrent;
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const padding = 50;
          const canvas = document.createElement('canvas');
          canvas.width = w + padding * 2;
          canvas.height = h + padding * 2;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, padding, padding, w, h);
          canvas.toBlob((blob) => {
            if (!blob) return resolve(null);
            resolve(new File([blob], 'resized_' + file.name, { type: 'image/png' }));
          }, 'image/png');
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  };

  // Extract invite code from decoded QR text (handles full URLs and raw codes)
  const extractJoinCode = (rawText: string): string => {
    const trimmed = rawText.trim();
    if (trimmed.includes('joinCode=')) {
      try {
        const url = new URL(trimmed, window.location.origin);
        const code = url.searchParams.get('joinCode');
        if (code) return code.trim().toUpperCase();
      } catch {
        // fallback
      }
    }
    const match = trimmed.match(/FAM-[A-Z0-9]+/i);
    if (match) return match[0].toUpperCase();
    return trimmed.toUpperCase();
  };

  const handleScanSuccess = async (decodedText: string) => {
    const code = extractJoinCode(decodedText);
    if (!code) {
      toast.error('Mã QR không hợp lệ');
      return;
    }

    toast.success(`Đã quét được mã: ${code}`);
    stopCamera();
    onJoin(code);
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      if (scannerRef.current) {
        await stopCamera();
      }

      const readerElement = document.getElementById('family-qr-reader');
      if (!readerElement) {
        setIsStartingCamera(false);
        return;
      }

      const scanner = new Html5Qrcode('family-qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore frame errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera scan failed to start:', err);
      setCameraError(
        'Không thể mở camera. Vui lòng cấp quyền truy cập camera hoặc chọn tải ảnh mã QR lên.'
      );
      setIsScanning(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopCamera = async () => {
    if (isStoppingRef.current) return;
    const scanner = scannerRef.current;
    if (scanner && scanner.isScanning) {
      isStoppingRef.current = true;
      try {
        await scanner.stop();
        scanner.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        isStoppingRef.current = false;
        setIsScanning(false);
        scannerRef.current = null;
      }
    }
  };

  // Manage camera lifecycle when modal opens/closes or tabs change
  useEffect(() => {
    if (open && tab === 'qr' && scanMethod === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 200);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [open, tab, scanMethod]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    try {
      let fileScanner = fileScannerRef.current;
      if (!fileScanner) {
        const fileDiv = document.getElementById('family-qr-file-anchor');
        if (fileDiv) {
          fileScanner = new Html5Qrcode('family-qr-file-anchor');
          fileScannerRef.current = fileScanner;
        }
      }

      if (!fileScanner) {
        toast.error('Không thể khởi tạo bộ đọc ảnh');
        return;
      }

      let decodedText: string | null = null;

      // Chiến lược 1: Thêm khoảng đệm viền trắng xung quanh (xử lý triệt để ảnh QR sát mép, ảnh gửi qua mạng xã hội)
      try {
        const paddedFile = await createPaddedImageFile(file);
        decodedText = await fileScanner.scanFile(paddedFile, false);
      } catch {
        // Chiến lược 2: Quét trực tiếp file ảnh gốc
        try {
          decodedText = await fileScanner.scanFile(file, false);
        } catch {
          // Chiến lược 3: Thu nhỏ kích thước ảnh kèm viền trắng (xử lý ảnh chụp màn hình máy ảnh độ phân giải cao)
          try {
            const resizedFile = await createResizedImageFile(file, 800);
            if (resizedFile) {
              decodedText = await fileScanner.scanFile(resizedFile, false);
            }
          } catch {
            // Không nhận dạng được qua cả 3 chiến lược
          }
        }
      }

      if (decodedText) {
        handleScanSuccess(decodedText);
      } else {
        toast.error('Không tìm thấy mã QR trong ảnh. Vui lòng chọn ảnh khác rõ nét hơn hoặc nhập mã mời trực tiếp.');
      }
    } catch {
      toast.error('Không thể đọc tệp ảnh mã QR.');
    } finally {
      setIsScanningFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error('Vui lòng nhập mã mời');
      return;
    }
    onJoin(manualCode.trim().toUpperCase());
  };

  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleModalClose} title="Tham gia nhóm gia đình" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Offscreen measurable container for file scanning - always present in DOM */}
        <div
          id="family-qr-file-anchor"
          className="fixed -left-[9999px] -top-[9999px] w-[350px] h-[350px] pointer-events-none opacity-0 overflow-hidden"
          aria-hidden="true"
        />

        {/* Tab selection */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              tab === 'manual'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Nhập mã mời
          </button>
          <button
            type="button"
            onClick={() => setTab('qr')}
            className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              tab === 'qr'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Quét mã QR
          </button>
        </div>

        {tab === 'qr' && (
          <div className="space-y-3">
            {/* Scan method switch: Camera vs Upload Image */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setScanMethod('camera')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  scanMethod === 'camera'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Dùng Camera
              </button>
              <button
                type="button"
                onClick={() => setScanMethod('file')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  scanMethod === 'file'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Tải ảnh mã QR
              </button>
            </div>

            {scanMethod === 'camera' ? (
              <div className="relative">
                <div
                  id="family-qr-reader"
                  className="w-full aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden bg-gray-900 relative flex items-center justify-center text-white"
                >
                  {isStartingCamera && (
                    <div className="flex flex-col items-center gap-2 text-xs text-gray-300">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Đang mở camera...</span>
                    </div>
                  )}
                  {isScanning && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-primary/50 rounded-xl shadow-inner animate-pulse" />
                  )}
                </div>

                {cameraError && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="btn btn-secondary text-xs py-1 px-2.5"
                      >
                        Thử lại
                      </button>
                      <button
                        type="button"
                        onClick={() => setScanMethod('file')}
                        className="btn btn-primary text-xs py-1 px-2.5"
                      >
                        Tải ảnh mã QR lên
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-center text-xs text-gray-500 mt-2">
                  Hướng camera vào mã QR của nhóm gia đình để quét tự động
                </p>
              </div>
            ) : (
              <div className="py-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isScanningFile}
                  className="hidden"
                  id="qr-file-input"
                />
                <label
                  htmlFor="qr-file-input"
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 hover:border-primary rounded-xl cursor-pointer bg-gray-50 hover:bg-primary/5 transition-colors ${
                    isScanningFile ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    {isScanningFile ? (
                      <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {isScanningFile ? 'Đang đọc và phân tích mã QR...' : 'Bấm để chọn ảnh mã QR'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 text-center">
                    {isScanningFile
                      ? 'Đang áp dụng bộ lọc nhận diện thông minh...'
                      : 'Hỗ trợ ảnh chụp màn hình, ảnh thẻ tải về, ảnh gửi qua Zalo/Mess'}
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {tab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã mời nhóm gia đình *
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="input font-mono text-center tracking-wider text-lg"
                placeholder="FAM-XXXXXXXX"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1.5 text-center">
                Mã gồm định dạng FAM- theo sau là 8 ký tự do chủ nhóm chia sẻ
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={joining || !manualCode.trim()}
                className="btn btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {joining ? 'Đang tham gia...' : 'Tham gia ngay'}
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="btn btn-secondary flex-1 py-2.5"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

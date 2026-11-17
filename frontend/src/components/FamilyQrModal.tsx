// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Check, Download, Share2 } from 'lucide-react';
import Modal from './Modal';
import { FinancialSpace } from '../types';
import toast from 'react-hot-toast';

interface FamilyQrModalProps {
  open: boolean;
  onClose: () => void;
  space: FinancialSpace | null;
}

export default function FamilyQrModal({ open, onClose, space }: FamilyQrModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const [customOrigin, setCustomOrigin] = useState(() => localStorage.getItem('qr_custom_origin') || (typeof window !== 'undefined' ? window.location.origin : ''));
  const [showConfigOrigin, setShowConfigOrigin] = useState(false);

  if (!space || !space.inviteCode) return null;

  const baseOrigin = customOrigin.trim() || window.location.origin;
  const inviteLink = `${baseOrigin}/family?joinCode=${encodeURIComponent(space.inviteCode)}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(space.inviteCode!);
      setCopiedCode(true);
      toast.success('Đã sao chép mã mời!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast.success('Đã sao chép liên kết tham gia!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  const handleDownloadQr = () => {
    const qrCanvas = qrRef.current?.querySelector('canvas');
    if (!qrCanvas) {
      toast.error('Không tìm thấy hình ảnh mã QR');
      return;
    }

    try {
      // Tạo một thẻ card hình ảnh chuẩn độ phân giải cao (520x650) có viền trắng rộng và thông tin rõ ràng
      const cardCanvas = document.createElement('canvas');
      const cardWidth = 520;
      const cardHeight = 650;
      cardCanvas.width = cardWidth;
      cardCanvas.height = cardHeight;
      const ctx = cardCanvas.getContext('2d');
      if (!ctx) {
        toast.error('Không thể tạo hình ảnh');
        return;
      }

      // Nền trắng tinh khiết
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      // Đường viền nhẹ thanh lịch quanh thẻ
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 3;
      ctx.strokeRect(12, 12, cardWidth - 24, cardHeight - 24);

      // Tiêu đề ứng dụng
      ctx.fillStyle = '#4F46E5';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BUDGIVEE · TÀI CHÍNH GIA ĐÌNH', cardWidth / 2, 54);

      // Tên không gian gia đình
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(space.name, cardWidth / 2, 88);

      // Vẽ mã QR ở chính giữa với khoảng đệm trắng cực kỳ rộng (đảm bảo máy quét nào cũng đọc được)
      const qrSize = 320;
      const qrX = (cardWidth - qrSize) / 2;
      const qrY = 115;
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // Khung chứa mã mời dạng chữ
      const boxY = 465;
      const boxWidth = cardWidth - 80;
      const boxX = 40;
      ctx.fillStyle = '#F3F4F6';
      ctx.fillRect(boxX, boxY, boxWidth, 80);
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxWidth, 80);

      // Nhãn mã mời
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText('MÃ MỜI THAM GIA NHÓM:', cardWidth / 2, boxY + 28);

      // Mã mời (In hoa, font mono)
      ctx.fillStyle = '#4F46E5';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(space.inviteCode || '', cardWidth / 2, boxY + 62);

      // Dòng hướng dẫn ở chân thẻ
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillText('Quét mã QR bằng ứng dụng hoặc nhập mã ở trên để tham gia', cardWidth / 2, 588);

      const url = cardCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgivee-family-${space.inviteCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Đã tải hình ảnh mã QR chất lượng cao!');
    } catch {
      toast.error('Có lỗi khi tạo ảnh');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Mã QR tham gia nhóm" maxWidth="max-w-md">
      <div className="text-center space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{space.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Quét mã để tham gia không gian tài chính gia đình
          </p>
        </div>

        {isLocalhost && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-900">📱 Mẹo quét bằng điện thoại (Mạng Wi-Fi)</span>
              <button
                type="button"
                onClick={() => setShowConfigOrigin(!showConfigOrigin)}
                className="text-primary hover:underline font-medium text-[11px]"
              >
                {showConfigOrigin ? 'Đóng' : 'Đổi địa chỉ IP máy tính'}
              </button>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Bạn đang mở web bằng <code className="font-mono bg-amber-100 px-1 rounded">localhost</code>. Điện thoại quét vào sẽ không mở được vì khác máy. Để điện thoại mở được web, hãy mở web trên máy tính bằng IP Wi-Fi (VD: <code className="font-mono bg-amber-100 px-1 rounded">http://192.168.x.x:3000</code>) hoặc bấm <strong>"Đổi địa chỉ IP máy tính"</strong>.
            </p>
            {showConfigOrigin && (
              <div className="pt-2 flex gap-1.5">
                <input
                  type="text"
                  value={customOrigin}
                  onChange={(e) => {
                    setCustomOrigin(e.target.value);
                    localStorage.setItem('qr_custom_origin', e.target.value);
                  }}
                  placeholder="VD: http://192.168.1.15:3000"
                  className="input text-xs py-1.5 px-2 flex-1 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomOrigin(window.location.origin);
                    localStorage.removeItem('qr_custom_origin');
                  }}
                  className="btn btn-secondary text-xs py-1.5 px-2.5 shrink-0"
                >
                  Đặt lại
                </button>
              </div>
            )}
          </div>
        )}

        {/* QR Code Container */}
        <div className="flex justify-center my-3">
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 inline-block"
          >
            <QRCodeCanvas
              value={inviteLink}
              size={240}
              level="H"
              marginSize={4}
            />
          </div>
        </div>

        {/* Invite Code display */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
          <div className="text-left">
            <span className="text-xs text-gray-500 block">Mã mời nhóm:</span>
            <span className="font-mono font-bold text-base text-primary tracking-wider">
              {space.inviteCode}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Đã chép' : 'Chép mã'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-secondary flex items-center justify-center gap-1.5 text-sm py-2"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            {copiedLink ? 'Đã sao chép' : 'Sao chép link'}
          </button>
          <button
            type="button"
            onClick={handleDownloadQr}
            className="btn btn-primary flex items-center justify-center gap-1.5 text-sm py-2"
          >
            <Download className="w-4 h-4" />
            Tải mã QR
          </button>
        </div>

        <p className="text-[11px] text-gray-400">
          Người nhận có thể quét bằng camera điện thoại hoặc tải ảnh mã QR lên tại trang Gia đình.
        </p>
      </div>
    </Modal>
  );
}


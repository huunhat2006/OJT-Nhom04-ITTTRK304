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

  if (!space || !space.inviteCode) return null;

  const inviteLink = `${window.location.origin}/family?joinCode=${encodeURIComponent(space.inviteCode)}`;

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
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) {
      toast.error('Không tìm thấy hình ảnh mã QR');
      return;
    }
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgivee-family-${space.inviteCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Đã tải hình ảnh mã QR!');
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

        {/* QR Code Container */}
        <div className="flex justify-center my-3">
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 inline-block"
          >
            <QRCodeCanvas
              value={inviteLink}
              size={210}
              level="H"
              includeMargin={false}
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


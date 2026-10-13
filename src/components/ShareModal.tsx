import React, { useState } from 'react';
import { Share2, X, Copy, Check, Download } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  editionDate: string; // e.g. "2026-10-12"
  pageImages: string[];
  onTriggerToast: (message: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  editionDate,
  pageImages,
  onTriggerToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/?date=${editionDate}`;

  const handleCopy = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        onTriggerToast('Edition link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        onTriggerToast('Press Ctrl+C to copy edition link');
      });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Read Fikr-O-Khayal Weekly E-Paper (${editionDate} Edition):\n${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(
      `Read Fikr-O-Khayal Weekly E-Paper - ${editionDate} Edition`
    );
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    onTriggerToast('Generating broadsheet edition download...');

    try {
      // Create a printable window or direct image download
      const targetUrl = pageImages[0];
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Fikr-O-Khayal-${editionDate}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      onTriggerToast(`Download complete: Fikr-O-Khayal-${editionDate}`);
    } catch {
      // Fallback direct link trigger
      const link = document.createElement('a');
      link.href = pageImages[0];
      link.target = '_blank';
      link.download = `Fikr-O-Khayal-${editionDate}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onTriggerToast(`Opened edition for download`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark blurred backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#050817]/80 modal-backdrop transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl p-6 md:p-8 w-full max-w-[390px] shadow-2xl flex flex-col items-center text-center z-10 border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Circular Share Top Icon */}
        <div className="w-14 h-14 rounded-full bg-[#E5FAF2] flex items-center justify-center mb-3.5">
          <Share2 className="w-6 h-6 text-[#00C98B]" />
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-2">
          Share E-Paper
        </h2>

        {/* Edition Date Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#E6F8F3] text-[#006B5B] font-semibold text-xs mb-6">
          <span>{editionDate} Edition</span>
        </div>

        {/* Social Share Icons Row */}
        <div className="grid grid-cols-3 gap-5 w-full max-w-[260px] mb-6">
          {/* WhatsApp */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleWhatsApp}
              title="Share on WhatsApp"
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-[#25D366] hover:bg-gray-50 shadow-sm transition-transform active:scale-95 mb-1.5 cursor-pointer"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </button>
            <span className="text-[11px] font-semibold text-gray-700">WhatsApp</span>
          </div>

          {/* Facebook */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleFacebook}
              title="Share on Facebook"
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-[#1877F2] hover:bg-gray-50 shadow-sm transition-transform active:scale-95 mb-1.5 cursor-pointer"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <span className="text-[11px] font-semibold text-gray-700">Facebook</span>
          </div>

          {/* Twitter / X */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleTwitter}
              title="Share on X"
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-900 hover:bg-gray-50 shadow-sm transition-transform active:scale-95 mb-1.5 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <span className="text-[11px] font-semibold text-gray-700">Twitter</span>
          </div>
        </div>

        {/* Share Link Input with Copy button */}
        <div className="w-full bg-[#F3F6FA] border border-gray-200 rounded-xl p-1.5 flex items-center justify-between mb-5">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="bg-transparent text-xs text-gray-500 px-2 outline-none w-full truncate select-all font-mono"
          />
          <button
            onClick={handleCopy}
            className="shrink-0 bg-[#0B1224] hover:bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Download Full PDF Button */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="w-full bg-[#009F82] hover:bg-[#00876E] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#009F82]/25 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {downloading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{downloading ? 'Preparing Download...' : 'Download Full PDF'}</span>
        </button>
      </div>
    </div>
  );
};

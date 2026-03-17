import { useRef, useState, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import type { Brew } from '../types/brew';
import ShareSticker from './ShareSticker';

interface Props {
  brew: Brew;
  isOpen: boolean;
  onClose: () => void;
  siteUrl?: string;
}

export default function ShareModal({
  brew,
  isOpen,
  onClose,
  siteUrl = 'https://notomorrowbrewing.com',
}: Props) {
  const stickerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const beerUrl = `${siteUrl}/beer/${brew.id}`;

  // Check if native sharing is supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      // Test if file sharing is supported
      const testFile = new File([''], 'test.png', { type: 'image/png' });
      setCanNativeShare(navigator.canShare?.({ files: [testFile] }) ?? false);
    }
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!stickerRef.current) return null;

    try {
      const dataUrl = await toPng(stickerRef.current, {
        quality: 1,
        pixelRatio: 3,
        // No backgroundColor - preserves transparency for overlay use
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      return await response.blob();
    } catch (err) {
      console.error('Failed to generate sticker:', err);
      return null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) return;

      const file = new File([blob], `${brew.id}-sticker.png`, {
        type: 'image/png',
      });

      await navigator.share({
        files: [file],
        title: `${brew.name} - No Tomorrow Brewing`,
        text: `Check out ${brew.name} (${brew.abv}% ${brew.style}) from No Tomorrow Brewing`,
      });
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [brew, generateImage]);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${brew.id}-sticker.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [brew.id, generateImage]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(beerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [beerUrl]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-void-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-deep-space border border-art-deco-brass max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-art-deco-brass/25 px-4 py-3 flex justify-between items-center sticky top-0 bg-deep-space z-10">
          <h3 className="font-sans uppercase font-light text-sm tracking-widest text-stardust">
            Share This Beer
          </h3>
          <button
            onClick={onClose}
            className="text-stardust/50 hover:text-stardust text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Sticker Preview */}
        <div className="p-6 flex justify-center">
          <ShareSticker ref={stickerRef} brew={brew} />
        </div>

        {/* Actions */}
        <div className="border-t border-art-deco-brass/25 px-4 py-4 space-y-3">
          {/* Share / Download Row */}
          <div className="flex gap-3">
            {canNativeShare ? (
              <button
                onClick={handleShare}
                disabled={isGenerating}
                className="flex-1 font-mono text-xs py-3 border border-art-deco-brass bg-art-deco-brass text-void-black hover:bg-art-deco-brass/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                {isGenerating ? 'Generating...' : 'Share'}
              </button>
            ) : null}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className={`${
                canNativeShare ? 'flex-1' : 'w-full'
              } font-mono text-xs py-3 border border-art-deco-brass ${
                canNativeShare
                  ? 'text-art-deco-brass hover:bg-art-deco-brass/10'
                  : 'bg-art-deco-brass text-void-black hover:bg-art-deco-brass/90'
              } transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {isGenerating && !canNativeShare ? 'Generating...' : 'Download PNG'}
            </button>
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full font-mono text-xs py-3 border border-stardust/25 text-stardust/70 hover:text-stardust hover:border-stardust/50 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          {/* URL Preview */}
          <p className="font-mono text-[10px] text-stardust/40 text-center truncate">
            {beerUrl}
          </p>
        </div>
      </div>
    </div>
  );
}

import { useRef, useState, useCallback, useEffect } from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import type { Brew } from '../types/brew';
import { generateBackground } from '../utils/generativeArt';

interface Props {
  brew: Brew;
}

const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 384;
const EXPORT_SCALE = 3; // 3x for 300dpi equivalent

export default function LabelMaker({ brew }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate background art when modal opens
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        generateBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, brew);
      }
    }
  }, [isOpen, brew]);

  const downloadLabel = useCallback(async () => {
    if (!canvasRef.current || !overlayRef.current) return;

    setIsGenerating(true);
    try {
      // Create high-res export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = CANVAS_WIDTH * EXPORT_SCALE;
      exportCanvas.height = CANVAS_HEIGHT * EXPORT_SCALE;
      const exportCtx = exportCanvas.getContext('2d');

      if (!exportCtx) throw new Error('Failed to get export canvas context');

      // Scale and draw the generative background
      exportCtx.scale(EXPORT_SCALE, EXPORT_SCALE);
      generateBackground(exportCtx, CANVAS_WIDTH, CANVAS_HEIGHT, brew);
      exportCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

      // Draw text overlay using html-to-image then composite
      const { toPng } = await import('html-to-image');
      const overlayDataUrl = await toPng(overlayRef.current, {
        quality: 1,
        pixelRatio: EXPORT_SCALE,
        backgroundColor: 'transparent',
      });

      // Load and draw the overlay
      const overlayImg = new Image();
      await new Promise<void>((resolve, reject) => {
        overlayImg.onload = () => resolve();
        overlayImg.onerror = reject;
        overlayImg.src = overlayDataUrl;
      });

      exportCtx.drawImage(overlayImg, 0, 0);

      // Download
      const link = document.createElement('a');
      link.download = `${brew.id}-label.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate label:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [brew]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="font-mono text-xs px-3 py-2 border border-art-deco-brass/50 text-art-deco-brass/70 hover:border-art-deco-brass hover:text-art-deco-brass hover:bg-art-deco-brass/10 transition-colors"
        title="Generate printable label"
      >
        Label
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-void-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-deep-space border border-art-deco-brass max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-art-deco-brass/25 px-4 py-3 flex justify-between items-center">
              <h3 className="font-sans uppercase font-light text-sm tracking-widest text-stardust">
                Label Preview
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-stardust/50 hover:text-stardust text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Label Preview */}
            <div className="p-6 flex justify-center overflow-hidden">
              <div
                className="relative border-2 border-art-deco-brass"
                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, overflow: 'hidden' }}
              >
                {/* Generative Background Canvas */}
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="absolute inset-0"
                />

                {/* Text Overlay Container */}
                <div
                  ref={overlayRef}
                  className="absolute inset-0 overflow-hidden"
                  style={{ fontFamily: '"Space Mono", monospace' }}
                >
                  {/* Main Content */}
                  <div className="absolute inset-0 flex flex-col p-3 pb-12">
                  {/* Brewery Name */}
                  <div className="text-center mb-2 pb-2 border-b border-art-deco-brass/50 bg-void-black/60 -mx-3 -mt-3 px-3 pt-3">
                    <p
                      className="text-art-deco-brass text-xs tracking-[0.3em] uppercase"
                      style={{ fontFamily: '"Josefin Sans", sans-serif' }}
                    >
                      No Tomorrow
                    </p>
                    <p
                      className="text-art-deco-brass text-xs tracking-[0.2em] uppercase"
                      style={{ fontFamily: '"Josefin Sans", sans-serif' }}
                    >
                      Brewing Co.
                    </p>
                  </div>

                  {/* Beer Name */}
                  <div className="text-center mb-2 bg-void-black/70 py-1.5 -mx-3 px-3">
                    <h4
                      className="text-stardust text-sm uppercase tracking-widest leading-tight"
                      style={{ fontFamily: '"Josefin Sans", sans-serif' }}
                    >
                      {brew.name}
                    </h4>
                    <p className="text-stardust/60 text-[11px] mt-0.5">{brew.style}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2 text-center">
                    <div className="border border-art-deco-brass/40 py-1.5 px-2 bg-void-black/70">
                      <p className="text-stardust/60 text-[8px] uppercase">ABV</p>
                      <p className="text-art-deco-brass text-sm font-bold">{brew.abv}%</p>
                    </div>
                    <div className="border border-art-deco-brass/40 py-1.5 px-2 bg-void-black/70">
                      <p className="text-stardust/60 text-[8px] uppercase">IBU</p>
                      <p className="text-oxidized-copper text-sm font-bold">{brew.ibu}</p>
                    </div>
                  </div>

                  {/* Hops */}
                  {brew.hops && (
                    <div className="text-center mb-1.5 py-1.5 border-t border-b border-art-deco-brass/30 bg-void-black/60 -mx-3 px-3">
                      <p className="text-stardust/60 text-[8px] uppercase mb-0.5">Hops</p>
                      <p className="text-stardust text-[10px]">{brew.hops}</p>
                    </div>
                  )}

                  {/* Brew Date */}
                  <div className="text-center mb-1.5">
                    <p className="text-stardust/60 text-[8px] uppercase">Brewed</p>
                    <p className="text-stardust text-[11px]">{formatDate(brew.brew_date)}</p>
                  </div>

                  {/* Spacer */}
                  <div className="flex-grow min-h-0" />

                  {/* QR Code */}
                  <div className="flex justify-center mb-1">
                    <div className="p-1 bg-stardust">
                      <QRCodeSVG
                        value={`https://notomorrowbrewing.com/beer/${brew.id}`}
                        size={40}
                        bgColor="#E8E6E1"
                        fgColor="#0D0D0D"
                        level="M"
                      />
                    </div>
                  </div>
                  <p className="text-center text-stardust/50 text-[7px]">
                    Scan for details
                  </p>
                  </div>

                  {/* Barcode - positioned absolutely at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center pt-1.5 border-t border-art-deco-brass/50 bg-void-black/90 px-3 pb-1">
                    <Barcode
                      value={brew.id}
                      width={1}
                      height={20}
                      fontSize={6}
                      background="transparent"
                      lineColor="#E8E6E1"
                      margin={0}
                      displayValue={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-art-deco-brass/25 px-4 py-3 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="font-mono text-xs px-4 py-2 border border-stardust/25 text-stardust/50 hover:text-stardust hover:border-stardust/50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={downloadLabel}
                disabled={isGenerating}
                className="font-mono text-xs px-4 py-2 border border-art-deco-brass bg-art-deco-brass text-void-black hover:bg-art-deco-brass/90 transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Download PNG'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useRef, useState, useCallback } from 'react';
import Barcode from 'react-barcode';
import { toPng } from 'html-to-image';
import type { Brew } from '../types/brew';

interface Props {
  brew: Brew;
}

export default function LabelMaker({ brew }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const downloadLabel = useCallback(async () => {
    if (!labelRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(labelRef.current, {
        quality: 1,
        pixelRatio: 3, // 300dpi equivalent
        backgroundColor: '#0D0D0D',
      });

      const link = document.createElement('a');
      link.download = `${brew.id}-label.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate label:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [brew.id]);

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
            <div className="p-6 flex justify-center">
              <div
                ref={labelRef}
                className="bg-void-black border-2 border-art-deco-brass p-6 w-64"
                style={{ fontFamily: '"Space Mono", monospace' }}
              >
                {/* Brewery Name */}
                <div className="text-center mb-4 pb-4 border-b border-art-deco-brass/50">
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
                <div className="text-center mb-4">
                  <h4
                    className="text-stardust text-lg uppercase tracking-widest leading-tight"
                    style={{ fontFamily: '"Josefin Sans", sans-serif' }}
                  >
                    {brew.name}
                  </h4>
                  <p className="text-stardust/50 text-xs mt-1">{brew.style}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                  <div className="border border-art-deco-brass/25 p-2">
                    <p className="text-stardust/50 text-[10px] uppercase">ABV</p>
                    <p className="text-art-deco-brass text-lg">{brew.abv}%</p>
                  </div>
                  <div className="border border-art-deco-brass/25 p-2">
                    <p className="text-stardust/50 text-[10px] uppercase">IBU</p>
                    <p className="text-oxidized-copper text-lg">{brew.ibu}</p>
                  </div>
                </div>

                {/* Hops */}
                {brew.hops && (
                  <div className="text-center mb-4 py-2 border-t border-b border-art-deco-brass/25">
                    <p className="text-stardust/50 text-[10px] uppercase mb-1">Hops</p>
                    <p className="text-stardust text-xs">{brew.hops}</p>
                  </div>
                )}

                {/* Brew Date */}
                <div className="text-center mb-4">
                  <p className="text-stardust/50 text-[10px] uppercase">Brewed</p>
                  <p className="text-stardust text-sm">{formatDate(brew.brew_date)}</p>
                </div>

                {/* Barcode */}
                <div className="flex justify-center pt-2 border-t border-art-deco-brass/50">
                  <Barcode
                    value={brew.id}
                    width={1.5}
                    height={40}
                    fontSize={10}
                    background="#0D0D0D"
                    lineColor="#E8E6E1"
                    margin={0}
                    displayValue={true}
                  />
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

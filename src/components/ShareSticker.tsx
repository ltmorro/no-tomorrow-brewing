import { forwardRef } from 'react';
import type { Brew } from '../types/brew';

interface Props {
  brew: Brew;
}

const ShareSticker = forwardRef<HTMLDivElement, Props>(({ brew }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: 320,
        height: 320,
        backgroundColor: 'rgba(13, 13, 13, 0.75)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Space Mono", monospace',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >

      {/* Beer Info */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Beer Name */}
        <h2
          style={{
            fontFamily: '"Josefin Sans", sans-serif',
            fontSize: 26,
            fontWeight: 600,
            color: '#D4AF37',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            margin: 0,
            lineHeight: 1.2,
            maxWidth: '100%',
          }}
        >
          {brew.name}
        </h2>

        {/* ABV Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 20,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              backgroundColor: '#D4AF37',
              borderRadius: '50%',
            }}
          />
          <span
            style={{
              fontSize: 20,
              color: '#E8E6E1',
              fontWeight: 700,
            }}
          >
            {brew.abv}% ABV
          </span>
        </div>

        {/* Style */}
        <p
          style={{
            fontSize: 13,
            color: 'rgba(232, 230, 225, 0.7)',
            marginTop: 10,
            margin: '10px 0 0 0',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {brew.style}
        </p>
      </div>

      {/* Branding Footer */}
      <div
        style={{
          borderTop: '1px solid rgba(212, 175, 55, 0.3)',
          paddingTop: 16,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: '"Josefin Sans", sans-serif',
            fontSize: 10,
            color: 'rgba(212, 175, 55, 0.9)',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            margin: 0,
          }}
        >
          No Tomorrow Brewing Co.
        </p>
      </div>
    </div>
  );
});

ShareSticker.displayName = 'ShareSticker';

export default ShareSticker;

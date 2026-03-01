'use client';

import { useMemo } from 'react';
const qrgen = require('qr.js');

interface QRProps {
  data: string;
  size?: number;
}

export function QRCode({ data, size = 140 }: QRProps) {
  const cells = useMemo(() => {
    try {
      const qr = qrgen(data, { errorCorrectLevel: 1 });
      return qr.modules;
    } catch {
      return null;
    }
  }, [data]);

  if (!cells) return null;
  const count = cells.length;
  const quiet = 2;
  const total = count + quiet * 2;
  const cs = size / total;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="QR Code">
      <rect width={size} height={size} fill="#ffffff" rx="8" />
      {cells.map((row: boolean[], r: number) =>
        row.map((cell: boolean, c: number) =>
          cell ? <rect key={`${r}-${c}`} x={(c + quiet) * cs} y={(r + quiet) * cs} width={cs + 0.5} height={cs + 0.5} fill="#000000" /> : null
        )
      )}
    </svg>
  );
}

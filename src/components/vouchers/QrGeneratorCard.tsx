'use client';

import { useMemo } from 'react';
import { encodeQr, qrMatrixToSvg } from '@/utils/qrEncoder';

interface QrGeneratorCardProps {
  url: string;
  size?: number;
}

export default function QrGeneratorCard({ url, size = 160 }: QrGeneratorCardProps) {
  const svgContent = useMemo(() => {
    const result = encodeQr(url);
    return qrMatrixToSvg(result, '#166534');
  }, [url]);

  return (
    <div className="inline-flex flex-col items-center rounded-xl border border-emerald-700/20 bg-white p-4 shadow-sm">
      <div
        className="rounded-lg"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      <p className="mt-2 text-xs text-gray-500">Scan to verify booking</p>
    </div>
  );
}

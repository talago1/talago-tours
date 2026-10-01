import QRCode from 'qrcode';

export interface QrResult {
  matrix: number[][];
  size: number;
}

/**
 * Encode `text` into a QR matrix.
 *
 * This used to be a hand-rolled Reed-Solomon + bit-placement implementation.
 * It was unusable:
 *
 *  1. `placeDataBits` drove the column from a while-loop whose exit depended on
 *     a row counter that the direction flip could send negative. The column then
 *     never advanced and the request thread spun forever, so every boarding
 *     pass page hung.
 *  2. `applyMask` XOR-ed the -1 "unwritten" sentinel, producing -2 rather than
 *     a module bit.
 *  3. Its version table stopped at 82 byte-mode characters while a real
 *     boarding-pass token is ~154 characters, so 47% of every token was
 *     silently dropped and the scanner would reject the result.
 *
 * The `qrcode` package handles versioning, EC generation, interleaving and
 * mask selection against the published tables.
 */
export function encodeQr(text: string): QrResult {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const data = qr.modules.data;

  const matrix: number[][] = new Array(size);
  for (let y = 0; y < size; y++) {
    const row = new Array<number>(size);
    for (let x = 0; x < size; x++) {
      row[x] = data[y * size + x] ? 1 : 0;
    }
    matrix[y] = row;
  }

  return { matrix, size };
}

export function qrMatrixToSvg(result: QrResult, fgColor: string = '#000000'): string {
  const moduleSize = 5;
  const padding = 10;
  const totalSize = result.size * moduleSize + padding * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>`;

  for (let y = 0; y < result.size; y++) {
    for (let x = 0; x < result.size; x++) {
      if (result.matrix[y][x] === 1) {
        const rx = padding + x * moduleSize;
        const ry = padding + y * moduleSize;
        svg += `<rect x="${rx}" y="${ry}" width="${moduleSize}" height="${moduleSize}" fill="${fgColor}"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

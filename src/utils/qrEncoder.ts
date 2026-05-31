const GF_EXP = new Array(512);
const GF_LOG = new Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function gfPolyMul(poly: number[], factor: number): number[] {
  return poly.map((c) => gfMul(c, factor));
}

function gfPolyDiv(dividend: number[], divisor: number[]): number[] {
  const remainder = [...dividend];
  for (let i = 0; i < dividend.length - divisor.length + 1; i++) {
    if (remainder[i] !== 0) {
      const scale = gfMul(remainder[i], GF_EXP[GF_LOG[divisor[0]] + 255 - GF_LOG[divisor[0]]]);
      for (let j = 0; j < divisor.length; j++) {
        remainder[i + j] ^= gfMul(divisor[j], scale);
      }
    }
  }
  return remainder.slice(dividend.length - divisor.length + 1);
}

function rsEncode(data: number[], ecCount: number): number[] {
  const generator = [1];
  for (let i = 0; i < ecCount; i++) {
    const term = gfPolyMul(generator, GF_EXP[i]);
    generator.push(0);
    for (let j = generator.length - 1; j > 0; j--) {
      generator[j] = generator[j - 1] ^ term[j - 1];
    }
    generator[0] = term[0];
  }
  const padded = [...data, ...new Array(ecCount).fill(0)];
  const remainder = gfPolyDiv(padded, generator);
  return remainder;
}

const VERSION_DATA: Record<number, { size: number; ecPerBlock: number; blocks: number; dataCodewords: number }> = {
  3: { size: 29, ecPerBlock: 14, blocks: 2, dataCodewords: 42 },
  4: { size: 33, ecPerBlock: 18, blocks: 2, dataCodewords: 62 },
  5: { size: 37, ecPerBlock: 22, blocks: 2, dataCodewords: 84 },
};

function selectVersion(dataLength: number): number {
  if (dataLength <= 42) return 3;
  if (dataLength <= 62) return 4;
  if (dataLength <= 84) return 5;
  return 5;
}

const ALIGNMENT_POSITIONS: Record<number, number[]> = {
  3: [22],
  4: [26],
  5: [30],
};

const FORMAT_MASK = 0x5412;

function formatBits(mask: number): number {
  let poly = 0x5372 ^ (mask << 10);
  for (let i = 0; i < 10; i++) {
    if (poly & (1 << 14)) {
      poly = (poly << 1) ^ 0x1a35;
    } else {
      poly <<= 1;
    }
  }
  return ((poly & 0x7fff) ^ FORMAT_MASK) & 0x7fff;
}

function applyMask(data: number[][], mask: number): void {
  const size = data.length;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y][x] !== -1) continue;
      let condition = false;
      switch (mask) {
        case 0: condition = (x + y) % 2 === 0; break;
        case 1: condition = y % 2 === 0; break;
        case 2: condition = x % 3 === 0; break;
        case 3: condition = (x + y) % 3 === 0; break;
        case 4: condition = (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0; break;
        case 5: condition = (x * y) % 2 + (x * y) % 3 === 0; break;
        case 6: condition = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
        case 7: condition = ((x * y) % 3 + (x + y) % 2) % 2 === 0; break;
      }
      if (condition) data[y][x] ^= 1;
    }
  }
}

function scoreMask(data: number[][]): number {
  const size = data.length;
  let score = 0;

  for (let y = 0; y < size; y++) {
    let run = 1;
    for (let x = 1; x < size; x++) {
      if (data[y][x] === data[y][x - 1]) {
        run++;
      } else {
        if (run >= 5) score += run + 3;
        run = 1;
      }
    }
    if (run >= 5) score += run + 3;
  }

  for (let x = 0; x < size; x++) {
    let run = 1;
    for (let y = 1; y < size; y++) {
      if (data[y][x] === data[y - 1][x]) {
        run++;
      } else {
        if (run >= 5) score += run + 3;
        run = 1;
      }
    }
    if (run >= 5) score += run + 3;
  }

  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const v = data[y][x];
      if (v !== -1 && v === data[y][x + 1] && v === data[y + 1][x] && v === data[y + 1][x + 1]) {
        score += 3;
      }
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size - 6; x++) {
      const pat = data[y].slice(x, x + 7).map((v) => (v === -1 ? 0 : v));
      const p1 = [1, 0, 1, 1, 1, 0, 1];
      const p2 = [1, 0, 1, 1, 1, 0, 1].reverse();
      if (pat.every((v, i) => v === p1[i]) || pat.every((v, i) => v === p2[i])) {
        score += 40;
      }
    }
  }

  const dark = data.flat().filter((v) => v === 1).length;
  const total = data.flat().filter((v) => v !== -1).length;
  const pct = (dark / total) * 100;
  const prev = Math.abs(Math.floor(pct / 5) * 5 - 50);
  score += prev * 10;

  return score;
}

function placeFinder(data: number[][], y: number, x: number): void {
  const size = data.length;
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const py = y + dy;
      const px = x + dx;
      if (py < 0 || px < 0 || py >= size || px >= size) continue;
      const inPattern = dy >= 0 && dy <= 6 && dx >= 0 && dx <= 6;
      if (inPattern) {
        const isBorder = dy === 0 || dy === 6 || dx === 0 || dx === 6;
        const isInner = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
        data[py][px] = isBorder || isInner ? 1 : 0;
      } else {
        data[py][px] = 0;
      }
    }
  }
}

function placeTiming(data: number[][]): void {
  const size = data.length;
  for (let i = 8; i < size - 8; i++) {
    data[6][i] = i % 2 === 0 ? 1 : 0;
    data[i][6] = i % 2 === 0 ? 1 : 0;
  }
}

function placeAlignment(data: number[][], version: number): void {
  const positions = ALIGNMENT_POSITIONS[version];
  if (!positions) return;
  for (const cx of positions) {
    for (const cy of positions) {
      if (cx < 9 && cy < 9) continue;
      if (cx < 9 && cy > data.length - 9) continue;
      if (cx > data.length - 9 && cy < 9) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const py = cy + dy;
          const px = cx + dx;
          if (py < 0 || px < 0 || py >= data.length || px >= data.length) continue;
          const isBorder = dy === -2 || dy === 2 || dx === -2 || dx === 2;
          const isCenter = dy === 0 && dx === 0;
          data[py][px] = isBorder || isCenter ? 1 : 0;
        }
      }
    }
  }
}

function placeDataBits(data: number[][], codewords: number[]): void {
  const size = data.length;
  let bitIdx = 0;
  let col = size - 1;

  while (col > 0) {
    if (col === 6) col = 5;
    for (let row = size - 1; row >= 0; ) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        if (x < 0) continue;
        if (data[row][x] === -1 && bitIdx < codewords.length * 8) {
          const byteIdx = Math.floor(bitIdx / 8);
          const bitPos = 7 - (bitIdx % 8);
          data[row][x] = (codewords[byteIdx] >> bitPos) & 1;
          bitIdx++;
        }
      }
      if (row === 0) {
        col -= 2;
        break;
      }
      const nextRow = row > 0 ? -1 : 1;
      row = row === 0 ? 0 : row + (row > 0 ? -1 : 1);
      if (row <= col) row = 0 - row;
    }
  }
}

function placeFormat(data: number[][], mask: number): void {
  const size = data.length;
  const bits = formatBits(mask);

  for (let i = 0; i < 15; i++) {
    const bit = (bits >> (14 - i)) & 1;
    if (i < 6) {
      data[8][i] = bit;
      data[size - 1 - i][8] = bit;
    } else if (i < 7) {
      data[8][7] = bit;
      data[8][size - 8 + 1] = bit;
    } else if (i < 8) {
      data[8][8 + 14 - i] = bit;
      data[8 - 14 + i][8] = bit;
    } else {
      data[8][size - 15 + i] = bit;
      data[size - 15 + i][8] = bit;
    }
  }
  data[8][size - 8] = 1;
  data[size - 8][8] = 1;
}

function placeDarkModule(data: number[][]): void {
  data[data.length - 8][8] = 1;
}

export interface QrResult {
  matrix: number[][];
  size: number;
}

export function encodeQr(text: string): QrResult {
  const dataBytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    dataBytes.push(text.charCodeAt(i) & 0xff);
  }

  const version = selectVersion(dataBytes.length);
  const vd = VERSION_DATA[version];
  const size = vd.size;

  const totalDataBits = vd.dataCodewords * 8;
  const modeIndicator = [0, 1, 0, 0];
  const charCountBits = version < 10 ? 8 : 16;
  const charCount = text.length;

  const encoded: number[] = [];
  let bitBuf = 0;
  let bitLen = 0;

  function pushBits(bits: number[], n: number) {
    for (let i = 0; i < n; i++) {
      bitBuf = (bitBuf << 1) | (bits[i] || 0);
      bitLen++;
      if (bitLen === 8) {
        encoded.push(bitBuf);
        bitBuf = 0;
        bitLen = 0;
      }
    }
  }

  pushBits(modeIndicator, 4);

  const countBits: number[] = [];
  for (let i = charCountBits - 1; i >= 0; i--) {
    countBits.push((charCount >> i) & 1);
  }
  pushBits(countBits, charCountBits);

  for (const b of dataBytes) {
    const byteBits: number[] = [];
    for (let i = 7; i >= 0; i--) byteBits.push((b >> i) & 1);
    pushBits(byteBits, 8);
  }

  const remainingBits = totalDataBits - encoded.length * 8 - bitLen;
  if (bitLen > 0) {
    bitBuf <<= 8 - bitLen;
    encoded.push(bitBuf);
    bitBuf = 0;
    bitLen = 0;
  }

  const terminatorCount = Math.min(remainingBits, 4);
  for (let i = 0; i < terminatorCount; i++) {
    bitBuf = (bitBuf << 1) | 0;
    bitLen++;
    if (bitLen === 8) { encoded.push(bitBuf); bitBuf = 0; bitLen = 0; }
  }

  while (encoded.length < vd.dataCodewords) {
    const pad = encoded.length % 2 === 0 ? 0xec : 0x11;
    encoded.push(pad);
  }

  const ecCodewords = rsEncode(encoded, vd.ecPerBlock * vd.blocks);

  const interleaved: number[] = [];
  for (let i = 0; i < vd.dataCodewords / vd.blocks; i++) {
    for (let b = 0; b < vd.blocks; b++) {
      interleaved.push(encoded[b * (vd.dataCodewords / vd.blocks) + i]);
    }
  }
  for (let i = 0; i < vd.ecPerBlock; i++) {
    for (let b = 0; b < vd.blocks; b++) {
      interleaved.push(ecCodewords[b * vd.ecPerBlock + i]);
    }
  }

  const matrix: number[][] = [];
  for (let y = 0; y < size; y++) {
    matrix[y] = new Array(size).fill(-1);
  }

  placeFinder(matrix, 0, 0);
  placeFinder(matrix, 0, size - 7);
  placeFinder(matrix, size - 7, 0);
  placeAlignment(matrix, version);
  placeTiming(matrix);
  placeDarkModule(matrix);
  placeDataBits(matrix, interleaved);

  let bestScore = Infinity;
  let bestMask = 0;
  const maskedMatrices: number[][][] = [];

  for (let m = 0; m < 8; m++) {
    const copy = matrix.map((row) => [...row]);
    placeFormat(copy, m);
    applyMask(copy, m);
    maskedMatrices[m] = copy;
    const s = scoreMask(copy);
    if (s < bestScore) {
      bestScore = s;
      bestMask = m;
    }
  }

  const finalMatrix = maskedMatrices[bestMask];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (finalMatrix[y][x] === -1) finalMatrix[y][x] = 0;
    }
  }

  return { matrix: finalMatrix, size };
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

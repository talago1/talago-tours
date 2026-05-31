interface BarcodeDetectorOptions {
  formats: string[];
}

interface DetectedBarcode {
  rawValue: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
  format: string;
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
  static getSupportedFormats(): Promise<string[]>;
}

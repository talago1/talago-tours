export interface MediaAsset {
  id: string;
  filename: string;
  filePath: string;
  displayOrder: number;
  mimeType: string;
  tourId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReorderPayload {
  tourId: string;
  orderedAssetIds: string[];
}

export interface ReorderResponse {
  success: true;
  message: string;
  assets: { id: string; displayOrder: number }[];
}

export interface DeleteResponse {
  success: true;
  message: string;
  tourId: string;
  remainingCount: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

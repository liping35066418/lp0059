export type EncodeType = 'url' | 'base64' | 'unicode' | 'html' | 'hex';

export type OperationMode = 'encode' | 'decode' | 'encrypt' | 'decrypt';

export interface HistoryItem {
  id: string;
  type: string;
  subType: string;
  input: string;
  output: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  result?: T;
  data?: T;
  error?: string;
}

export type Matrix = number[][];

export type LayerShape = 'rectangle' | 'circle' | 'triangle';

export interface MatrixLayer {
  name: string;
  rows: number;
  cols: number;
  values: Matrix;
  shape: LayerShape;
  color?: string;
}

export interface Graph3DData {
  layers: MatrixLayer[];
}

export interface GASResponse {
  status: 'success' | 'error';
  data?: Graph3DData;
  message?: string;
}

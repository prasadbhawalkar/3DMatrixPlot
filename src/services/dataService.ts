import { GASResponse } from '../types';

export const fetchDataFromGAS = async (spreadsheetId: string): Promise<GASResponse> => {
  const gasUrl = import.meta.env.VITE_GAS_URL;
  
  if (!gasUrl) {
    return {
      status: 'error',
      message: 'VITE_GAS_URL is not configured in environment variables.'
    };
  }

  try {
    const response = await fetch(`${gasUrl}?spreadsheetId=${spreadsheetId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as GASResponse;
  } catch (error) {
    console.error('Error fetching data from GAS:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

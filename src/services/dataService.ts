import { GASResponse } from '../types';

export const fetchDataFromGAS = async (spreadsheetId: string): Promise<GASResponse> => {
  const gasUrl = import.meta.env.VITE_GAS_URL;
  
  if (!gasUrl) {
    return {
      status: 'error',
      message: 'VITE_GAS_URL is not configured. Please deploy your Google Apps Script as a Web App and add the URL to your environment variables.'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`${gasUrl}?spreadsheetId=${spreadsheetId}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      return data;
    }

    if (!data.data || !data.data.layers || data.data.layers.length === 0) {
      return {
        status: 'error',
        message: 'No valid matrix layers found in the spreadsheet. Please check your sheet names and schema.'
      };
    }

    return data as GASResponse;
  } catch (error) {
    console.error('Error fetching data from GAS:', error);
    let message = 'Unknown error occurred';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        message = 'Request timed out. The Google Apps Script is taking too long to respond. Please check if the script is deployed correctly and the spreadsheet is accessible.';
      } else {
        message = error.message;
      }
    }
    
    return {
      status: 'error',
      message
    };
  }
};

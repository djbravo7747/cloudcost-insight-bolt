// Set VITE_API_BASE_URL to a FastAPI server to replace the simulated data with live endpoints.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const IS_LIVE_API = API_BASE_URL.length > 0;

export const DATA_SOURCE_LABEL = IS_LIVE_API ? `Live API: ${API_BASE_URL}` : 'Simulated sample data';

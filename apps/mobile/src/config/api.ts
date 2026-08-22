const PRODUCTION_URL = 'https://financi-backend.onrender.com';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? PRODUCTION_URL).replace(/\/+$/, '');

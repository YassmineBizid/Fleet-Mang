import Constants from 'expo-constants';

/**
 * Pour tester avec un téléphone physique (Expo Go), 
 * remplacez '127.0.0.1' par votre adresse IP locale (ex: 192.168.1.XXX)
 */
const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(':')[0] || '192.168.242.1';
  
  return `http://${localhost}:8000`;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENDPOINTS: {
    LOGIN: '/api/health', // Utilisons health pour le moment car l'auth est mockée
    OCR: '/api/ocr/invoice',
    OPTIMIZE: '/api/optimize-route',
  }
};

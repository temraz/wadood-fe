import AsyncStorage from '@react-native-async-storage/async-storage';

// For development with real device testing, use your computer's local IP address
// Example: export const API_BASE_URL = 'http://192.168.1.5:8080';
// To find your IP address:
// - On macOS/Linux: run 'ifconfig' in terminal
// - On Windows: run 'ipconfig' in command prompt
// Make sure your device is on the same network as your computer

export const API_BASE_URL = 'http://192.168.8.53:8080';
// export const API_BASE_URL = 'http://172.20.10.2:8080';


export const ENDPOINTS = {
  REQUEST_OTP: '/api/auth/request-otp',
  VERIFY_OTP: '/api/auth/verify-otp',
  REFRESH_TOKEN: '/api/auth/refresh',
};

export const getHeaders = (language) => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Accept-Language': language === 'ar' ? 'ar' : 'en',
});

// Function to check if a JWT token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));

    const { exp } = JSON.parse(jsonPayload);
    const currentTime = Math.floor(Date.now() / 1000);
    
    return currentTime >= exp;
  } catch (error) {
    console.error('Token parsing error:', error);
    return true;
  }
};

// Function to refresh the auth token
export const refreshAuthToken = async (refreshToken, language) => {
  try {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: {
        ...getHeaders(language),
        'Refresh-Token': refreshToken
      }
    });

    const data = await response.json();
    
    if (data.success) {
      // Store the new tokens
      await AsyncStorage.setItem('token', data.data.token);
      await AsyncStorage.setItem('refresh_token', data.data.refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
      
      return {
        success: true,
        token: data.data.token
      };
    } else {
      throw new Error(data.message || 'Failed to refresh token');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to ensure a valid token before making API requests
export const ensureValidToken = async (language) => {
  try {
    const currentToken = await AsyncStorage.getItem('token');
    
    if (!currentToken || isTokenExpired(currentToken)) {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const { success, token, error } = await refreshAuthToken(refreshToken, language);
      
      if (!success) {
        throw new Error(error || 'Failed to refresh token');
      }
      
      return token;
    }
    
    return currentToken;
  } catch (error) {
    console.error('Token validation error:', error);
    throw error;
  }
}; 
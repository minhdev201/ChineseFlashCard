// Configuration for Chrome Extension
// Copy this file to config.js and update with your settings

const CONFIG = {
  // Your API endpoint URL
  // For development: 'http://localhost:5173/api/random-vocab'
  // For production: 'https://your-domain.com/api/random-vocab'
  API_URL: 'http://localhost:5173/api/random-vocab',
  
  // Optional: Your Supabase credentials (if using direct Supabase access)
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  
  // Cache duration in milliseconds (default: 5 minutes)
  CACHE_DURATION: 5 * 60 * 1000,
};

# API Server for Chrome Extension

This document explains how to set up and run the API server that provides vocabulary data to the Chrome Extension.

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install Express and other necessary packages.

### 2. Configure Supabase

Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the API Server

**Option A: Use the custom server with API endpoint**
```bash
npm run dev:api
```

**Option B: Use regular Vite dev server**
```bash
npm run dev
```

Note: Option A is recommended as it provides a proper API endpoint with CORS support.

## API Endpoint

### GET `/api/random-vocab`

Returns a random vocabulary word from the "unremembered" bucket.

**Response format:**
```json
{
  "success": true,
  "data": {
    "hanzi": "你好",
    "pinyin": "nǐ hǎo",
    "meaning": "Xin chào"
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## CORS Configuration

The server is configured to allow requests from any origin (`Access-Control-Allow-Origin: *`), which is necessary for the Chrome Extension to access the API.

In production, you should restrict this to specific origins for security.

## Testing the API

You can test the API endpoint directly in your browser or using curl:

```bash
curl http://localhost:5173/api/random-vocab
```

Or open in browser:
```
http://localhost:5173/api/random-vocab
```

## Deployment

For production deployment:

1. Update the API_URL in the Chrome Extension's `newtab.js`:
   ```javascript
   const CONFIG = {
     API_URL: 'https://your-production-domain.com/api/random-vocab',
     // ...
   };
   ```

2. Deploy your Vite app with the API server to platforms like:
   - Vercel
   - Netlify
   - Railway
   - Render
   - Your own VPS

3. Make sure CORS is properly configured for your production domain.

## Troubleshooting

### CORS Errors
- Ensure the server is running with `npm run dev:api`
- Check that CORS headers are being sent in the response
- Verify the API_URL in the extension matches your server URL

### No vocabulary returned
- Check that you have vocabulary in your Supabase database
- Verify Supabase credentials are correct
- Check the console for error messages

### API not responding
- Ensure the server is running on port 5173
- Check if another process is using the port
- Look at server console logs for errors

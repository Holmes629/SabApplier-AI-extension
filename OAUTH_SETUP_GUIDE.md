# Setting up Google OAuth2 for Chrome Extension

## The Problem
The current OAuth2 client ID is configured for 'WEB' client type, but Chrome extensions require a 'CHROME_EXTENSION' client type. This is why you're getting the "Custom scheme URIs are not allowed for 'WEB' client type" error.

## Solution: Create a Chrome Extension OAuth2 Client

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one if needed)
3. Go to "APIs & Services" → "Credentials"

### Step 2: Create OAuth2 Client for Chrome Extension
1. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
2. **Application type**: Select "Chrome extension"
3. **Name**: Enter "SabApplier Chrome Extension"
4. **Item ID**: Enter your extension ID (you'll get this after loading the extension)

### Step 3: Get Your Extension ID
1. Build your extension: `npm run build`
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `build` folder
5. Copy the Extension ID (it looks like: `abcdefghijklmnopqrstuvwxyz`)

### Step 4: Update OAuth2 Client with Extension ID
1. Go back to Google Cloud Console → Credentials
2. Edit your Chrome extension OAuth2 client
3. Add your Extension ID to the "Item ID" field
4. Save the changes

### Step 5: Update manifest.json
1. Copy the new Client ID from Google Cloud Console
2. Replace `YOUR_CHROME_EXTENSION_CLIENT_ID` in manifest.json with your actual client ID

### Step 6: Rebuild and Test
1. Run `npm run build`
2. Reload the extension in Chrome
3. Test the Google login functionality

## Important Notes

### Extension ID Generation
- Extension IDs are generated based on the extension's key
- For development, the ID changes each time you load the extension
- For production, you need to package the extension with a consistent key

### For Production (Stable Extension ID)
1. Generate a key pair:
   ```bash
   openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem
   ```
2. Add the key to manifest.json:
   ```json
   {
     "key": "YOUR_PUBLIC_KEY_HERE",
     // ... rest of manifest
   }
   ```
3. Use this key consistently to maintain the same extension ID

### Alternative: Use Web Application Type with Redirect
If you prefer to keep using the web application type:

1. **Option A**: Modify the authentication flow to use popup-based OAuth
2. **Option B**: Set up a redirect URI that handles the Chrome extension

## Quick Fix for Testing

For immediate testing, you can use a simplified approach:

1. **Temporarily remove the oauth2 section** from manifest.json
2. **Use the identity API with interactive: true** (it will use Chrome's built-in OAuth)
3. **Handle the token manually** in your GoogleLogin.js

Would you like me to implement this temporary fix while you set up the proper OAuth2 client?

## Files to Update After Getting New Client ID

1. `public/manifest.json` - Update the client_id
2. Rebuild: `npm run build`
3. Reload extension in Chrome
4. Test Google login

Let me know your extension ID once you have it, and I can help you complete the setup!

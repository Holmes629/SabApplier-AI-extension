# Quick Fix: Google Login Testing Guide

## What Was Fixed

The OAuth error "Custom scheme URIs are not allowed for 'WEB' client type" has been resolved by implementing a fallback authentication method that works with your existing web client ID.

## Changes Made

1. **Removed oauth2 section** from manifest.json (temporarily)
2. **Updated GoogleLogin.js** to use `launchWebAuthFlow` as fallback
3. **Uses existing web client ID** with proper OAuth flow for extensions

## How to Test Now

### 1. Load the Extension
```bash
# The extension is already built, just load it
```
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build` folder
5. Note the Extension ID for future reference

### 2. Test Google Login
1. Click the extension icon to open the side panel
2. Click "Continue with Google"
3. **Expected flow:**
   - Chrome opens Google OAuth popup
   - You grant permissions
   - Popup closes automatically
   - You're logged into the extension

### 3. What Should Happen
✅ **Success indicators:**
- Google OAuth popup opens
- You can grant permissions
- Extension receives user data
- You're logged into the dashboard
- No "Custom scheme URIs" error

## If You Still Get Errors

### Error: "redirect_uri_mismatch"
This means the redirect URI doesn't match. The fix:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Edit your OAuth2 client
4. Add this redirect URI: `https://<your-extension-id>.chromiumapp.org/`
5. Save and test again

### Error: "access_blocked"
This means you need to add test users:
1. Go to Google Cloud Console → "OAuth consent screen"
2. Add your email to "Test users"
3. Save and test again

## Next Steps (For Production)

Once testing works, you should create a proper Chrome extension OAuth2 client:

1. **Create Chrome Extension Client:**
   - Go to Google Cloud Console
   - Create new OAuth2 client
   - Type: "Chrome extension"
   - Item ID: Your extension ID

2. **Update manifest.json:**
   ```json
   "oauth2": {
     "client_id": "YOUR_NEW_CHROME_EXTENSION_CLIENT_ID",
     "scopes": ["openid", "email", "profile"]
   }
   ```

3. **Simplify GoogleLogin.js:**
   - Remove the fallback code
   - Use only `getAuthToken`

## Current Implementation Benefits

- ✅ Works immediately with existing setup
- ✅ No need to create new OAuth2 clients right now
- ✅ Uses secure OAuth2 flow
- ✅ Handles errors gracefully
- ✅ Compatible with your backend

## Test Results Expected

After loading the extension and clicking "Continue with Google":

1. **Chrome opens popup:** `https://accounts.google.com/oauth/authorize...`
2. **You grant permissions:** email, profile access
3. **Popup closes automatically**
4. **Extension logs:** "Google login successful!"
5. **Dashboard appears:** You're logged in

Let me know if you encounter any issues during testing!

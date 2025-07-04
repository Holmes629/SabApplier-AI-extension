# URGENT FIX: Configure OAuth2 Client for Chrome Extension

## The Problem
Your Google OAuth2 client ID `1014179036736-d8et6ht2jf4kf9flcol0uv0ktv33v5fh.apps.googleusercontent.com` is configured as a "Web application" but doesn't have the Chrome extension redirect URI configured.

## Immediate Solution

### Step 1: Get Your Extension's Redirect URI
1. Open Chrome DevTools Console in your extension
2. Look for this log message: `Extension redirect URL: https://[extension-id].chromiumapp.org/`
3. Copy this URL (it should look like: `https://abcdefghijklmnopqrstuvwxyz.chromiumapp.org/`)

### Step 2: Update Your OAuth2 Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Click on your OAuth2 client: `1014179036736-d8et6ht2jf4kf9flcol0uv0ktv33v5fh.apps.googleusercontent.com`
4. In "Authorized redirect URIs", click "ADD URI"
5. Add: `https://[your-extension-id].chromiumapp.org/` (replace with actual extension ID)
6. Click "SAVE"

### Step 3: Test Again
1. Rebuild the extension: `npm run build`
2. Reload the extension in Chrome
3. Try Google login again

## Alternative: Quick Test with Different Client

If you want to test immediately, you can:

1. **Create a new OAuth2 client** specifically for testing:
   - Type: "Web application"
   - Name: "SabApplier Extension Test"
   - Authorized redirect URIs: `https://[extension-id].chromiumapp.org/`

2. **Use the new client ID** in GoogleLogin.js temporarily

## Finding Your Extension ID

### Method 1: Chrome Extensions Page
1. Go to `chrome://extensions/`
2. Find "Sabapplier AI"
3. Copy the ID below the extension name

### Method 2: Console Log
The updated GoogleLogin.js will log the redirect URL, which contains your extension ID.

## Expected Flow After Fix

1. Click "Continue with Google"
2. **Console shows:** `Extension redirect URL: https://[id].chromiumapp.org/`
3. **Console shows:** `Auth URL: https://accounts.google.com/oauth/authorize?...`
4. Google OAuth popup opens
5. You grant permissions
6. **Console shows:** `OAuth response URL: https://[id].chromiumapp.org/#access_token=...`
7. **Console shows:** `Successfully obtained access token`
8. Login completes successfully

## Current Error Explanation

The error "Authorization page could not be loaded" happens because:
1. Your OAuth2 client doesn't recognize the Chrome extension redirect URI
2. Google rejects the authorization request
3. The popup fails to load

## Quick Debug Steps

1. **Check the extension ID:** Look in Chrome DevTools console for "Extension redirect URL"
2. **Verify OAuth2 client:** Make sure the redirect URI is added to your Google Cloud Console
3. **Test the flow:** The updated code provides better error logging

Let me know your extension ID once you find it, and I can help you complete the setup!

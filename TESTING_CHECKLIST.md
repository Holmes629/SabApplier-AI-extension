# Google Login Testing Checklist

## Ignore These Errors ✅
The `NET::ERR_BLOCKED_BY_CLIENT` errors you're seeing are **NOT related to your Google login**. These are:
- Google Play Store logging requests blocked by ad blockers
- Common in Chrome extensions/web apps
- Safe to ignore - they don't affect OAuth functionality

## Test the Google Login Flow

### Step 1: Load the Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `build` folder
5. **Copy your Extension ID** (important for next step)

### Step 2: Configure Google OAuth (CRITICAL)
🚨 **This step is required for Google login to work:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth2 client: `1014179036736-d8et6ht2jf4kf9flcol0uv0ktv33v5fh`
4. Click **Edit** (pencil icon)
5. In **"Authorized redirect URIs"** section:
   - Click **"ADD URI"**
   - Add: `https://[YOUR-EXTENSION-ID].chromiumapp.org/`
   - Replace `[YOUR-EXTENSION-ID]` with the actual ID from Step 1
   - Example: `https://abcdefghijklmnopqrstuvwxyz.chromiumapp.org/`
6. Click **"SAVE"**

### Step 3: Test Google Login
1. Click the extension icon in Chrome toolbar
2. Side panel opens with login form
3. Click **"Continue with Google"** button
4. **Expected behavior:**
   - Google OAuth popup opens
   - You can sign in and grant permissions
   - Popup closes automatically
   - You're logged into the extension dashboard

### Step 4: Check Console Logs
Open Chrome DevTools (F12) and look for these success messages:
```
✅ Extension redirect URL: https://[your-id].chromiumapp.org/
✅ Successfully obtained token via getAuthToken
✅ Google user info: {email: "...", name: "..."}
✅ Backend response status: 200
✅ Google login successful!
```

## Troubleshooting Common Issues

### Issue: "Authorization page could not be loaded"
**Cause:** Redirect URI not added to Google Cloud Console
**Fix:** Complete Step 2 above

### Issue: "redirect_uri_mismatch"
**Cause:** Extension ID in Google Console doesn't match actual extension ID
**Fix:** 
1. Double-check your extension ID from `chrome://extensions/`
2. Update the redirect URI in Google Console with correct ID

### Issue: "access_blocked: This app is blocked"
**Cause:** Your email isn't added as a test user
**Fix:**
1. Go to Google Cloud Console → **OAuth consent screen**
2. Scroll to **"Test users"**
3. Add your email address
4. Save changes

### Issue: Extension ID keeps changing
**Cause:** Loading unpacked extensions generates new IDs each time
**Solution for development:**
1. Always use the same folder (`build`)
2. Don't delete and re-add the extension
3. Just click "Reload" button instead

## What Should Work Now

After completing Step 2 (adding redirect URI):

✅ **Google login button appears** with proper styling
✅ **OAuth popup opens** when clicked
✅ **User can authenticate** and grant permissions
✅ **Token is received** and sent to backend
✅ **User data is saved** to Chrome storage
✅ **Dashboard loads** with user logged in
✅ **Persistent login** - user stays logged in between sessions

## Backend Requirements

Make sure your Django backend is running:
```bash
# In your backend directory
python manage.py runserver 127.0.0.1:8000
```

The `/api/users/google-signup` endpoint should be accessible.

## Final Verification

After setup, the complete flow should be:
1. Click "Continue with Google" → 2. OAuth popup → 3. Grant permissions → 4. Popup closes → 5. Dashboard appears → 6. User logged in ✅

Let me know your Extension ID and I can help verify the redirect URI format!

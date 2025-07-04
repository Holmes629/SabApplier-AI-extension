# Google Login Testing Guide for SabApplier Chrome Extension

## Setup Required

1. **Build the Extension**
   ```bash
   npm run build
   ```

2. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked" and select the `build` folder

3. **Backend Requirements**
   - Ensure the Django backend is running on `http://127.0.0.1:8000`
   - Verify the `/api/users/google-signup` endpoint is accessible

## Testing the Google Login Flow

### 1. **Access the Extension**
   - Click the extension icon in Chrome toolbar
   - The side panel should open with the login form

### 2. **Test Google Login Button**
   - Look for the "Continue with Google" button below the regular login form
   - The button should have the Google icon and proper styling

### 3. **Google Authentication Flow**
   - Click "Continue with Google"
   - Chrome should open Google's OAuth consent screen
   - Grant permissions for email and profile access
   - The extension should receive the authentication token

### 4. **Backend Integration**
   - The extension sends the Google token to `/api/users/google-signup`
   - User data should be saved to Chrome storage
   - User should be redirected to the dashboard

### 5. **Success Indicators**
   - Loading states display properly during authentication
   - Success message appears: "Google login successful!"
   - User is automatically logged in and sees the dashboard
   - User data is persisted in Chrome storage

## Common Issues and Solutions

### 1. **"Chrome identity API not available"**
   - Ensure the extension is properly loaded in Chrome
   - Check that `manifest.json` includes `"identity"` permission

### 2. **"Failed to get Google authentication token"**
   - Verify the OAuth client ID in `manifest.json` is correct
   - Check that the client ID is registered for Chrome extension use

### 3. **Backend Connection Errors**
   - Ensure Django backend is running on `http://127.0.0.1:8000`
   - Verify CORS settings allow Chrome extension requests
   - Check network tab for any blocked requests

### 4. **Token Caching Issues**
   - If login fails repeatedly, the extension clears cached tokens automatically
   - Manual reset: Go to `chrome://settings/content/cookies` and clear Google cookies

## Testing Checklist

- [ ] Extension builds without errors
- [ ] Extension loads properly in Chrome
- [ ] Google login button appears and is styled correctly
- [ ] Clicking button opens Google OAuth flow
- [ ] OAuth consent screen appears
- [ ] Authentication completes successfully
- [ ] User data is sent to backend correctly
- [ ] User is logged in and dashboard appears
- [ ] User data persists in storage
- [ ] Can log out and log back in with Google
- [ ] Error handling works for network issues
- [ ] Loading states provide good UX

## Developer Console Debugging

Watch the browser console for these log messages:
- "Google user info: {user data}"
- "Backend response status: 200"
- "Google login response: {response data}"
- "User data saved successfully"

## File Structure for Google Login

```
SabApplier-AI-extension/
├── public/
│   ├── manifest.json (OAuth config)
│   └── background.js (extension lifecycle)
├── src/
│   ├── components/
│   │   ├── Login.jsx (UI with Google button)
│   │   └── Login.css (styling)
│   ├── services/API/
│   │   └── GoogleLogin.js (Google OAuth logic)
│   └── App.js (login handling)
```

## Security Notes

- The OAuth client ID is configured for Chrome extension use only
- Tokens are not stored permanently, only used for authentication
- All communication with backend uses HTTPS in production
- User permissions are clearly requested during OAuth flow

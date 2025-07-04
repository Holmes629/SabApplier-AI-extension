# Local Testing Guide for SabApplier AI Extension

## ✅ ISSUE RESOLVED - Ready for Testing!

### 🔧 **Issue Fixed:**
The "Access forbidden" error was caused by incorrect test user credentials. The backend API is now working correctly.

### 🎯 **Test Credentials:**
Use these working credentials to test the extension:

**User 1 (Primary):**
- Email: `test@example.com`
- Password: `password123`

**User 2 (For Data Sharing):**
- Email: `friend@example.com` 
- Password: `password123`

### 🚀 **Ready to Test:**

The extension has been successfully configured for local testing with the following setup:

### Running Services:
- **Backend API**: http://localhost:8000 (Django)
- **Frontend Web App**: http://localhost:3000 (React)
- **Extension**: Built and ready to load

### Configuration Changes Made:

1. **Manifest.json** - Updated host permissions for localhost
2. **DataSourceManager.js** - API calls to localhost:8000
3. **EmailLogin.js** - API calls to localhost:8000
4. **Dashboard.jsx** - Links to localhost:3000 for profile/edit
5. **DataSourceSelector.jsx** - "Manage Sharing" links to localhost:3000

## How to Test:

### 1. Load Extension in Chrome:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Navigate to and select: `/Users/riteshkumar/Desktop/s&w/Internship/production/SabApplier-AI-extension/build`

### 2. Test Data Sharing Feature:
1. Go to http://localhost:3000 in your browser
2. Create/login to two different user accounts
3. Go to Data Sharing page and share documents between users
4. Accept sharing requests with different data source options

### 3. Test Extension:
1. Click the extension icon in Chrome toolbar
2. Login with one of your test accounts
3. You should see the **Data Source Selector** dropdown in the dashboard
4. The dropdown should show:
   - "My Own Data" (default)
   - Any accepted shared data sources
5. Switch between data sources and test form filling

### 4. Test Form Filling:
1. Go to any form page (e.g., a job application form)
2. Open the extension and select different data sources
3. Click "Fill Forms" and verify it uses the correct data source
4. Status messages should indicate which data source is being used

## Key Features to Test:

### ✅ Data Source Selection:
- Dropdown shows all available data sources
- Visual indication of currently selected source
- Switching between own data and shared data
- Error handling for invalid data sources

### ✅ Form Filling Integration:
- Uses selected data source for form filling
- Status messages show which data source is active
- Success message indicates data source used
- Fallback to own data if shared data unavailable

### ✅ UI/UX:
- Responsive dropdown design
- Loading states during data source changes
- Error messages for failed operations
- "Manage Sharing" link opens localhost:3000

## Troubleshooting:

### If extension doesn't load:
- Check that build folder exists: `ls -la build/`
- Rebuild if needed: `npm run build`
- Check console for errors in Chrome Extensions page

### If API calls fail:
- Verify backend is running: http://localhost:8000/api/users/shares/
- Check CORS settings in Django settings
- Verify chrome storage permissions

### If data sharing doesn't work:
- Check that both users exist in backend
- Verify sharing relationships in Django admin
- Check browser console for API errors

## Development Notes:

The extension now fully supports:
- ✅ Real-time data source switching
- ✅ Integration with existing form filling logic  
- ✅ Storage of active data source in chrome.storage.local
- ✅ Proper error handling and user feedback
- ✅ Seamless integration with main web application

Ready for testing! 🚀

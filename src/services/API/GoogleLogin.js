/* global chrome */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const GoogleLogin = async (onStatusUpdate) => {
  try {
    onStatusUpdate("Initiating Google Sign-In...", "success");
    
    // Check if Chrome identity API is available
    if (!chrome?.identity) {
      throw new Error("Chrome identity API not available");
    }
    
    let token;
    
    try {
      // Try getAuthToken first (works with oauth2 in manifest)
      onStatusUpdate("Authenticating with Google...", "success");
      
      token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ 
          interactive: true
        }, (token) => {
          if (chrome.runtime.lastError) {
            console.error("getAuthToken error:", chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!token) {
            reject(new Error("No token received from Google"));
          } else {
            console.log("Successfully obtained token via getAuthToken");
            resolve(token);
          }
        });
      });
      
    } catch (error) {
      console.log("getAuthToken failed, trying launchWebAuthFlow:", error.message);
      
      // Fallback: Use launchWebAuthFlow
      const redirectURL = chrome.identity.getRedirectURL();
      console.log("Extension redirect URL:", redirectURL);
      
      const clientId = "1014179036736-d8et6ht2jf4kf9flcol0uv0ktv33v5fh.apps.googleusercontent.com";
      
      const authURL = new URL('https://accounts.google.com/oauth/authorize');
      authURL.searchParams.set('client_id', clientId);
      authURL.searchParams.set('response_type', 'token');
      authURL.searchParams.set('redirect_uri', redirectURL);
      authURL.searchParams.set('scope', 'openid email profile');
      
      console.log("Auth URL:", authURL.toString());
      
      onStatusUpdate("Opening Google authentication...", "success");
      
      const responseURL = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
          url: authURL.toString(),
          interactive: true
        }, (responseURL) => {
          if (chrome.runtime.lastError) {
            console.error("LaunchWebAuthFlow error:", chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!responseURL) {
            reject(new Error("No response from Google OAuth"));
          } else {
            console.log("OAuth response URL:", responseURL);
            resolve(responseURL);
          }
        });
      });
      
      // Extract access token from the response URL
      const urlFragment = responseURL.split('#')[1];
      if (!urlFragment) {
        throw new Error("No URL fragment found in OAuth response");
      }
      
      const urlParams = new URLSearchParams(urlFragment);
      token = urlParams.get('access_token');
      
      if (!token) {
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        throw new Error(`OAuth error: ${error} - ${errorDescription || 'Unknown error'}`);
      }
      
      console.log("Successfully obtained access token via launchWebAuthFlow");
    }

    onStatusUpdate("Verifying Google credentials...", "success");

    // Get user info from Google API
    const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`);
    
    if (!userInfoResponse.ok) {
      throw new Error(`Failed to get user info: ${userInfoResponse.status}`);
    }
    
    const userInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      throw new Error("Failed to get user information from Google");
    }

    console.log("Google user info:", userInfo);

    // Create the credential for backend verification
    const credential = {
      access_token: token,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      id: userInfo.id
    };

    onStatusUpdate("Authenticating with SabApplier...", "success");

    // Send to our backend
    const response = await fetch(`${API_BASE_URL}/users/google-signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      mode: 'cors',
      body: JSON.stringify({
        credential: JSON.stringify(credential), // Send as string like the web version
        user_info: userInfo // Additional user info
      }),
    });

    console.log("Backend response status:", response.status);

    if (!response.ok) {
      let errorMessage = "Google login failed";
      try {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        console.log("Could not parse error response");
        errorMessage = `Server error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Google login response:", data);
    
    onStatusUpdate("Google login successful!", "success");
    
    // Return user data in the expected format
    return {
      success: true,
      user_name: data.user?.fullName || data.user?.name || data.googleData?.name || userInfo.name,
      user_email: data.user?.email || data.googleData?.email || userInfo.email,
      user_info: data.user,
      isGoogleUser: true,
      needsProfileCompletion: data.needsProfileCompletion || false,
      googleData: data.googleData || userInfo
    };

  } catch (error) {
    console.error("Google login error:", error);
    onStatusUpdate("Google login failed: " + error.message, "error");
    
    // Clear the cached token on error to allow retry
    if (chrome?.identity?.removeCachedAuthToken) {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            console.log("Cached auth token removed");
          });
        }
      });
    }
    
    throw error;
  }
};

export default GoogleLogin;

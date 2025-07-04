/* global chrome */

const API_BASE_URL = 'http://127.0.0.1:8000/api';
// const API_BASE_URL = 'https://api.sabapplier.com/api';

const LoginFunction = async (email, password, onStatusUpdate) => {
  try {
    if (email === "" || password === "") {
      onStatusUpdate("Please enter your email ID and password", "error");
      throw new Error("Please enter your email ID and password");
    }

    onStatusUpdate("Sending login request...", "success");
    
    console.log("Sending login request to:", `${API_BASE_URL}/users/extension/login`);
    console.log("Request payload:", { user_email: email, user_password: password });
    
    // Get extension ID for debugging
    const extensionId = chrome?.runtime?.id || 'unknown';
    console.log("Extension ID:", extensionId);
    
    const response = await fetch(`${API_BASE_URL}/users/extension/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": `chrome-extension://${extensionId}`,  // Explicitly set origin
        "User-Agent": "SabApplier-Extension/2.02"  // Custom user agent
      },
      mode: 'cors',
      body: JSON.stringify({
        user_email: email,
        user_password: password
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    onStatusUpdate("Processing response...", "success");

    if (response.status === 401) {
      let errorText = "Invalid credentials. Please check your email and password.";
      try {
        const errorData = await response.json();
        console.log("401 Error response:", errorData);
        errorText = errorData.message || errorText;
      } catch (e) {
        console.log("Could not parse 401 error response");
      }
      onStatusUpdate(errorText, "failed");
      setTimeout(() => onStatusUpdate("", "clear"), 5000);
      throw new Error(errorText);
    }

    if (response.status === 403) {
      let errorText = "Access forbidden. Please check your credentials and try again.";
      try {
        const errorData = await response.json();
        console.log("403 Error response:", errorData);
        errorText = errorData.message || errorText;
      } catch (e) {
        console.log("Could not parse 403 error response");
      }
      onStatusUpdate(errorText, "failed");
      setTimeout(() => onStatusUpdate("", "clear"), 5000);
      throw new Error(errorText);
    }

    if (response.status !== 200) {
      // Try to get the error message from the response
      let errorMessage = "Login failed. Please check your credentials and try again.";
      try {
        const errorData = await response.json();
        console.log("Error response data:", errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.log("Could not parse error response as JSON");
      }
      
      onStatusUpdate(errorMessage, "failed");
      setTimeout(() => onStatusUpdate("", "clear"), 5000);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    onStatusUpdate("Login successful!", "success");
    setTimeout(() => onStatusUpdate("", "clear"), 5000);
    return data;
  } catch (error) {
    onStatusUpdate("Error: " + error.message, "error");
    throw error;
  }
};

export default LoginFunction;


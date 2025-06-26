/* global chrome */

// const API_BASE_URL = 'http://127.0.0.1:8000/api';
const API_BASE_URL = 'https://api.sabapplier.com/api';

const LoginFunction = async (email, password, onStatusUpdate) => {
  try {
    if (email === "" || password === "") {
      onStatusUpdate("Please enter your email ID and password", "error");
      throw new Error("Please enter your email ID and password");
    }

    onStatusUpdate("Sending login request...", "success");
    const response = await fetch(`${API_BASE_URL}/users/extension/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include',  // Important for CORS requests
      mode: 'cors',  // Explicitly state we're making a CORS request
      body: JSON.stringify({
        user_email: email,
        user_password: password
      }),
    });

    onStatusUpdate("Processing response...", "success");

    if (response.status === 403) {
      onStatusUpdate("Access forbidden. Please check your credentials and try again.", "failed");
      setTimeout(() => onStatusUpdate("", "clear"), 5000);
      throw new Error("Access forbidden. Please check your credentials.");
    }

    if (response.status !== 200) {
      onStatusUpdate(
        "Login failed. Please check your credentials and try again.",
        "failed"
      );
      setTimeout(() => onStatusUpdate("", "clear"), 5000);
      throw new Error("Login failed. Please check your credentials.");
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


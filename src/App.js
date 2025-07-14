import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MissedFields from './components/MissedFields';
import FilledDetails from './components/FilledDetails';
import DataPreview from './components/DataPreview';
import Header from './components/Header';
import Loader from './components/Loader';
import AdaptiveLearningPopup from './components/AdaptiveLearningPopup';
import ToastNotification from './components/ToastNotification';
import ErrorBoundary from './components/ErrorBoundary';
import AccountDropdown from './components/AccountDropdown';

import useJWTAuth from './hooks/useJWTAuth';

function AppInner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastRef = React.useRef(false);
  const [savedUsers, setSavedUsers] = useState([]);
  const [adaptiveLearningData, setAdaptiveLearningData] = useState([]);
  const [newDataCount, setNewDataCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading SabApplier AI...');

  // Use JWT authentication hook
  const { 
    isAuthenticated, 
    userData, 
    token, 
    loading: jwtLoading, 
    error: jwtError, 
    refreshAuth, 
    logout 
  } = useJWTAuth();

  // Construct user object from JWT data
  const user = userData ? {
    email: userData.email || userData.user_email || (userData.user && userData.user.email) || (userData.googleData && userData.googleData.email),
    name: userData.name || userData.user_name || userData.first_name || userData.fullName || 
          (userData.user && (userData.user.name || userData.user.first_name || userData.user.fullName)) ||
          (userData.googleData && userData.googleData.name) || 'User',
    id: userData.id || userData.user_id || (userData.user && userData.user.id),
    token: token,
    isJWTAuthenticated: true,
    originalData: userData
  } : null;

  // Load saved users from chrome storage
  const loadSavedUsers = useCallback(() => {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['sabapplier_users'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading saved users:', chrome.runtime.lastError);
          return;
        }
        const users = result.sabapplier_users || {};
        console.log('Loaded saved users:', users);
        setSavedUsers(Object.entries(users));
      });
    }
  }, []);

  // Handle account selection from dropdown
  const handleAccountSelect = async (email, data) => {
    setLoading(true);
    setLoadingMessage(`Auto logging in as ${data.name || email}...`);
    
    if (!email || !data) {
      setError('User data not found');
      setLoading(false);
      return;
    }

    try {
      const currentUserData = { 
        email, 
        name: data.name || email.split('@')[0]
      };
      
      // Save selected user to storage
      if (chrome?.storage?.local) {
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({
            sabapplier_last_user: currentUserData
          }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
      
      // Navigate to dashboard with legacy user
      navigate('/dashboard');
    } catch (err) {
      console.error('Error in account selection:', err);
      setError('Error selecting account');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load saved users on component mount
    loadSavedUsers();
  }, [loadSavedUsers]);

  useEffect(() => {
    // Listen for background message to open DataPreview
    if (!chrome?.runtime?.onMessage) return;
    const handler = (message, sender, sendResponse) => {
      if (message.action === 'openDataPreview') {
        navigate('/data-preview');
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [navigate]);

  // Listen for showToast messages from background
  useEffect(() => {
    if (!chrome?.runtime?.onMessage) return;
    const handler = (message, sender, sendResponse) => {
      if (message.action === 'showToast' && message.message) {
        setToastMessage(message.message);
        setShowToast(true);
        toastRef.current = true;
      }
      // Existing openDataPreview handler
      if (message.action === 'openDataPreview') {
        navigate('/data-preview');
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [navigate]);

  useEffect(() => {
    if (userData) {
      console.log('🧪 DEBUG: User data received:', userData);
      console.log('🧪 DEBUG: Processed user object:', user);
    }
  }, [userData, user]);

  useEffect(() => {
    console.log('Auth state change detected:', { 
      isAuthenticated, 
      hasUserData: !!userData, 
      jwtLoading, 
      jwtError 
    });
  }, [isAuthenticated, userData, jwtLoading, jwtError]);


  // ################### for adaptive learning data checking ###################
  useEffect(() => {
      let lastCheckTime = 0;
      const MIN_CHECK_INTERVAL = 10000; // Minimum 10 seconds between checks
      
      const intervalId = setInterval(() => {
          const now = Date.now();
          
          // Skip if we checked too recently
          if (now - lastCheckTime < MIN_CHECK_INTERVAL) {
              return;
          }
          
          lastCheckTime = now;
          
          chrome.storage.session.get('autoFillDataResult', (data) => {
              if (data?.autoFillDataResult?.fillResults?.autoFillData2) {
                  console.log('Retrieved temporary response:', data.autoFillDataResult.fillResults.autoFillData2);
                  checkForModifications(data.autoFillDataResult.fillResults.autoFillData2);
              }
          });
      }, 15000); // Check every 15 seconds instead of 2 seconds

      return () => clearInterval(intervalId); // cleanup on unmount
  }, []);

  const checkForModifications = async (autoFillData) => {
      // Safe query for active tab
      let tab;
      try {
          const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
          });

          if (!tabs || tabs.length === 0) {
          onStatusUpdate("⚠️ No active tab found. Please refresh and try again.", "error");
          return { error: "No active tab found" };
          }

          tab = tabs[0];
      } catch (error) {
          console.error("Error querying tabs:", error);
          onStatusUpdate("⚠️ Error accessing tab. Please refresh and try again.", "error");
          return { error: "Tab query failed" };
      }

      try {
          const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (autoFillData) => {
              const allInputs = [];
              const list = document.querySelectorAll("input, textarea, select, label");

              for (const input of list) {
              try {
                  const name = input?.name;
                  const labelText = document.querySelector(`label[for="${input.id}"]`)?.innerText || input.placeholder || '';
                  const value = input?.value;
                  const type = input?.type;

                  // ❌ Skip hidden and buttons
                  if (
                      !name ||
                      !value ||
                      value === '' ||
                      type === 'hidden' ||
                      type === 'button' ||
                      type === 'submit' ||
                      type === 'reset'
                  ) {
                      continue;
                  }

                  console.log('data preview: ', name, value, type, autoFillData?.[name], Object.keys(autoFillData || {}), Object.keys(autoFillData || {})[0], typeof name, typeof Object.keys(autoFillData || {})[0]);
                  if (type !== 'file') {
                  if (value && value !== '' && value !== autoFillData?.[name]) {
                      allInputs.push({
                      name: name,
                      value: value
                      });
                  }
                  } else if (
                  type === 'file' &&
                  input.files &&
                  input.files.length > 0
                  ) {
                  const file = input.files[0];
                  if (file.name !== autoFillData?.[name]?.name) {
                      allInputs.push({
                      name: name,
                      value: file.name,
                      type: 'file'
                      });
                  }
                  }
              } catch (err) {
                  console.warn(`Skipping input due to error:`, input, err);
              }
              }

              return allInputs;
          },
          args: [autoFillData]
          });

          // ✅ Safely update state in React context
          try {
              const modifiedInputs = result.result;
              setAdaptiveLearningData(modifiedInputs);
              setNewDataCount(modifiedInputs.length);
              console.log("Modified inputs checked:", modifiedInputs);
          } catch (err) {
              console.error("Failed to update adaptive learning data:", err);
              onStatusUpdate("⚠️ Failed to update data. Please try again.", "error");
          }
      } catch (err) {
          console.error("Failed to execute content script:", err);
          onStatusUpdate("⚠️ Script execution failed", "error");
      }
  };
  // --------------------- end of adaptive learning data checking ---------------------

  const handleLogout = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Logging out...");
      
      // If user is JWT authenticated, use JWT logout
      if (user?.isJWTAuthenticated) {
        await logout();
      }
      
      // Also clear legacy user data
      if (chrome?.storage?.local) {
        await new Promise((resolve) => {
          chrome.storage.local.remove(['sabapplier_last_user'], () => {
            console.log('Legacy user data cleared');
            resolve();
          });
        });
      }
      
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToastClick = () => {
    setShowToast(false);
    toastRef.current = false;
    navigate('/data-preview');
  };

  // Show loading state while JWT is being checked
  if (jwtLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-800 flex items-center justify-center">
        <Loader message={loadingMessage} />
      </div>
    );
  }

  // Show error state
  if (jwtError || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
            <span className="text-red-400 text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Error</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">{jwtError || error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated || !user) {
    console.log('Not authenticated, showing login screen');
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Login />
      </div>
    );
  }

  console.log('Authenticated, rendering main UI. User:', user);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Header user={user} onLogout={handleLogout} />
      {/* Main content with responsive padding for header + mobile nav */}
      <main className="flex-1 header-offset px-3 sm:px-4 bg-white overflow-y-auto">
        <div className="max-w-7xl mx-auto h-full">
          <ErrorBoundary>
            <Routes>
              <Route path="/dashboard" element={
                <ErrorBoundary>
                  <Dashboard user={user} onLogout={handleLogout} newDataCount={adaptiveLearningData.length} />
                </ErrorBoundary>
              } />
              <Route path="/your-details" element={<MissedFields user={user} />} />
              <Route path="/data-preview" element={<DataPreview user={user} adaptiveLearningData={adaptiveLearningData} />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>
      {/* Always mount the popup, it will show itself if there is data */}
      <AdaptiveLearningPopup user={user} onClose={() => {}} />
      <ToastNotification
        message={toastMessage}
        visible={showToast}
        onClick={handleToastClick}
        onClose={() => { setShowToast(false); toastRef.current = false; }}
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

export default App;

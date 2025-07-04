import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import AccountDropdown from './components/AccountDropdown';
import Loader from './components/Loader';
import Dashboard from './components/Dashboard';
import LoginFunction from './services/API/LoginFunction';
import EmailLogin from './services/API/EmailLogin';

import './App.css';

export default function App() {
  const [savedUsers, setSavedUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSavedUsers();
    loadLastUser();
  }, []);

  const loadSavedUsers = () => {
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
  };

  const loadLastUser = () => {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['sabapplier_last_user'], (res) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading last user:', chrome.runtime.lastError);
          return;
        }
        const lastUser = res.sabapplier_last_user;
        if (lastUser && lastUser.email && lastUser.name) {
          setCurrentUser(lastUser);
          navigate('/dashboard');
        }
      });
    }
  };

  const saveUserToStorage = (userEmail, userName) => {
    return new Promise((resolve, reject) => {
      if (!chrome?.storage?.local) {
        reject(new Error('Chrome storage not available'));
        return;
      }

      chrome.storage.local.get(['sabapplier_users'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const existingUsers = result.sabapplier_users || {};
        const updatedUsers = {
          ...existingUsers,
          [userEmail]: { name: userName }
        };

        chrome.storage.local.set({
          sabapplier_users: updatedUsers,
          sabapplier_last_user: { email: userEmail, name: userName }
        }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            console.log('User data saved successfully:', updatedUsers);
            resolve();
          }
        });
      });
    });
  };

  const handleLogin = async (email, password, googleResult = null) => {
    setLoading(true);
    setStatus('Logging in...');
    try {
      let result;
      
      if (googleResult) {
        // Handle Google login result
        result = googleResult;
        setStatus('Google login successful!');
      } else {
        // Handle regular email/password login
        result = await LoginFunction(email, password, (msg) => setStatus(msg));
      }
      
      const userName = result?.user_name || result?.name || email.split('@')[0];
      const userEmail = result?.user_email || email;

      if (result) {
        try {
          await saveUserToStorage(userEmail, userName);
          setCurrentUser({ 
            email: userEmail, 
            name: userName,
            isGoogleUser: result.isGoogleUser || false,
            needsProfileCompletion: result.needsProfileCompletion || false
          });
          loadSavedUsers(); // Reload the users list
          navigate('/dashboard');
        } catch (storageError) {
          console.error('Failed to save user to storage:', storageError);
          // Continue with login even if storage fails
          setCurrentUser({ email: userEmail, name: userName });
          navigate('/dashboard');
        }
      } else {
        setStatus("Failed to Connect server or Invalid Credentials");
        setTimeout(() => setLoading(false), 3000);
      }
      
      return result;
    } catch (err) {
      setStatus('Login failed: ' + (err.message || 'Unknown error'));
      throw err;
    } finally {
      setTimeout(() => setLoading(false), 3000);
    }
  };

  const handleAccountSelect = async (email, data) => {
    setLoading(true);
    setStatus('Auto logging in...');
    
    if (!email || !data) {
      setStatus('User not found Please Login');
      setTimeout(() => setLoading(false), 3000);
      return;
    }

    try {
      const currentUserData = { 
        email, 
        name: data.name || email.split('@')[0]
      };
      
      await saveUserToStorage(email, currentUserData.name);
      setCurrentUser(currentUserData);
      loadSavedUsers(); // Reload the users list
      navigate('/dashboard');
    } catch (err) {
      console.error('Error in account selection:', err);
      setStatus('Error selecting account');
    } finally {
      setTimeout(() => setLoading(false), 3000);
    }
  };

  const handleLogout = () => {
    // Only clear the current session, NOT the saved users list
    setCurrentUser(null);
    
    // Clear only the last user (current session) from storage
    if (chrome?.storage?.local) {
      chrome.storage.local.remove(['sabapplier_last_user'], () => {
        if (chrome.runtime.lastError) {
          console.error('Error clearing last user:', chrome.runtime.lastError);
        }
      });
    }
    
    navigate('/');
  };

  // Optional: Add a function to completely clear all saved users (if needed)
  const handleClearAllUsers = () => {
    if (chrome?.storage?.local) {
      chrome.storage.local.remove(['sabapplier_users', 'sabapplier_last_user'], () => {
        if (chrome.runtime.lastError) {
          console.error('Error clearing all users:', chrome.runtime.lastError);
        } else {
          setSavedUsers([]);
          setCurrentUser(null);
          navigate('/');
        }
      });
    }
  };

const handleCloseButton = () => {
  if (chrome?.sidePanel) {
    chrome.sidePanel.close()
      .then(() => console.log('Side panel closed'))
      .catch(error => console.error('Error closing side panel:', error));
  }
};


  return (
    <div className='app'>
      {/* Future Plans */}
      {/* <button onClick={handleCloseButton} id="close-panel">X</button> */}
      <div className={`container ${loading ? 'blurred' : ''}`}>
        <Routes>
          <Route
            path="/"
            element={
              currentUser ? (
                <Navigate to="/dashboard" />
              ) : (
                <>
                  <div className='logo'>
                    <div className='tag'>
                      <h1>SabApplier AI</h1>
                      <p>India's Leading AI Form Filling</p>
                    </div>
                  </div>
                  <AccountDropdown users={savedUsers} onSelect={handleAccountSelect} />
                  <Login onLogin={handleLogin} />
                  <a href='https://sabapplier.com/signup' target='_blank' rel='noopener noreferrer'>
                    Don't Have Account
                  </a>
                </>
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              currentUser ? (
                <Dashboard 
                  user={currentUser} 
                  onLogout={handleLogout}
                  onClearAllUsers={handleClearAllUsers}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
        {loading && <Loader message={status || currentUser?.name || currentUser?.email} />}
      </div>
      <div className="copyright-footer">
        <a target='_blank' href='https://sabapplier.com/privacy-policy' >Our Privacy Policy</a>
        <br/>
        © 2025 SabApplier.com. All rights reserved.
      </div>
    </div>
  );
}

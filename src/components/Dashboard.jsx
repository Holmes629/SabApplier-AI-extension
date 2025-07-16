import React, { useState, useEffect } from 'react';
import { Rocket, LogOut, PenSquare, Gift } from 'lucide-react';

import EmailLogin from '../services/API/EmailLogin';
import Loader from './Loader';
import Footer from './Footer';
import DashboardAccountSwitcher from './DashboardAccountSwitcher';
import DataSourceSelector from './DataSourceSelector';
import { isValidUser, getUserDisplayName } from '../utils/userHelpers';

export default function Dashboard({ user, onLogout }) {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [savedUsers, setSavedUsers] = useState([]);
  const [currentDataSource, setCurrentDataSource] = useState(null); // Track current data source

  // Add diagnostic logging
  useEffect(() => {
    console.log('Dashboard mounted with user:', user);
    if (!isValidUser(user)) {
      console.error('Dashboard received invalid user object');
      setError('Invalid user information');
    }
    
    // Load saved users and check for selected data source
    loadSavedUsers();
    loadCurrentDataSource();
  }, [user]);
  
  // Load current data source from storage
  const loadCurrentDataSource = () => {
    if (!chrome?.storage?.local) {
      console.log('Chrome storage not available, using default data source');
      return;
    }
    
    chrome.storage.local.get(['sabapplier_last_user'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading current data source:', chrome.runtime.lastError);
        return;
      }
      
      const lastUser = result.sabapplier_last_user;
      console.log('Loaded current data source:', lastUser);
      
      if (lastUser) {
        setCurrentDataSource(lastUser);
      }
    });
  };
  
  // Load saved users from chrome storage and API
  const loadSavedUsers = () => {
    console.log('Attempting to load saved users and shared accounts...');
    if (!user || !user.email) {
      setSavedUsers([]);
      return;
    }
    // First get local saved users
    chrome.storage.local.get(['sabapplier_users'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading saved users:', chrome.runtime.lastError);
        setSavedUsers([]);
        return;
      }
      const users = result.sabapplier_users || {};
      // Always add current user
      if (!users[user.email]) {
        users[user.email] = { name: user.name || user.email.split('@')[0] };
      }
      // Fetch shared accounts from API
      const apiUrl = `http://127.0.0.1:8000/api/users/shared-accounts/?email=${encodeURIComponent(user.email)}`;
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          console.log('Shared accounts from API:', data);
          const sharedUsers = {};
          if (data.accounts && Array.isArray(data.accounts)) {
            data.accounts.forEach(account => {
              // Always preserve all fields from the API (including shared_documents)
              sharedUsers[account.email] = { ...account };
            });
          }
          // Merge local users with shared accounts, shared accounts take precedence
          const mergedUsers = { ...users, ...sharedUsers };
          console.log('Merged users for DataSourceSelector (with shared_documents):', mergedUsers);
          setSavedUsers(Object.entries(mergedUsers));
        })
        .catch(error => {
          console.error('Error fetching shared accounts:', error);
          setSavedUsers(Object.entries(users));
        });
    });
  };
  
  // Helper function to fetch shared accounts from API
  const fetchSharedAccounts = (localUsers) => {
    if (!user || !user.email) {
      setSavedUsers(Object.entries(localUsers));
      return;
    }
    
    // For testing purposes, add some mock shared accounts when in development mode
    const useMockData = false; // Set to true for testing without API
    
    if (useMockData) {
      console.log('Using mock shared accounts data for development');
      
      // Add mock shared accounts
      const mockSharedUsers = {
        'friend@example.com': { 
          name: 'Friend User', 
          type: 'shared',
          sharedAt: new Date().toISOString(),
          shareId: 'mock-share-123'
        },
        'colleague@example.com': { 
          name: 'Colleague', 
          type: 'shared',
          sharedAt: new Date().toISOString(),
          shareId: 'mock-share-456'
        }
      };
      
      // Merge local users with mock shared accounts
      const mergedUsers = { ...localUsers, ...mockSharedUsers };
      console.log('Merged users with mock shared accounts:', mergedUsers);
      
      setSavedUsers(Object.entries(mergedUsers));
      return;
    }
    
    // Real implementation - fetch shared accounts from API
    const apiUrl = `https://api.sabapplier.com/api/users/shared-accounts/?email=${encodeURIComponent(user.email)}`;
    console.log('Fetching shared accounts from:', apiUrl);
    
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch shared accounts: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Shared accounts from API:', data);
        
        // Convert API response to our format
        const sharedUsers = {};
        if (data.accounts && Array.isArray(data.accounts)) {
          data.accounts.forEach(account => {
            // Skip self account as we already have it
            if (account.type !== 'self') {
              sharedUsers[account.email] = { 
                name: account.name || account.email.split('@')[0],
                type: 'shared',
                sharedAt: account.shared_at,
                shareId: account.share_id
              };
            }
          });
        }
        
        // Merge local users with shared accounts
        const mergedUsers = { ...localUsers, ...sharedUsers };
        console.log('Merged users with shared accounts:', mergedUsers);
        
        setSavedUsers(Object.entries(mergedUsers));
      })
      .catch(error => {
        console.error('Error fetching shared accounts:', error);
        // Fall back to just local users
        setSavedUsers(Object.entries(localUsers));
      });
  };

  // Handle data source selection
  const handleAccountSelect = async (email, data) => {
    setLoading(true);
    
    const isSharedAccount = data.type === 'shared';
    const displayName = data.name || email.split('@')[0];
    
    setStatus(`${isSharedAccount ? 'Switching to ' + displayName + '\'s data' : 'Using my own data'}...`);
    
    if (!email || !data) {
      setStatus('Data source not found');
      setTimeout(() => setLoading(false), 3000);
      return;
    }

    try {
      // Prepare the data source object
      const dataSourceData = { 
        email, 
        name: displayName,
        type: data.type || 'self',
        isShared: isSharedAccount,
        shareId: data.shareId || null
      };
      
      console.log('Switching data source:', dataSourceData);
      
      // Update the current data source state
      setCurrentDataSource(dataSourceData);
      
      // Save selected data source to storage
      if (chrome?.storage?.local) {
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({
            sabapplier_last_user: dataSourceData
          }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
      
      setStatus(`Now using ${isSharedAccount ? displayName + '\'s' : 'your own'} data for autofill`);
      setTimeout(() => {
        setLoading(false);
        setStatus('');
      }, 2000);
      
    } catch (err) {
      console.error('Error selecting data source:', err);
      setStatus('Error selecting data source');
      setTimeout(() => setLoading(false), 3000);
    }
  };

  const handleAutoFill = async () => {
    console.log('AutoFill triggered');
    setLoading(true);
    setStatus('Filling form data...');
    setShowSuccess(false);
    setError(null);

    try {
      if (!user || !user.email) {
        throw new Error('User email is missing. Please log in again.');
      }
      
      // Determine which data source to use
      const dataSource = currentDataSource || user;
      const isUsingSharedAccount = dataSource.isShared === true || dataSource.type === 'shared';
      
      console.log('Current data source:', dataSource);
      console.log('Is using shared account:', isUsingSharedAccount);
      
      let loginParams;
      
      if (isUsingSharedAccount) {
        // Using shared account data
        loginParams = {
          userEmail: user.email, // The original logged-in user
          sharedAccountEmail: dataSource.email, // The shared account we want data from
          shareId: dataSource.shareId
        };
        console.log('Auto-filling with shared data from:', dataSource.email);
      } else {
        // Using own data
        loginParams = user.email;
        console.log('Auto-filling with own data:', user.email);
      }

      const response = await EmailLogin(loginParams, (msg) => {
        console.log('Status update:', msg);
        setStatus(msg);
      });

      if (chrome?.storage?.session) {
        chrome.storage.session.set({ autoFillDataResult: response }, () => {
          console.log('Temporary response stored in session storage', response);
        });
      } else {
        console.warn('chrome.storage.session not available in this environment.');
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setLoading(false);
        setStatus('');
      }, 3000);
      
    } catch (err) {
      console.error('AutoFill error:', err);
      setError(err.message || 'Something went wrong during auto-fill.');
      setTimeout(() => {
        setLoading(false);
        setStatus('');
      }, 5000);
    }
  };

  // Ensure currentDataSource is always set to a valid value
  useEffect(() => {
    if (!currentDataSource && user && user.email) {
      setCurrentDataSource({
        email: user.email,
        name: user.name || user.email.split('@')[0],
        type: 'self',
        isShared: false,
        shareId: null
      });
    }
  }, [currentDataSource, user]);

  // If there's an error with the component, display a fallback
  if (error) {
    return (
      <div className="p-8 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-lg border border-red-300/20">
        <div className="text-center mb-6">
          <h3 className="mt-4 text-xl font-bold text-white">Something went wrong</h3>
          <p className="mt-2 text-gray-400">{error}</p>
        </div>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Reload
          </button>
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded-lg flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden" data-testid="dashboard">
      {/* Simple Dashboard */}
      <div className="flex-1 bg-white py-3 overflow-hidden">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-full">
          <div className="flex flex-col justify-center h-full text-center">
            <div className="space-y-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Welcome back, {getUserDisplayName(user)?.split(' ')[0] || 'User'}! 👋
                </h1>
                <p className="text-sm text-gray-600 mb-4 max-w-2xl mx-auto">
                  Apply faster & easier with AI-powered automation
                </p>
              </div>
              
              {/* Data Source Selector */}
              <div className="mb-4 max-w-md mx-auto">
                <DataSourceSelector
                  users={savedUsers}
                  currentUser={user}
                  currentDataSource={currentDataSource}
                  onSelect={handleAccountSelect}
                  advancedUnlocked={user?.successful_referrals >= 2}
                />
              </div>
              
              {/* Auto Fill Details Section */}
              <div className="mb-4">
                <div className="inline-block p-2">
                  <PenSquare size={32} className="mx-auto mb-2 text-blue-600" />
                  <h3 className="text-base font-bold text-gray-800 mb-2">Auto Fill Details</h3>
                  <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">
                    Automatically fill forms with your saved information on SabApplier
                  </p>
                </div>
              </div>
              
              {/* Main CTA Button */}
              <div className="mb-3">
                <button
                  onClick={handleAutoFill}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <span className="mr-2">⏳</span>
                      Filling Forms...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      AutoFill Form
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Message */}
      {status && (
        <div className={`mx-auto max-w-2xl px-4 mb-4 ${
          showSuccess 
            ? 'text-green-700 bg-green-100 border-green-200' 
            : 'text-blue-700 bg-blue-100 border-blue-200'
        } rounded-lg p-4 border shadow-sm`}>
          <div className="flex items-center justify-center">
            {loading && <span className="mr-2">⏳</span>}
            <p className="font-medium">{status}</p>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center">
            <div className="mb-4 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-gray-800">{status || 'Processing...'}</p>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}

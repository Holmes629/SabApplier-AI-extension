import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import EmailLogin from '../services/API/EmailLogin';
import Loader from './Loader'; // Import the Loader component
import DataSourceSelector from './DataSourceSelector';

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentDataSource, setCurrentDataSource] = useState(null);

  const handleEdit = () => {
    window.open('http://localhost:3000/auto-fill-data', '_blank');
  };

  const handleDataSourceChange = (dataSource) => {
    setCurrentDataSource(dataSource);
    if (dataSource?.source === 'shared') {
      setStatus(`Now using ${dataSource.senderName}'s data for form filling`);
    } else {
      setStatus('Now using your own data for form filling');
    }
    // Clear status after 3 seconds
    setTimeout(() => setStatus(''), 3000);
  };

  const handleFillDetails = async () => {
    setLoading(true);
    
    if (currentDataSource?.source === 'shared') {
      setStatus(`Fetching ${currentDataSource.senderName}'s details for form filling...`);
    } else {
      setStatus('Fetching your details...');
    }

    try {
      const response = await EmailLogin(user.email, (msg) => setStatus(msg));
    } catch (err) {
      setStatus('Failed to fill details. Try again.');
    }

    setTimeout(() => setLoading(false), 3000);
  };

  const handleProfile = () => {
    window.open('http://localhost:3000/profile', '_blank');
    
  };

  const logout = () => {
    setLoading(true);
    setStatus('Logging out...');

    if (chrome?.storage?.local) {
      chrome.storage.local.get(['sabapplier_users'], (result) => {
        const users = result.sabapplier_users || {};
        delete users[user.email];
        chrome.storage.local.set({ sabapplier_users: users }, () => {
          setTimeout(() => {
            setLoading(false);
            onLogout();
            navigate('/');
          }, 1500);
        });
      });
    } else {
      setTimeout(() => {
        setLoading(false);
        onLogout();
        navigate('/');
      }, 1500);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="dashboard">
      <div className='logo'>
        <div className='tag'>
          <h1>SabApplier AI</h1>
          <p>India's Leading AI Form Filling</p>
        </div>
      </div>
      {/* Main Dashboard Container with blur effect when loading */}
      <div className={`dashboard-main ${loading ? 'blurred' : ''}`}>
        {/* Header Section */}
        <div className="dashboard-header">

          <div className="welcome-section">
            <h1>Dashboard</h1>
            <p>Welcome back, {user.name.split(' ')[0]}!</p>
          </div>

          {/* Profile Section */}
          <div className="profile-section">
            <div
              className="profile-avatar"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {getInitials(user.name)}
            </div>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="profile-name">{user.name}</div>
                  <div className="profile-email">{user.email}</div>
                </div>
                <div className="profile-divider"></div>
                <button className="profile-menu-item" onClick={handleProfile}>
                  <span className="menu-icon">👤</span>
                  Profile Settings
                </button>
                <button className="profile-menu-item logout-item" onClick={logout}>
                  <span className="menu-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-content">
          {/* Data Source Selector */}
          <DataSourceSelector 
            user={user}
            onDataSourceChange={handleDataSourceChange}
          />

          <div className="action-grid">

            <div className="action-card">
              <div className="card-icon fill-icon">📝</div>
              <h3>Auto Fill Details</h3>
              <p>Automatically fill forms with your saved information on SabAppliers</p>
              <button
                className="action-button secondary"
                onClick={handleFillDetails}
                disabled={loading}
              >
                Fill Forms
              </button>
            </div>


            
          </div>

          {/* Quick Stats or Additional Info */}
          
        </div>
      </div>

      {/* Loader Component */}
      {loading && <Loader message={status || 'Processing...'} />}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import './DataSourceSelector.css';
import * as DataSourceManager from '../services/API/DataSourceManager';

export default function DataSourceSelector({ user, onDataSourceChange }) {
  const [dataSources, setDataSources] = useState([]);
  const [activeDataSource, setActiveDataSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.email) {
      loadDataSources();
      loadActiveDataSource();
    }
  }, [user]);

  const loadDataSources = async () => {
    try {
      setLoading(true);
      const sources = await DataSourceManager.getSharedDataSources(user.email);
      setDataSources(sources);
    } catch (error) {
      console.error('Error loading data sources:', error);
      setError('Failed to load shared data sources');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveDataSource = async () => {
    try {
      const activeSource = await DataSourceManager.getActiveDataSource();
      setActiveDataSource(activeSource);
    } catch (error) {
      console.error('Error loading active data source:', error);
    }
  };

  const handleSwitchToOwnData = async () => {
    try {
      setLoading(true);
      await DataSourceManager.switchToOwnData();
      setActiveDataSource(null);
      setShowDropdown(false);
      onDataSourceChange && onDataSourceChange({ source: 'own' });
    } catch (error) {
      console.error('Error switching to own data:', error);
      setError('Failed to switch to own data');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToSharedData = async (senderEmail, senderName) => {
    try {
      setLoading(true);
      await DataSourceManager.switchToSharedData(user.email, senderEmail);
      
      const newActiveSource = {
        source: 'shared',
        senderEmail,
        senderName,
        switchedAt: new Date().toISOString()
      };
      
      setActiveDataSource(newActiveSource);
      setShowDropdown(false);
      onDataSourceChange && onDataSourceChange(newActiveSource);
    } catch (error) {
      console.error('Error switching to shared data:', error);
      setError('Failed to switch to shared data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDisplayName = () => {
    if (activeDataSource?.source === 'shared') {
      return activeDataSource.senderName || activeDataSource.senderEmail;
    }
    return 'My Own Data';
  };

  const getCurrentDisplayIcon = () => {
    if (activeDataSource?.source === 'shared') {
      return '👥';
    }
    return '👤';
  };

  return (
    <div className="data-source-selector">
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button 
            className="error-close"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      <div className="data-source-header">
        <div className="data-source-label">
          <span className="label-icon">📊</span>
          <span>Data Source</span>
        </div>
      </div>

      <div className="data-source-dropdown">
        <button
          className={`dropdown-trigger ${showDropdown ? 'active' : ''}`}
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={loading}
        >
          <div className="current-source">
            <span className="source-icon">{getCurrentDisplayIcon()}</span>
            <span className="source-name">{getCurrentDisplayName()}</span>
          </div>
          <span className={`dropdown-arrow ${showDropdown ? 'rotated' : ''}`}>
            ▼
          </span>
        </button>

        {showDropdown && (
          <div className="dropdown-menu">
            <div className="dropdown-section">
              <div className="section-label">Available Sources</div>
              
              {/* Own Data Option */}
              <button
                className={`dropdown-item ${activeDataSource?.source !== 'shared' ? 'active' : ''}`}
                onClick={handleSwitchToOwnData}
                disabled={loading}
              >
                <div className="item-content">
                  <span className="item-icon">👤</span>
                  <div className="item-info">
                    <div className="item-name">My Own Data</div>
                    <div className="item-desc">Use your personal information</div>
                  </div>
                </div>
                {activeDataSource?.source !== 'shared' && (
                  <span className="active-indicator">✓</span>
                )}
              </button>

              {/* Shared Data Options */}
              {dataSources.length > 0 ? (
                dataSources.map((source) => (
                  <button
                    key={source.id}
                    className={`dropdown-item ${
                      activeDataSource?.source === 'shared' && 
                      activeDataSource?.senderEmail === source.senderEmail ? 'active' : ''
                    }`}
                    onClick={() => handleSwitchToSharedData(source.senderEmail, source.senderName)}
                    disabled={loading}
                  >
                    <div className="item-content">
                      <span className="item-icon">👥</span>
                      <div className="item-info">
                        <div className="item-name">{source.senderName}</div>
                        <div className="item-desc">{source.senderEmail}</div>
                      </div>
                    </div>
                    {activeDataSource?.source === 'shared' && 
                     activeDataSource?.senderEmail === source.senderEmail && (
                      <span className="active-indicator">✓</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="no-sources">
                  <span className="no-sources-icon">📭</span>
                  <span className="no-sources-text">
                    No shared data sources available
                  </span>
                </div>
              )}
            </div>

            {dataSources.length === 0 && (
              <div className="dropdown-footer">
                <button 
                  className="manage-sharing-btn"
                  onClick={() => window.open('http://localhost:3000/data-sharing', '_blank')}
                >
                  <span>🔗</span>
                  Manage Sharing
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Switching data source...</span>
        </div>
      )}
    </div>
  );
}

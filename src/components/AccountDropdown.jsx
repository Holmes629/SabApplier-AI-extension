import React, { useState, useRef, useEffect } from 'react';
import './AccountDropdown.css';

export default function AccountDropdown({ users = [], onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Filter users based on search term
  const filteredUsers = users.filter(([email, data]) => {
    const name = data && data.name ? data.name : '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email && email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredUsers[highlightedIndex]) {
          handleUserSelect(filteredUsers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleUserSelect = ([email, data]) => {
    setSelectedUser({ email, data });
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    onSelect(email,data);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    if (!name || typeof name !== 'string') name = '?';
    const colors = [
      'linear-gradient(135deg, #8B5CF6, #EC4899)',
      'linear-gradient(135deg, #3B82F6, #06B6D4)',
      'linear-gradient(135deg, #10B981, #14B8A6)',
      'linear-gradient(135deg, #F59E0B, #F97316)',
      'linear-gradient(135deg, #EF4444, #EC4899)',
      'linear-gradient(135deg, #6366F1, #8B5CF6)'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      {/* Label */}
      <label className="dropdown-label">Continue As</label>

      {/* Main Dropdown Button */}
      <div className="dropdown-wrapper">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && searchRef.current) {
              setTimeout(() => searchRef.current?.focus(), 100);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`dropdown-button ${isOpen ? 'dropdown-button-open' : ''}`}
        >
          <div className="dropdown-button-content">
            <div className="dropdown-button-left">
              {selectedUser ? (
                <>
                  <div 
                    className="user-avatar"
                    style={{ background: getAvatarColor(selectedUser.data.name) }}
                  >
                    {getInitials(selectedUser.data.name)}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{selectedUser.data.name}</div>
                    <div className="user-email">{selectedUser.email}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="default-avatar">
                    <svg className="default-avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="placeholder-text">Select an account</span>
                </>
              )}
            </div>
            
            <svg className={`dropdown-arrow ${isOpen ? 'dropdown-arrow-open' : ''}`}
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          <div className="button-overlay"></div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="dropdown-menu">
            
            {/* Search Input */}
            <div className="search-container">
              <div className="search-wrapper">
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  className="search-input"
                />
              </div>
            </div>

            {/* User Options */}
            <div className="options-container">
              {filteredUsers.length > 0 ? (
                <div className="options-list">
                  {filteredUsers.map(([email, data], index) => {
                    const name = data && data.name ? data.name : email;
                    return (
                      <button
                        key={email}
                        onClick={() => handleUserSelect([email, data])}
                        className={`option-item ${
                          index === highlightedIndex ? 'option-highlighted' : ''
                        } ${selectedUser?.email === email ? 'option-selected' : ''}`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        {/* Avatar */}
                        <div 
                          className="option-avatar"
                          style={{ background: getAvatarColor(name) }}
                        >
                          {getInitials(name)}
                        </div>
                        {/* User Info */}
                        <div className="option-info">
                          <div className="option-name">{name}</div>
                          <div className="option-email">{email}</div>
                        </div>
                        {/* Selected Indicator */}
                        {selectedUser?.email === email && (
                          <div className="selected-indicator">
                            <svg className="check-icon" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" 
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                                    clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="option-ripple"></div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <p className="empty-title">No accounts found</p>
                  <p className="empty-subtitle">Try adjusting your search</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredUsers.length > 0 && (
              <div className="dropdown-footer">
                <span className="footer-text">
                  {filteredUsers.length} account{filteredUsers.length !== 1 ? 's' : ''} available
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
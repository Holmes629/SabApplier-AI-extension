import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Database, User, Share2 } from 'lucide-react';

/**
 * DataSourceSelector - A dropdown component for selecting data sources
 * Shows "My Own Data" and shared accounts options
 * 
 * @param {Object} props - Component props
 * @param {Array} props.users - Array of [email, data] tuples for shared accounts
 * @param {Object} props.currentUser - Current user object
 * @param {Object} props.currentDataSource - Currently selected data source
 * @param {Function} props.onSelect - Callback when a data source is selected
 * @returns {JSX.Element}
 */
const DataSourceSelector = ({ users, currentUser, currentDataSource, onSelect, advancedUnlocked }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState(null);
  
  console.log('DataSourceSelector received users:', users);
  users.forEach(([email, data]) => {
    if (data.type === 'shared') {
      console.log(`Shared account: ${email}, shared_documents:`, data.shared_documents);
    }
  });
  console.log('DataSourceSelector current user:', currentUser);
  console.log('DataSourceSelector current data source:', currentDataSource);
  
  // If advancedUnlocked is not passed, fallback to currentUser?.successful_referrals
  const isUnlocked = typeof advancedUnlocked === 'boolean' ? advancedUnlocked : (currentUser?.successful_referrals >= 2);
  
  // Filter to find shared accounts (accounts with type='shared' or with shareId)
  const sharedAccounts = users.filter(([email, data]) => {
    // Check if this is a shared account (not the current user's account)
    const isShared = data.type === 'shared' || data.shareId;
    const isDifferentUser = email !== currentUser?.email;
    return isShared && isDifferentUser;
  });
  
  console.log('Filtered shared accounts:', sharedAccounts);
  
  // Determine if we're currently using a shared account
  const isUsingSharedAccount = currentDataSource?.isShared === true || currentDataSource?.type === 'shared';
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleSelect = (email, data) => {
    setIsOpen(false);
    if (onSelect) {
      onSelect(email, data);
    }
  };
  
  const handleSelectOwnData = () => {
    setIsOpen(false);
    if (onSelect && currentUser?.email) {
      // Use the current user's own data
      onSelect(currentUser.email, {
        name: currentUser.name,
        type: 'self',
        isShared: false
      });
    }
  };
  
  // Helper to prettify document field names
  const DOCUMENT_FIELDS = {
    passport_size_photo_file_url: "Passport Size Photo",
    aadhaar_card_file_url: "Aadhaar Card",
    pan_card_file_url: "PAN Card",
    signature_file_url: "Signature",
    _10th_certificate_file_url: "10th Certificate",
    _12th_certificate_file_url: "12th Certificate",
    graduation_certificate_file_url: "Graduation Certificate",
    left_thumb_file_url: "Left Thumb",
    caste_certificate_file_url: "Caste Certificate",
    pwd_certificate_file_url: "PWD Certificate",
    domicile_certificate_file_url: "Domicile Certificate",
  };
  const prettifyFieldName = (field) => {
    return DOCUMENT_FIELDS[field] || field.replace(/_file_url$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };
  
  return (
    <div className="data-source-selector w-full max-w-md mx-auto">
      <div className="border border-gray-200 rounded-lg shadow-sm">
        {/* Data Source Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <Database className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Data Source</span>
          </div>
        </div>
        
        {/* Current Selection */}
        <div 
          className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={toggleDropdown}
        >
          <div className="flex items-center">
            <User className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-gray-900">
              {isUsingSharedAccount 
                ? `${currentDataSource?.name || 'Shared Account'}'s Data` 
                : 'My Own Data'}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
        
        {/* Dropdown Options */}
        {isOpen && (
          <div className="absolute mt-1 w-full max-w-md bg-white border border-gray-200 rounded-md shadow-lg z-10">
            <div className="py-1">
              {/* My Own Data Option */}
              <div 
                className={`px-4 py-2 flex items-center hover:bg-gray-100 cursor-pointer ${!isUsingSharedAccount ? 'bg-blue-50' : ''}`}
                onClick={handleSelectOwnData}
              >
                <User className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-gray-900">My Own Data</span>
                {!isUsingSharedAccount && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Current</span>
                )}
              </div>
              {/* Lock message if not unlocked */}
              {!isUnlocked && (
                <div className="mt-2 text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <span className="font-bold">🔒 Advanced Feature Locked:</span> Invite 2 friends to unlock this feature. <a href="https://sabapplier.com/profile" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">Unlock Now</a>
                </div>
              )}
              {/* Shared Account Options */}
              {(sharedAccounts.length > 0 || users.some(([_, data]) => data.type === 'shared')) && (
                <div className="border-t border-gray-200 mt-1 pt-1">
                  <div className="px-4 py-1">
                    <span className="text-xs font-medium text-gray-500">Shared With Me</span>
                  </div>
                  
                  {users
                    .filter(([email, data]) => data.type === 'shared' || data.shareId)
                    .map(([email, data]) => {
                      const isDocsExpanded = expandedDocs === email;
                      return (
                        <div key={email} className={`mb-2 border-l-4 ${isUnlocked ? 'border-blue-300' : 'border-gray-200'} rounded`}> 
                          <div className={`px-4 py-2 flex items-center ${isUnlocked ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'} ${isUsingSharedAccount && currentDataSource?.email === email ? 'bg-blue-50' : ''}`}
                            onClick={isUnlocked ? () => handleSelect(email, { ...data, type: 'shared' }) : undefined}
                            title={isUnlocked ? '' : 'Unlock advanced features to use shared data sources'}>
                            <User className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-gray-900">{data.name || email.split('@')[0]}'s Data</span>
                            {isUsingSharedAccount && currentDataSource?.email === email && (
                              <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Current</span>
                            )}
                          </div>
                          {/* Shared docs dropdown toggle row */}
                          <div className="px-8 py-1 text-xs text-gray-700 bg-yellow-50 border border-yellow-300 rounded-b w-full flex items-center cursor-pointer select-none" onClick={e => { e.stopPropagation(); setExpandedDocs(isDocsExpanded ? null : email); }}>
                            <span className="font-semibold mr-1">Shared Docs</span>
                            {/* Remove the text '>' and only keep the icon */}
                            {isDocsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                          {/* Dropdown content */}
                          {isDocsExpanded && (
                            <div className="px-10 py-2 text-xs text-gray-700 bg-yellow-50 border-l-2 border-yellow-300 w-full">
                              {Array.isArray(data.shared_documents) && data.shared_documents.length > 0 ? (
                                <span>
                                  {data.shared_documents.map((doc, idx) => (
                                    <span key={doc.type} className="inline-flex items-center mr-2">
                                      {doc.url ? (
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900 flex items-center">
                                          {doc.name}
                                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                                        </a>
                                      ) : (
                                        <span>{doc.name}</span>
                                      )}
                                      {idx < data.shared_documents.length - 1 && ','}
                                    </span>
                                  ))}
                                </span>
                              ) : (
                                <span className="italic text-gray-400">None</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Show viral message only if not unlocked */}
      {!isUnlocked && (
        <div className="mt-4 flex items-center justify-center text-blue-700 text-xs font-semibold gap-1 opacity-90">
          <Share2 className="w-4 h-4" />
          <span>Save time. Help your friends. Get free upgrades by inviting just 2 people.</span>
        </div>
      )}
    </div>
  );
};

export default DataSourceSelector;

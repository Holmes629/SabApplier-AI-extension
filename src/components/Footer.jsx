import React from 'react';
import { ExternalLink, Shield, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <>
      <footer className="bg-gray-50 border-t border-gray-200 px-3 py-2">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
          <Shield className="w-3 h-3 text-gray-500" />
          <a
            href="https://sabapplier.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors duration-200 flex items-center gap-1"
          >
            Privacy Policy
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500">© 2025 SabApplier</span>
        </div>
      </footer>
      {/* Floating Feedback Button */}
      <a
        href="https://forms.gle/LF873a6PqVE9sNmQ9"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: '#2563eb',
          color: 'white',
          borderRadius: 9999,
          minWidth: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          fontSize: 18,
          padding: '0 20px',
          fontWeight: 500,
          gap: 10,
          transition: 'background 0.2s',
        }}
        title="Give Feedback"
      >
        <MessageCircle size={24} />
        <span className="hidden sm:inline" style={{ marginLeft: 8, fontSize: 16, fontWeight: 600, letterSpacing: 0.2 }}>Feedback</span>
      </a>
    </>
  );
};

export default Footer;

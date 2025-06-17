import React from 'react';
import './Loader.css';

export default function Loader({ message }) {
  const isError = message.toLowerCase().includes('failed') || message.toLowerCase().includes('error');
  const isSuccess = message.toLowerCase().includes('success') || message.toLowerCase().includes('successful');

  return (
    <div className="loader-overlay">
      <div className="loader-box">
        {isError ? (
          <div className="loader-icon error-icon">✖</div>
        ) : isSuccess ? (
          <div className="loader-icon success-icon">✔</div>
        ) : (
          <div className="loader-spinner" />
        )}
        <div className={isError ? 'error-loader-message' : 'loader-message'}>{message}</div>
      </div>
    </div>
  );
}

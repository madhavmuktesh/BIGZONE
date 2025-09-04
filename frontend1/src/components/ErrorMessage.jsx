// src/components/ErrorMessage.jsx
import React from 'react';

const ErrorMessage = ({ message }) => (
  <div className="error-message">
    <h2>Oops! Something went wrong</h2>
    <p>{message}</p>
    <button onClick={() => window.location.reload()}>
      Try Again
    </button>
  </div>
);

export default ErrorMessage;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

function RoleSelection() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [carerName, setCarerName] = useState('');
  const [showCarerInput, setShowCarerInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminClick = () => {
    navigate('/login');
  };

  const handleCarerClick = () => {
    setShowCarerInput(true);
    setError('');
  };

  const handleCarerLogin = async () => {
    if (!carerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authAPI.carerLogin(carerName.trim());

      if (result.success) {
        login({
          id: result.data.user.id,
          username: result.data.user.username,
          role: result.data.user.role,
          displayName: result.data.user.displayName
        });
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRoles = () => {
    setShowCarerInput(false);
    setCarerName('');
    setError('');
  };

  if (showCarerInput) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h1 className="tcs-roster-title">TC's Roster</h1>
          <p>Enter your name to continue:</p>

          <div className="form-group">
            <input
              type="text"
              placeholder="Your name"
              value={carerName}
              onChange={(e) => setCarerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCarerLogin()}
              disabled={loading}
              autoFocus
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button
            className="login-button"
            onClick={handleCarerLogin}
            disabled={loading || !carerName.trim()}
          >
            {loading ? 'Connecting...' : 'Continue as Carer'}
          </button>

          <button
            className="login-button btn-secondary"
            onClick={handleBackToRoles}
            disabled={loading}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="tcs-roster-title">TC's Roster</h1>
        <p>Welcome to the mobile app</p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '30px' }}>
          Please select your role to continue:
        </p>

        <button
          className="login-button admin-button"
          onClick={handleAdminClick}
        >
          Admin Login
        </button>

        <button
          className="login-button carer-button"
          onClick={handleCarerClick}
        >
          I'm a Carer
        </button>
      </div>
    </div>
  );
}

export default RoleSelection;
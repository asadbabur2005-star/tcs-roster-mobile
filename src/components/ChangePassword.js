import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

function ChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.changePassword(currentPassword, newPassword);

      if (result.success) {
        setSuccess('Password changed successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Failed to change password. Please try again.');
      }
    } catch (err) {
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="mobile-container">
        <div className="header">
          <h1>Access Denied</h1>
          <p>Only administrators can change passwords.</p>
        </div>
        <div style={{ padding: '20px' }}>
          <button onClick={() => navigate('/dashboard')} className="btn primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="header">
        <h1>Change Password</h1>
        <p>Update your administrator password</p>
      </div>

      <div style={{ padding: '20px 0 100px 0' }}>
        <form onSubmit={handleSubmit} style={{ padding: '0 20px' }}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password:</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password:</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              autoComplete="new-password"
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              autoComplete="new-password"
              minLength="6"
            />
          </div>

          {error && (
            <div className="error" style={{ margin: '20px 0' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="success" style={{ margin: '20px 0' }}>
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn primary"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
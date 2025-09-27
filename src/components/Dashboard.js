import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rosterAPI } from '../services/api';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todayRoster, setTodayRoster] = useState(null);
  const [hasAnyRoster, setHasAnyRoster] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRoster = async () => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[today.getDay()];
        setCurrentDay(dayName);

        const result = await rosterAPI.getCurrentRoster();

        if (result.success) {
          if (result.data.roster && result.data.roster.data) {
            setHasAnyRoster(true);
            const dayRoster = result.data.roster.data[dayName.toLowerCase()];
            setTodayRoster(dayRoster);
          } else {
            setHasAnyRoster(false);
            setTodayRoster(null);
          }
        } else {
          setHasAnyRoster(false);
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load roster data');
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleCreateRoster = () => {
    navigate('/roster/create');
  };

  const handleEditRoster = () => {
    navigate('/roster/edit');
  };

  const getUserDisplayName = () => {
    if (user.displayName) return user.displayName;
    if (user.role === 'admin') return 'Admin';
    return user.username || 'User';
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="header">
          <h1 className="tcs-roster-title">TC's Roster</h1>
          <p>Welcome, {getUserDisplayName()}</p>
        </div>
        <div className="mobile-loading">
          <div className="loading-spinner"></div>
          <p>Loading today's roster...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-container">
        <div className="header">
          <h1 className="tcs-roster-title">TC's Roster</h1>
          <p>Welcome, {getUserDisplayName()}</p>
        </div>
        <div className="shift-card" style={{ backgroundColor: '#f8d7da', border: '2px solid #f5c6cb', margin: '20px' }}>
          <p style={{ color: '#721c24', textAlign: 'center', marginBottom: '15px' }}>
            <strong>Error:</strong> {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn primary"
            style={{ margin: '0 auto', display: 'block' }}
          >
            Try Again
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <button onClick={handleLogout} className="btn secondary">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '-webkit-fill-available' }}>
      <div className="header">
        <h1>TC's Roster</h1>
        <p>Welcome, {getUserDisplayName()}</p>
        <p style={{ fontSize: '16px', color: '#666', marginTop: '5px' }}>
          {user.role === 'admin' ? 'Administrator' : 'Carer View'}
        </p>
      </div>

      <div className="dashboard-content">
        <h2 className="schedule-title">
          Today's Schedule - {currentDay}
        </h2>

        {todayRoster ? (
          <div>
            {/* Morning Shift */}
            <div className="shift-card">
              <div className="shift-header">
                <span className="shift-time">10:00 AM - 2:00 PM</span>
              </div>
              <ul className="carer-list">
                {todayRoster.morning?.map((carer, index) => (
                  <li key={index} className="carer-item">
                    <span className="carer-name">{carer.name}</span>
                    <span className="carer-role">Carer</span>
                  </li>
                )) || <li className="carer-item"><span className="carer-name">No carers assigned</span></li>}
              </ul>
            </div>

            {/* Evening Shift */}
            <div className="shift-card">
              <div className="shift-header">
                <span className="shift-time">6:00 PM - 10:00 PM</span>
              </div>
              <ul className="carer-list">
                {todayRoster.evening?.map((carer, index) => (
                  <li key={index} className="carer-item">
                    <span className="carer-name">{carer.name}</span>
                    <span className="carer-role">Carer</span>
                  </li>
                )) || <li className="carer-item"><span className="carer-name">No carers assigned</span></li>}
              </ul>
            </div>

            {/* Instructions */}
            {todayRoster.instructions && (
              <div style={{
                margin: '20px',
                padding: '18px 20px',
                backgroundColor: '#F4A99C',
                color: '#000000',
                border: 'none',
                borderRadius: '15px',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(244, 169, 156, 0.3)',
                transition: 'all 0.2s ease',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}>
                <strong style={{ color: '#000000', fontSize: '16px', fontWeight: '600' }}>Today's Instructions:</strong>
                <p style={{ marginTop: '8px', color: '#000000', fontSize: '18px', fontWeight: '600', lineHeight: '1.5', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {todayRoster.instructions}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="no-roster-card">
            <p style={{ fontSize: '32px', marginBottom: '20px' }}>📅</p>
            <p>No roster found for today.</p>
            {user.role === 'admin' && (
              <p>Please create a weekly roster to get started.</p>
            )}
          </div>
        )}

        {/* Admin Controls */}
        {user.role === 'admin' && (
          <div className="management-section">
            <h3 className="management-title">
              Roster Management
            </h3>
            {!hasAnyRoster ? (
              <button
                onClick={handleCreateRoster}
                className="btn primary"
                style={{ marginBottom: '15px' }}
              >
                Create Weekly Roster
              </button>
            ) : (
              <>
                <button
                  onClick={handleEditRoster}
                  className="btn primary"
                  style={{ marginBottom: '15px' }}
                >
                  Edit Roster
                </button>
                <button
                  onClick={handleCreateRoster}
                  className="btn secondary"
                  style={{ marginBottom: '15px' }}
                >
                  Create New Roster
                </button>
              </>
            )}
            <button
              onClick={() => navigate('/change-password')}
              className="btn secondary"
              style={{ marginBottom: '15px' }}
            >
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="btn secondary"
            >
              Logout
            </button>
          </div>
        )}

        {/* Carer Controls */}
        {user.role === 'carer' && (
          <div style={{ padding: '20px' }}>
            <button
              onClick={handleLogout}
              className="btn secondary"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
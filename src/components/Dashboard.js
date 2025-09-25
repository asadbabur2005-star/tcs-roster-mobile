import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rosterAPI } from '../services/api';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todayRoster, setTodayRoster] = useState(null);
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
            const dayRoster = result.data.roster.data[dayName.toLowerCase()];
            setTodayRoster(dayRoster);
          } else {
            setTodayRoster(null);
          }
        } else {
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
          <h1>TC's Roster</h1>
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
          <h1>TC's Roster</h1>
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
    <div className="mobile-container">
      <div className="header">
        <h1>TC's Roster</h1>
        <p>Welcome, {getUserDisplayName()}</p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
          {user.role === 'admin' ? 'Administrator' : 'Carer View'}
        </p>
      </div>

      <div style={{ padding: '0 0 20px 0' }}>
        <h2 style={{
          color: '#000000',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: '600'
        }}>
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
                padding: '15px',
                backgroundColor: '#e7f3ff',
                borderRadius: '8px',
                border: '2px solid #b3d9ff'
              }}>
                <strong style={{ color: '#0056b3', fontSize: '16px' }}>Today's Instructions:</strong>
                <p style={{ marginTop: '8px', color: '#000', fontSize: '14px', lineHeight: '1.5' }}>
                  {todayRoster.instructions}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="shift-card">
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              📅 No roster found for today.
              {user.role === 'admin' && (
                <><br />Please create a weekly roster to get started.</>
              )}
            </p>
          </div>
        )}

        {/* Admin Controls */}
        {user.role === 'admin' && (
          <div style={{ padding: '30px 20px 20px' }}>
            <h3 style={{
              marginBottom: '20px',
              color: '#000000',
              textAlign: 'center',
              fontSize: '18px'
            }}>
              Roster Management
            </h3>
            {!todayRoster ? (
              <button
                onClick={handleCreateRoster}
                className="btn primary"
                style={{ marginBottom: '15px' }}
              >
                📝 Create Weekly Roster
              </button>
            ) : (
              <>
                <button
                  onClick={handleEditRoster}
                  className="btn primary"
                  style={{ marginBottom: '15px' }}
                >
                  ✏️ Edit Current Roster
                </button>
                <button
                  onClick={handleCreateRoster}
                  className="btn secondary"
                  style={{ marginBottom: '15px' }}
                >
                  📝 Create New Roster
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="btn secondary"
            >
              🚪 Logout
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
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRosterWizard } from '../contexts/RosterWizardContext';
import { rosterAPI } from '../services/api';

function RosterCreateReview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    rosterData,
    activeDays,
    dayNames,
    dayLabels,
    saving,
    error,
    setSaving,
    setError,
    getFilteredRosterData,
    previousStep
  } = useRosterWizard();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const finalRosterData = getFilteredRosterData();

      if (Object.keys(finalRosterData).length === 0) {
        setError('Please select at least one day to create a roster.');
        return;
      }

      // Create roster with name and timestamp
      const rosterName = `Weekly Roster - ${new Date().toLocaleDateString()}`;
      const result = await rosterAPI.createRoster(rosterName, finalRosterData, activeDays);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to save roster. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrevious = () => {
    previousStep();
    navigate('/roster/create/step3');
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="mobile-container">
        <div className="header">
          <h1>Access Denied</h1>
          <p>You need administrator privileges to create rosters.</p>
        </div>
        <div style={{ padding: '20px' }}>
          <button onClick={handleCancel} className="btn primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeDaysList = dayNames.filter(day => activeDays[day]);

  return (
    <div className="mobile-container">
      <div className="header">
        <h1>Review & Save Roster</h1>
        <div className="step-indicator">
          <span>Step 4 of 4: Review your weekly roster</span>
        </div>
      </div>

      <div style={{ padding: '20px 0 100px 0' }}>
        {error && (
          <div
            className="error"
            role="alert"
            style={{
              margin: '0 20px 20px 20px',
              padding: '15px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '8px',
              border: '2px solid #f5c6cb'
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={{ padding: '0 20px' }}>
          <h2>Roster Summary</h2>
          <p>Please review your roster before saving:</p>

          {activeDaysList.length === 0 ? (
            <div className="empty-state">
              <p>No days selected. Please go back and select at least one day.</p>
            </div>
          ) : (
            <div className="roster-summary">
              {activeDaysList.map((day) => {
                const dayIndex = dayNames.indexOf(day);
                const dayLabel = dayLabels[dayIndex];
                const dayData = rosterData[day];

                return (
                  <div key={day} className="day-summary">
                    <h3>{dayLabel}</h3>

                    <div className="shift-summary">
                      <h4>10:00 AM - 2:00 PM (Morning)</h4>
                      <ul>
                        {dayData.morning
                          .filter(carer => carer.name.trim())
                          .map((carer, index) => (
                            <li key={index}>{carer.name}</li>
                          ))}
                      </ul>
                      {dayData.morning.filter(carer => carer.name.trim()).length === 0 && (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No carers assigned</p>
                      )}
                    </div>

                    <div className="shift-summary">
                      <h4>6:00 PM - 10:00 PM (Evening)</h4>
                      <ul>
                        {dayData.evening
                          .filter(carer => carer.name.trim())
                          .map((carer, index) => (
                            <li key={index}>{carer.name}</li>
                          ))}
                      </ul>
                      {dayData.evening.filter(carer => carer.name.trim()).length === 0 && (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No carers assigned</p>
                      )}
                    </div>

                    {dayData.instructions && (
                      <div className="instructions-summary">
                        <h4>Instructions</h4>
                        <p>{dayData.instructions}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-actions">
              <button
                type="submit"
                disabled={saving || activeDaysList.length === 0}
                className="btn primary"
              >
                {saving ? 'Saving...' : 'Create Roster'}
              </button>

              <button
                type="button"
                onClick={handlePrevious}
                className="btn secondary"
                disabled={saving}
              >
                Previous
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="btn secondary"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RosterCreateReview;
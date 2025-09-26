import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rosterAPI } from '../services/api';
import { useRosterForm } from '../hooks/useRosterForm';
import RosterForm from './RosterForm';

function RosterCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    rosterData,
    activeDays,
    saving,
    error,
    dayNames,
    dayLabels,
    toggleDay,
    addCarer,
    removeCarer,
    updateCarerName,
    updateInstructions,
    getFilteredRosterData,
    setSaving,
    setError
  } = useRosterForm();

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
          <button onClick={() => navigate('/dashboard')} className="btn primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      background: '#f5f5f5',
      padding: '0',
      margin: '0',
      // Complete override of all constraints
      position: 'static',
      height: 'auto',
      minHeight: 'auto',
      maxHeight: 'none',
      overflow: 'visible',
      border: '3px solid green'
    }}>
      <div className="header">
        <h1>Create Weekly Roster</h1>
        <p>Set up the carer schedule for the upcoming week</p>
      </div>

      <div style={{
        padding: '20px 0 100px 0',
        height: 'auto',
        overflow: 'visible'
      }}>
        <RosterForm
          rosterData={rosterData}
          activeDays={activeDays}
          dayNames={dayNames}
          dayLabels={dayLabels}
          toggleDay={toggleDay}
          addCarer={addCarer}
          removeCarer={removeCarer}
          updateCarerName={updateCarerName}
          updateInstructions={updateInstructions}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          saving={saving}
          error={error}
          submitButtonText="Create Roster"
          showDayToggle={true}
        />
      </div>
    </div>
  );
}

export default RosterCreate;
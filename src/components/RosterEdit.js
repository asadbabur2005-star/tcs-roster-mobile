import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rosterAPI } from '../services/api';
import { useRosterForm } from '../hooks/useRosterForm';
import RosterForm from './RosterForm';

function RosterEdit() {
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
    setInitialData,
    setSaving,
    setError
  } = useRosterForm();

  const [loading, setLoading] = React.useState(true);
  const [rosterId, setRosterId] = React.useState(null);

  useEffect(() => {
    const loadRoster = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await rosterAPI.getCurrentRoster();

        if (result.success && result.data.roster) {
          const roster = result.data.roster;
          setRosterId(roster.id);

          // Set up active days based on existing roster data
          const activeMap = {};
          Object.keys(roster.data).forEach(day => {
            activeMap[day] = true;
          });

          // Fill in missing days as inactive
          dayNames.forEach(day => {
            if (!activeMap[day]) {
              activeMap[day] = false;
            }
          });

          setInitialData(roster.data, activeMap);
        } else {
          alert('No roster found to edit. Redirecting to create a new roster.');
          navigate('/roster/create');
          return;
        }
      } catch (err) {
        setError('Failed to load roster data');
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, [navigate, setInitialData, setError, dayNames]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const finalRosterData = getFilteredRosterData();

      if (Object.keys(finalRosterData).length === 0) {
        setError('Please select at least one day for the roster.');
        return;
      }

      const rosterName = `Updated Roster - ${new Date().toLocaleDateString()}`;
      const result = await rosterAPI.updateRoster(rosterId, rosterName, finalRosterData, activeDays);

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
          <p>You need administrator privileges to edit rosters.</p>
        </div>
        <div style={{ padding: '20px' }}>
          <button onClick={() => navigate('/dashboard')} className="btn primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="header">
          <h1>Edit Roster</h1>
          <p>Loading current roster data...</p>
        </div>
        <div className="mobile-loading">
          <div className="loading-spinner"></div>
          <p>Loading roster...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1>Edit Weekly Roster</h1>
        <p>Update the carer schedule for the current week</p>
      </div>

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
        submitButtonText="Update Roster"
        showDayToggle={true}
      />
    </div>
  );
}

export default RosterEdit;
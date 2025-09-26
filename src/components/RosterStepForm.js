import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRosterWizard } from '../contexts/RosterWizardContext';

function RosterStepForm({
  stepNumber,
  stepTitle,
  stepDays,
  onNext,
  onPrevious,
  onCancel,
  showPrevious = false,
  nextButtonText = 'Next'
}) {
  const { user } = useAuth();
  const {
    rosterData,
    activeDays,
    dayLabels,
    dayNames,
    toggleDay,
    addCarer,
    removeCarer,
    updateCarerName,
    updateInstructions,
    totalSteps,
    error
  } = useRosterWizard();

  if (!user || user.role !== 'admin') {
    return (
      <div className="mobile-container">
        <div className="header">
          <h1>Access Denied</h1>
          <p>You need administrator privileges to create rosters.</p>
        </div>
        <div style={{ padding: '20px' }}>
          <button onClick={onCancel} className="btn primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="mobile-container">
      <div className="header">
        <h1>Create Weekly Roster</h1>
        <div className="step-indicator">
          <span>Step {stepNumber} of {totalSteps}: {stepTitle}</span>
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

        <form onSubmit={handleSubmit}>
          {stepDays.map((day) => {
            const dayIndex = dayNames.indexOf(day);
            const dayLabel = dayLabels[dayIndex];

            return (
              <div key={day} className="day-section">
                <div className="day-header">
                  <div className="day-title">
                    <h2 className="day-name">{dayLabel}</h2>
                    <button
                      type="button"
                      className={`day-toggle ${activeDays[day] ? 'active' : 'inactive'}`}
                      onClick={() => toggleDay(day)}
                      aria-pressed={activeDays[day]}
                    >
                      {activeDays[day] ? 'Skip Day' : 'Include Day'}
                    </button>
                  </div>
                </div>

                {activeDays[day] && (
                  <div className="shifts-container">
                    {/* Morning Shift */}
                    <div className="shift-section">
                      <div className="shift-header">
                        <h3>10:00 AM - 2:00 PM</h3>
                      </div>

                      <div className="carers-list">
                        {rosterData[day].morning.map((carer, carerIndex) => (
                          <div key={carerIndex} className="carer-input">
                            <input
                              type="text"
                              placeholder="Enter carer name"
                              value={carer.name}
                              onChange={(e) => updateCarerName(day, 'morning', carerIndex, e.target.value)}
                              className="carer-name-input"
                              required
                            />
                            {rosterData[day].morning.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCarer(day, 'morning', carerIndex)}
                                className="remove-carer-btn"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addCarer(day, 'morning')}
                        className="add-carer-btn"
                        style={{ marginTop: '10px', width: '100%' }}
                      >
                        + Add Morning Carer
                      </button>
                    </div>

                    {/* Evening Shift */}
                    <div className="shift-section">
                      <div className="shift-header">
                        <h3>6:00 PM - 10:00 PM</h3>
                      </div>

                      <div className="carers-list">
                        {rosterData[day].evening.map((carer, carerIndex) => (
                          <div key={carerIndex} className="carer-input">
                            <input
                              type="text"
                              placeholder="Enter carer name"
                              value={carer.name}
                              onChange={(e) => updateCarerName(day, 'evening', carerIndex, e.target.value)}
                              className="carer-name-input"
                              required
                            />
                            {rosterData[day].evening.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCarer(day, 'evening', carerIndex)}
                                className="remove-carer-btn"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addCarer(day, 'evening')}
                        className="add-carer-btn"
                        style={{ marginTop: '10px', width: '100%' }}
                      >
                        + Add Evening Carer
                      </button>
                    </div>

                    {/* Instructions */}
                    <div className="instructions-section">
                      <label>Instructions:</label>
                      <textarea
                        placeholder="Special instructions for this day..."
                        value={rosterData[day].instructions}
                        onChange={(e) => updateInstructions(day, 'instructions', e.target.value)}
                        rows="3"
                        className="instructions-textarea"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="form-actions">
            <button
              type="submit"
              className="btn primary"
            >
              {nextButtonText}
            </button>

            {showPrevious && (
              <button
                type="button"
                onClick={onPrevious}
                className="btn secondary"
              >
                Previous
              </button>
            )}

            <button
              type="button"
              onClick={onCancel}
              className="btn secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RosterStepForm;
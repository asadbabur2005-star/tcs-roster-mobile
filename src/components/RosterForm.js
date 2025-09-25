import React, { useCallback, useMemo } from 'react';
import {
  generateId,
  announceToScreenReader,
  getShiftAriaLabel,
  getCarerInputAriaLabel,
  getInstructionsAriaLabel,
  handleEnterAsClick
} from '../utils/accessibility';

const RosterForm = ({
  rosterData,
  activeDays,
  dayNames,
  dayLabels,
  toggleDay,
  addCarer,
  removeCarer,
  updateCarerName,
  updateInstructions,
  onSubmit,
  onCancel,
  saving,
  error,
  submitButtonText = 'Save Roster',
  showDayToggle = true
}) => {
  // Memoize expensive calculations
  const formId = useMemo(() => generateId('roster-form'), []);
  const errorId = useMemo(() => generateId('error'), []);

  // Optimize callbacks to prevent unnecessary re-renders
  const handleToggleDay = useCallback((day) => {
    toggleDay(day);
    announceToScreenReader(`${day} ${activeDays[day] ? 'included' : 'excluded'} in roster`);
  }, [toggleDay, activeDays]);

  const handleAddCarer = useCallback((day, shift) => {
    addCarer(day, shift);
    announceToScreenReader(`Carer added to ${day} ${shift} shift`);
  }, [addCarer]);

  const handleRemoveCarer = useCallback((day, shift, index) => {
    removeCarer(day, shift, index);
    announceToScreenReader(`Carer removed from ${day} ${shift} shift`);
  }, [removeCarer]);

  // Enhanced form submission with accessibility announcements
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (error) {
      announceToScreenReader(`Form has errors: ${error}`, 'assertive');
      return;
    }
    onSubmit(e);
  }, [onSubmit, error]);

  return (
    <div role="main" id="main-content" className="mobile-container">
      {error && (
        <div
          id={errorId}
          className="error"
          role="alert"
          aria-live="assertive"
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

      <form
        id={formId}
        onSubmit={handleSubmit}
        aria-describedby={error ? errorId : undefined}
        noValidate
      >
        {dayNames.map((day, index) => {
          const dayLabel = dayLabels[index];

          return (
            <div key={day} className="day-section">
              <div className="day-header">
                <div className="day-title">
                  <h2 className="day-name" id={`${day}-heading`}>{dayLabel}</h2>
                  {showDayToggle && (
                    <button
                      type="button"
                      className={`day-toggle ${activeDays[day] ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleDay(day)}
                      aria-pressed={activeDays[day]}
                      aria-describedby={`${day}-heading`}
                    >
                      {activeDays[day] ? 'Skip Day' : 'Include Day'}
                    </button>
                  )}
                </div>
              </div>

              {activeDays[day] && (
                <div className="shifts-container">
                  {/* Morning Shift */}
                  <div className="shift-section" role="group" aria-labelledby={`${day}-morning-heading`}>
                    <div className="shift-header">
                      <h3 id={`${day}-morning-heading`}>10:00 AM - 2:00 PM</h3>
                    </div>

                    <div className="carers-list" aria-label={getShiftAriaLabel(dayLabel, 'morning', rosterData[day].morning.length)}>
                      {rosterData[day].morning.map((carer, carerIndex) => {
                        const inputId = `${day}-morning-carer-${carerIndex}`;
                        return (
                          <div key={carerIndex} className="carer-input">
                            <label htmlFor={inputId} className="sr-only">
                              {getCarerInputAriaLabel(dayLabel, 'morning', carerIndex)}
                            </label>
                            <input
                              id={inputId}
                              type="text"
                              placeholder="Enter carer name"
                              value={carer.name}
                              onChange={(e) => updateCarerName(day, 'morning', carerIndex, e.target.value)}
                              className="carer-name-input"
                              aria-label={getCarerInputAriaLabel(dayLabel, 'morning', carerIndex)}
                              required
                            />
                            {rosterData[day].morning.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCarer(day, 'morning', carerIndex)}
                                className="remove-carer-btn"
                                aria-label={`Remove carer ${carerIndex + 1} from ${dayLabel} morning shift`}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

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

                  </div>

                  {/* Single Instructions Section */}
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
            disabled={saving}
            className="btn primary"
          >
            {saving ? 'Saving...' : submitButtonText}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="btn secondary"
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RosterForm;
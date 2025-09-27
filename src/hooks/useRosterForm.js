import { useState } from 'react';

// Default roster structure for a day
const createDefaultDay = () => ({
  morning: [{ name: '' }, { name: '' }],
  evening: [{ name: '' }, { name: '' }],
  instructions: ''
});

// Create initial roster data structure
const createInitialRosterData = () => ({
  monday: createDefaultDay(),
  tuesday: createDefaultDay(),
  wednesday: createDefaultDay(),
  thursday: createDefaultDay(),
  friday: createDefaultDay(),
  saturday: createDefaultDay(),
  sunday: createDefaultDay()
});

// Create initial active days state
const createInitialActiveDays = () => ({
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true
});

export const useRosterForm = (initialRosterData = null, initialActiveDays = null) => {
  const [rosterData, setRosterData] = useState(
    initialRosterData || createInitialRosterData()
  );

  const [activeDays, setActiveDays] = useState(
    initialActiveDays || createInitialActiveDays()
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Day names for iteration
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Toggle day active state
  const toggleDay = (day) => {
    const wasActive = activeDays[day];

    setActiveDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));

    // If deactivating a day, ensure it has default structure
    if (wasActive) {
      setRosterData(prev => ({
        ...prev,
        [day]: createDefaultDay()
      }));
    }
  };

  // Add carer to a shift
  const addCarer = (day, shift) => {
    setRosterData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [shift]: [...prev[day][shift], { name: '' }]
      }
    }));
  };

  // Remove carer from a shift
  const removeCarer = (day, shift, index) => {
    setRosterData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [shift]: prev[day][shift].filter((_, i) => i !== index)
      }
    }));
  };

  // Update carer name
  const updateCarerName = (day, shift, index, name) => {
    setRosterData(prev => {
      const newData = { ...prev };
      newData[day] = {
        ...newData[day],
        [shift]: [...newData[day][shift]]
      };
      newData[day][shift][index] = { name };
      return newData;
    });
  };

  // Update instructions
  const updateInstructions = (day, instructionType, value) => {
    setRosterData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [instructionType]: value
      }
    }));
  };

  // Validate roster data
  const validateRoster = () => {
    const errors = [];

    dayNames.forEach(day => {
      if (activeDays[day]) {
        const dayData = rosterData[day];

        // Check if day has structure
        if (!dayData || !dayData.morning || !dayData.evening) {
          errors.push(`${day} is missing required shift data`);
          return;
        }

        // Check for empty carer names
        const hasEmptyMorning = dayData.morning.some(carer => !carer.name.trim());
        const hasEmptyEvening = dayData.evening.some(carer => !carer.name.trim());

        if (hasEmptyMorning) {
          errors.push(`${day} morning shift has empty carer names`);
        }
        if (hasEmptyEvening) {
          errors.push(`${day} evening shift has empty carer names`);
        }

        // Check minimum carers
        if (dayData.morning.length === 0) {
          errors.push(`${day} morning shift needs at least one carer`);
        }
        if (dayData.evening.length === 0) {
          errors.push(`${day} evening shift needs at least one carer`);
        }
      }
    });

    return errors;
  };

  // Get filtered roster data (only active days)
  const getFilteredRosterData = () => {
    const filteredData = {};
    dayNames.forEach(day => {
      if (activeDays[day]) {
        // Filter out empty carer names
        const filteredMorning = rosterData[day].morning.filter(carer => carer.name.trim());
        const filteredEvening = rosterData[day].evening.filter(carer => carer.name.trim());

        filteredData[day] = {
          morning: filteredMorning.length > 0 ? filteredMorning : [{ name: '' }],
          evening: filteredEvening.length > 0 ? filteredEvening : [{ name: '' }],
          instructions: rosterData[day].instructions
        };
      }
    });
    return filteredData;
  };

  // Reset form
  const resetForm = () => {
    setRosterData(createInitialRosterData());
    setActiveDays(createInitialActiveDays());
    setError(null);
    setSaving(false);
  };

  // Set roster data (useful for edit mode)
  const setInitialData = (data, days) => {
    if (data) {
      setRosterData(data);
    }
    if (days) {
      setActiveDays(days);
    }
  };

  return {
    // State
    rosterData,
    activeDays,
    saving,
    error,
    dayNames,
    dayLabels,

    // Actions
    toggleDay,
    addCarer,
    removeCarer,
    updateCarerName,
    updateInstructions,
    validateRoster,
    getFilteredRosterData,
    resetForm,
    setInitialData,
    setSaving,
    setError,

    // Helpers
    createDefaultDay,
    createInitialRosterData,
    createInitialActiveDays
  };
};
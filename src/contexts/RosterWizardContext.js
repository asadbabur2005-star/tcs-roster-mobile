import React, { createContext, useContext, useState } from 'react';
import { useRosterForm } from '../hooks/useRosterForm';

const RosterWizardContext = createContext();

export const useRosterWizard = () => {
  const context = useContext(RosterWizardContext);
  if (!context) {
    throw new Error('useRosterWizard must be used within a RosterWizardProvider');
  }
  return context;
};

export const RosterWizardProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Use the existing roster form hook for state management
  const rosterFormState = useRosterForm();

  const totalSteps = 4;

  const goToStep = (step) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const markStepCompleted = (step) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const isStepCompleted = (step) => {
    return completedSteps.has(step);
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
    rosterFormState.resetForm();
  };

  // Get days for each step
  const getStepDays = (step) => {
    switch (step) {
      case 1:
        return ['monday', 'tuesday'];
      case 2:
        return ['wednesday', 'thursday'];
      case 3:
        return ['friday', 'saturday', 'sunday'];
      case 4:
        return []; // Review step
      default:
        return [];
    }
  };

  const getStepTitle = (step) => {
    switch (step) {
      case 1:
        return 'Monday & Tuesday';
      case 2:
        return 'Wednesday & Thursday';
      case 3:
        return 'Friday, Saturday & Sunday';
      case 4:
        return 'Review & Save';
      default:
        return '';
    }
  };

  const value = {
    // Step management
    currentStep,
    totalSteps,
    completedSteps,
    goToStep,
    nextStep,
    previousStep,
    markStepCompleted,
    isStepCompleted,
    resetWizard,

    // Helper functions
    getStepDays,
    getStepTitle,

    // Roster form state
    ...rosterFormState
  };

  return (
    <RosterWizardContext.Provider value={value}>
      {children}
    </RosterWizardContext.Provider>
  );
};
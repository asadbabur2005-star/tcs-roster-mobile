import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRosterWizard } from '../contexts/RosterWizardContext';
import RosterStepForm from './RosterStepForm';

function RosterCreateStep3() {
  const navigate = useNavigate();
  const { nextStep, previousStep, getStepDays, getStepTitle } = useRosterWizard();

  const handleNext = () => {
    nextStep();
    navigate('/roster/create/review');
  };

  const handlePrevious = () => {
    previousStep();
    navigate('/roster/create/step2');
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const stepDays = getStepDays(3);
  const stepTitle = getStepTitle(3);

  return (
    <RosterStepForm
      stepNumber={3}
      stepTitle={stepTitle}
      stepDays={stepDays}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onCancel={handleCancel}
      showPrevious={true}
      nextButtonText="Review & Save"
    />
  );
}

export default RosterCreateStep3;
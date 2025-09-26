import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRosterWizard } from '../contexts/RosterWizardContext';
import RosterStepForm from './RosterStepForm';

function RosterCreateStep2() {
  const navigate = useNavigate();
  const { nextStep, previousStep, getStepDays, getStepTitle } = useRosterWizard();

  const handleNext = () => {
    nextStep();
    navigate('/roster/create/step3');
  };

  const handlePrevious = () => {
    previousStep();
    navigate('/roster/create/step1');
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const stepDays = getStepDays(2);
  const stepTitle = getStepTitle(2);

  return (
    <RosterStepForm
      stepNumber={2}
      stepTitle={stepTitle}
      stepDays={stepDays}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onCancel={handleCancel}
      showPrevious={true}
      nextButtonText="Continue to Weekend"
    />
  );
}

export default RosterCreateStep2;
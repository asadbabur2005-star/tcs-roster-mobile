import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRosterWizard } from '../contexts/RosterWizardContext';
import RosterStepForm from './RosterStepForm';

function RosterCreateStep1() {
  const navigate = useNavigate();
  const { nextStep, getStepDays, getStepTitle } = useRosterWizard();

  const handleNext = () => {
    nextStep();
    navigate('/roster/create/step2');
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const stepDays = getStepDays(1);
  const stepTitle = getStepTitle(1);

  return (
    <RosterStepForm
      stepNumber={1}
      stepTitle={stepTitle}
      stepDays={stepDays}
      onNext={handleNext}
      onCancel={handleCancel}
      showPrevious={false}
      nextButtonText="Continue to Wednesday & Thursday"
    />
  );
}

export default RosterCreateStep1;
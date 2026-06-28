import { useState, useCallback } from 'react';

export interface OnboardingFormData {
  step1?: Record<string, any>;
  step2?: Record<string, any>;
  step3?: Record<string, any>;
  step4?: Record<string, any>;
  step5?: Record<string, any>;
  step6?: Record<string, any>;
}

export const useOnboardingForm = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingFormData>({});
  const [isDraft, setIsDraft] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<number, string[]>>({});

  const updateStepData = useCallback((step: number, data: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      [`step${step}`]: data
    }));
    // Clear errors for this step when user updates data
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[step];
      return newErrors;
    });
  }, []);

  const goToStep = useCallback((step: number) => {
    // Safety check: Prevent jumping to any other step if Step 1 is not done
    if (step > 1 && !formData.step1) {
      return;
    }
    
    if (step >= 1 && step <= 6) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [formData.step1]);

  const nextStep = useCallback(() => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const setStepError = useCallback((step: number, errorMessages: string[]) => {
    setErrors(prev => ({
      ...prev,
      [step]: errorMessages
    }));
  }, []);

  const clearStepError = useCallback((step: number) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[step];
      return newErrors;
    });
  }, []);

  const getProgressPercentage = useCallback(() => {
    const completedSteps = Object.keys(formData).length;
    return Math.round((completedSteps / 6) * 100);
  }, [formData]);

  const getStepData = useCallback((step: number) => {
    return formData[`step${step}` as keyof OnboardingFormData] || {};
  }, [formData]);

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setFormData({});
    setIsDraft(false);
    setErrors({});
  }, []);

  const getCompleteFormData = useCallback(() => {
    return {
      ...formData.step1,
      ...formData.step2,
      ...formData.step3,
      ...formData.step4,
      documents: formData.step5?.documents || [],
      activation_checklist: formData.step6?.activation_checklist || {},
    };
  }, [formData]);

  return {
    currentStep,
    formData,
    isDraft,
    isLoading,
    errors,
    updateStepData,
    goToStep,
    nextStep,
    prevStep,
    setStepError,
    clearStepError,
    getProgressPercentage,
    getStepData,
    resetForm,
    getCompleteFormData,
    setIsDraft,
    setIsLoading,
    onboardingId,
    setOnboardingId,
  };
};

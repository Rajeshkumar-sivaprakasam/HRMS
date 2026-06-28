'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, ProgressBar, Button, Icon, Alert } from '@/components';
import { Typography } from '@/components';
import { useOnboardingForm } from '../(shell)/employees/add-new/hooks/useOnboardingForm';
import Step1Personal from '../(shell)/employees/add-new/steps/Step1Personal';
import Step2Employment from '../(shell)/employees/add-new/steps/Step2Employment';
import Step3CTC from '../(shell)/employees/add-new/steps/Step3CTC';
import Step4Leave from '../(shell)/employees/add-new/steps/Step4Leave';
import Step5Documents from '../(shell)/employees/add-new/steps/Step5Documents';
import Step6Review from '../(shell)/employees/add-new/steps/Step6Review';
import { employeesApi, onboardingEmpAddApi, type ApiResponse } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function EmployeeAddSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    currentStep,
    formData,
    errors,
    isLoading,
    updateStepData,
    nextStep,
    prevStep,
    goToStep,
    getProgressPercentage,
    getStepData,
    getCompleteFormData,
    setIsLoading,
    onboardingId,
    setOnboardingId,
  } = useOnboardingForm();

  const searchParams = useSearchParams();

  React.useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setOnboardingId(id);
    }
  }, [searchParams, setOnboardingId]);

  const handleStepSubmit = async (stepData: Record<string, any>) => {
    setIsLoading(true);
    try {
      let currentId = onboardingId;

      if (currentStep === 1) {
        if (!currentId) {
          const res: ApiResponse<{ id: string }> = await onboardingEmpAddApi.create(stepData);
          currentId = res.response.id;
          setOnboardingId(currentId);
          router.replace(`?id=${currentId}`, { scroll: false });
        } else {
          await onboardingEmpAddApi.savePersonal(currentId, stepData);
        }
      } else if (currentStep === 2 && currentId) {
        await onboardingEmpAddApi.saveEmployment(currentId, stepData);
      } else if (currentStep === 3 && currentId) {
        await onboardingEmpAddApi.saveCompensation(currentId, stepData);
      } else if (currentStep === 4 && currentId) {
        await onboardingEmpAddApi.saveLeaveOrg(currentId, stepData);
      }

      updateStepData(currentStep, stepData);
      if (currentStep < 6) {
        nextStep();
      }
    } catch (err: any) {
      console.error('Step submission failed:', err);
      alert(err.message || 'Failed to save progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (payload: { notify_by_email: boolean; notify_by_sms: boolean }) => {
    setIsLoading(true);
    try {
      if (!onboardingId) {
        throw new Error('Onboarding session not found. Please complete the first step.');
      }

      await onboardingEmpAddApi.activate(onboardingId, payload);
      router.push('/employees?success=Employee activated successfully');
    } catch (err: any) {
      console.error('Activation failed:', err);
      alert(err.message || 'Failed to activate employee');
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = getProgressPercentage();
  const stepError = errors[currentStep];

  const STEPS = [
    { id: 1, label: t('employee_add.step_personal'),    icon: 'user' },
    { id: 2, label: t('employee_add.step_employment'),  icon: 'briefcase' },
    { id: 3, label: t('employee_add.step_ctc'),         icon: 'credit-card' },
    { id: 4, label: t('employee_add.step_leave'),       icon: 'calendar' },
    { id: 5, label: t('employee_add.step_documents'),   icon: 'file' },
    { id: 6, label: t('employee_add.step_activate'),    icon: 'check' },
  ];

  const SECTION_HEADINGS = [
    t('employee_add.section_personal'),
    t('employee_add.section_employment'),
    t('employee_add.section_ctc'),
    t('employee_add.section_leave'),
    t('employee_add.section_documents'),
    t('employee_add.section_activate'),
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #e2e8f0", padding: "16px 0" }}>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <Icon name="arrow-left" size="sm" />
            </Button>
            <div>
              <Typography variant="caption" color="secondary">
                {t('employee_add.breadcrumb')}
              </Typography>
              <Typography variant="h2" style={{ margin: 0 }}>
                {t('employees.add_employee')}
              </Typography>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "32px 24px" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32 }}
        >
          {/* Sidebar */}
          <div style={{ height: "fit-content", position: "sticky", top: 24 }}>
            <Card style={{ padding: 20 }}>
              {/* Progress */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Typography weight="semibold" style={{ fontSize: 14 }}>
                    {t('employee_add.setup_progress')}
                  </Typography>
                  <Typography weight="bold" style={{ fontSize: 24, lineHeight: 1 }}>
                    {progressPercentage}%
                  </Typography>
                </div>
                <ProgressBar value={progressPercentage} max={100} />
              </div>

              {/* Step List */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {STEPS.map((step) => {
                  const isComplete = Object.keys(formData).length >= step.id;
                  const isActive = currentStep === step.id;

                  return (
                    <button
                      key={step.id}
                      onClick={() => goToStep(step.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px",
                        background: isActive ? "#f0f4ff" : "transparent",
                        border:
                          "1px solid " + (isActive ? "#e0e7ff" : "transparent"),
                        borderRadius: 8,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: isComplete ? "#22c55e" : "#e2e8f0",
                          color: isComplete ? "white" : "#64748b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {isComplete ? "✓" : step.id}
                      </div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <Typography
                          weight={isActive ? "semibold" : "regular"}
                          style={{ fontSize: 13 }}
                        >
                          {step.label}
                        </Typography>
                        {step.id > 1 && (
                          <Typography style={{ fontSize: 11, color: "#64748b" }}>
                            {step.id === 2 && formData.step1
                              ? t('employee_add.hint_employment')
                              : ""}
                            {step.id === 3 && formData.step2
                              ? t('employee_add.hint_ctc')
                              : ""}
                            {step.id === 4 && formData.step3
                              ? t('employee_add.hint_leave')
                              : ""}
                            {step.id === 5 && formData.step4
                              ? t('employee_add.hint_documents')
                              : ""}
                            {step.id === 6 && formData.step5
                              ? t('employee_add.hint_activate')
                              : ""}
                          </Typography>
                        )}
                      </div>
                      {isActive && (
                        <Icon
                          name="chevron-right"
                          size={18}
                          style={{ color: "#6366f1" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main Form */}
          <div>
            <Card style={{ padding: 32 }}>
              <div style={{ marginBottom: 24 }}>
                <Typography
                  variant="caption"
                  color="secondary"
                  weight="semibold"
                  style={{ marginBottom: 4, display: "block" }}
                >
                  {t('employee_add.step_indicator', { step: currentStep, total: 6 })}
                </Typography>
                <Typography variant="h3" style={{ margin: 0, marginBottom: 12 }}>
                  {SECTION_HEADINGS[currentStep - 1]}
                </Typography>
                {stepError && (
                  <Alert variant="error" style={{ marginTop: 12 }}>
                    {stepError[0]}
                  </Alert>
                )}
              </div>

              {/* Step Content */}
              <div style={{ marginBottom: 32 }}>
                {currentStep === 1 && (
                  <Step1Personal
                    initialData={getStepData(1)}
                    onSubmit={handleStepSubmit}
                    onBack={prevStep}
                  />
                )}
                {currentStep === 2 && (
                  <Step2Employment
                    initialData={getStepData(2)}
                    onSubmit={handleStepSubmit}
                    onBack={prevStep}
                    onboardingId={onboardingId}
                  />
                )}
                {currentStep === 3 && (
                  <Step3CTC
                    initialData={getStepData(3)}
                    onSubmit={handleStepSubmit}
                    onBack={prevStep}
                  />
                )}
                {currentStep === 4 && (
                  <Step4Leave
                    initialData={getStepData(4)}
                    onSubmit={handleStepSubmit}
                    onBack={prevStep}
                  />
                )}
                {currentStep === 5 && (
                  <Step5Documents
                    initialData={getStepData(5)}
                    onSubmit={handleStepSubmit}
                    onBack={prevStep}
                    onboardingId={onboardingId}
                  />
                )}
                {currentStep === 6 && (
                  <Step6Review
                    formData={getCompleteFormData()}
                    onActivate={handleActivate}
                    onBack={prevStep}
                    onJumpToStep={goToStep}
                    isLoading={isLoading}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

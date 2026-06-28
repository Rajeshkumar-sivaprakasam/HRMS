'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, ProgressBar, Button, Icon, Text, Heading, Alert } from '@/components';
import { useOnboardingForm } from '../../add-new/hooks/useOnboardingForm';
import Step1Personal from '../../add-new/steps/Step1Personal';
import Step2Employment from '../../add-new/steps/Step2Employment';
import Step3CTC from '../../add-new/steps/Step3CTC';
import Step4Leave from '../../add-new/steps/Step4Leave';
import Step5Documents from '../../add-new/steps/Step5Documents';
import { employeesApi } from '@/lib/api';

const STEPS = [
  { id: 1, label: 'Personal',    icon: 'user' },
  { id: 2, label: 'Employment',  icon: 'briefcase' },
  { id: 3, label: 'CTC & bank',  icon: 'credit-card' },
  { id: 4, label: 'Leave & org', icon: 'calendar' },
  { id: 5, label: 'Documents',   icon: 'file' },
];

/** Map the flat employee API response to per-step initial data */
function mapEmployeeToSteps(emp: any): Record<number, Record<string, any>> {
  return {
    1: {
      first_name:                emp.first_name              ?? '',
      middle_name:               emp.middle_name             ?? '',
      last_name:                 emp.last_name               ?? '',
      date_of_birth:             emp.date_of_birth           ?? '',
      gender:                    emp.gender                  ?? '',
      marital_status:            emp.marital_status          ?? '',
      nationality:               emp.nationality             ?? '',
      blood_group:               emp.blood_group             ?? '',
      pan_number:                emp.pan_number              ?? '',
      personal_email:            emp.personal_email          ?? '',
      mobile_number:             emp.mobile_number           ?? '',
      current_address:           emp.current_address         ?? '',
      permanent_address:         emp.permanent_address       ?? '',
      emergency_contact_name:    emp.emergency_contact_name  ?? '',
      emergency_contact_phone:   emp.emergency_contact_phone ?? '',
      emergency_contact_relation:emp.emergency_contact_relation ?? '',
    },
    2: {
      job_title:              emp.job_title              ?? '',
      job_code:               emp.job_code               ?? '',
      sub_department:         emp.sub_department         ?? '',
      grade_band:             emp.grade_band             ?? '',
      department_id:          emp.department_id          ?? '',
      work_location_id:       emp.work_location_id       ?? '',
      employment_type:        emp.employment_type        ?? '',
      date_of_joining:        emp.date_of_joining        ?? '',
      shift_id:               emp.shift_id               ?? '',
      probation_end_date:     emp.probation_end_date     ?? '',
      notice_period_days:     emp.notice_period_days     ?? '',
      reporting_manager_id:   emp.reporting_manager_id   ?? '',
      buddy_id:               emp.buddy_id               ?? '',
    },
    3: {
      annual_ctc:             emp.annual_ctc              ?? '',
      ctc_effective_from:     emp.ctc_effective_from      ?? '',
      salary_structure_id:    emp.salary_structure_id     ?? '',
      bank_name:              emp.bank_name               ?? '',
      bank_branch:            emp.bank_branch             ?? '',
      account_number:         emp.account_number          ?? '',
      ifsc_code:              emp.ifsc_code               ?? '',
      account_type:           emp.account_type            ?? '',
      // Flatten ctc_breakdown for the form
      ...(emp.ctc_breakdown?.earnings     ? Object.fromEntries(Object.entries(emp.ctc_breakdown.earnings    ).map(([k, v]) => [`earning_${k}`,    v])) : {}),
      ...(emp.ctc_breakdown?.deductions   ? Object.fromEntries(Object.entries(emp.ctc_breakdown.deductions  ).map(([k, v]) => [`deduction_${k}`,  v])) : {}),
      ...(emp.ctc_breakdown?.benefits     ? Object.fromEntries(Object.entries(emp.ctc_breakdown.benefits    ).map(([k, v]) => [`benefit_${k}`,    v])) : {}),
      ...(emp.ctc_breakdown?.compensation ? Object.fromEntries(Object.entries(emp.ctc_breakdown.compensation).map(([k, v]) => [`compensation_${k}`, v])) : {}),
    },
    4: {
      leave_plan:            emp.leave_plan            ?? '',
      holiday_calendar:      emp.holiday_calendar      ?? '',
      cost_centre:           emp.cost_centre           ?? '',
      business_unit:         emp.business_unit         ?? '',
      legal_entity:          emp.legal_entity          ?? '',
      workspace_team:        emp.workspace_team        ?? '',
      // Flatten leave_allocations for per-prefix fields
      casual_leave_balance:  emp.leave_allocations?.CL?.annual_quota   ?? 12,
      casual_leave_period:   'Yearly',
      casual_leave_accrual:  'Monthly',
      sick_leave_balance:    emp.leave_allocations?.SL?.annual_quota    ?? 12,
      sick_leave_period:     'Yearly',
      sick_leave_accrual:    'Monthly',
    },
    5: {},
  };
}

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState('');

  const {
    currentStep,
    formData,
    updateStepData,
    nextStep,
    prevStep,
    goToStep,
    getProgressPercentage,
    getStepData,
    setIsLoading,
  } = useOnboardingForm();

  // Load employee data on mount and pre-fill all steps
  useEffect(() => {
    async function load() {
      try {
        const res = await employeesApi.get(employeeId);
        const emp = res.response;
        setEmployeeName(`${emp.first_name} ${emp.last_name}`);

        const stepMap = mapEmployeeToSteps(emp);
        Object.entries(stepMap).forEach(([step, data]) => {
          updateStepData(Number(step), data);
        });
      } catch (err: any) {
        setPageError(err.message || 'Failed to load employee data.');
      } finally {
        setPageLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const handleStepSubmit = async (stepData: Record<string, any>) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      updateStepData(currentStep, stepData);

      // For the last step (5 = Documents) we save and redirect
      if (currentStep === 5) {
        await employeesApi.update(employeeId, buildUpdatePayload(currentStep, stepData));
        router.push('/employees?success=Employee updated successfully');
        return;
      }

      // Save the relevant section via PUT /v1/employees/{id}
      await employeesApi.update(employeeId, buildUpdatePayload(currentStep, stepData));
      nextStep();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /** Build flat update payload from step data */
  function buildUpdatePayload(step: number, data: Record<string, any>) {
    if (step === 1) return data;
    if (step === 2) return data;
    if (step === 3) return data;   // Step3 already builds ctc_breakdown before calling onSubmit
    if (step === 4) return data;   // Step4 already builds leave_allocations
    return {};
  }

  const progressPercentage = getProgressPercentage();

  if (pageLoading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Text color="secondary">Loading employee data…</Text>
      </div>
    );
  }

  if (pageError) {
    return (
      <div style={{ padding: 40 }}>
        <Alert variant="error" title="Error">{pageError}</Alert>
        <Button variant="ghost" onClick={() => router.back()} style={{ marginTop: 16 }}>
          ← Go back
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <Icon name="arrow-left" size="sm" />
          </Button>
          <div>
            <Text variant="caption" color="secondary">Employees · Edit</Text>
            <Heading level="h2" style={{ margin: 0 }}>
              Edit employee — {employeeName}
            </Heading>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 }}>

          {/* Sidebar */}
          <div style={{ height: 'fit-content', position: 'sticky', top: 24 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text weight="semibold" style={{ fontSize: 14 }}>Edit progress</Text>
                  <Text weight="bold" style={{ fontSize: 24, lineHeight: 1 }}>{progressPercentage}%</Text>
                </div>
                <ProgressBar value={progressPercentage} max={100} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {STEPS.map(step => {
                  const isComplete = Object.keys(formData).length >= step.id;
                  const isActive   = currentStep === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => goToStep(step.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px',
                        background: isActive ? '#f0f4ff' : 'transparent',
                        border: '1px solid ' + (isActive ? '#e0e7ff' : 'transparent'),
                        borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: isComplete ? '#22c55e' : '#e2e8f0',
                        color: isComplete ? 'white' : '#64748b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, flexShrink: 0,
                      }}>
                        {isComplete ? '✓' : step.id}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <Text weight={isActive ? 'semibold' : 'regular'} style={{ fontSize: 13 }}>
                          {step.label}
                        </Text>
                      </div>
                      {isActive && <Icon name="chevron-right" size={18} style={{ color: '#6366f1' }} />}
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
                <Text variant="caption" color="secondary" weight="semibold" style={{ marginBottom: 4, display: 'block' }}>
                  Edit · Step {currentStep} of {STEPS.length}
                </Text>
                <Heading level="h3" style={{ margin: 0, marginBottom: 12 }}>
                  {[
                    'Personal Information',
                    'Employment details',
                    'Compensation & bank details',
                    'Leave policies & organisation',
                    'Documents & KYC',
                  ][currentStep - 1]}
                </Heading>
                {saveError && (
                  <Alert variant="error" style={{ marginTop: 12 }}>{saveError}</Alert>
                )}
              </div>

              <div style={{ marginBottom: 32 }}>
                {currentStep === 1 && (
                  <Step1Personal
                    initialData={getStepData(1)}
                    onSubmit={handleStepSubmit}
                    onBack={() => router.back()}
                  />
                )}
                {currentStep === 2 && (
                  <Step2Employment
                    initialData={getStepData(2)}
                    onSubmit={handleStepSubmit}
                    onBack={prevStep}
                    onboardingId={employeeId}
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
                    isLoading={isSaving}
                  />
                )}
                {currentStep === 5 && (
                  <Step5Documents
                    initialData={getStepData(5)}
                    onSubmit={handleStepSubmit}
                    onBack={prevStep}
                    onboardingId={employeeId}
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

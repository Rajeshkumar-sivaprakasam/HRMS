'use client';

import React, { useState, useEffect } from 'react';
import { FormRenderer, Alert, Card, Text, Button, Heading } from '@/components';
import { STEP4_LEAVE_SCHEMA } from '../schemas/onboardingSchema';
import { dropdownsApi, onboardingApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import styles from './Steps.module.scss';

interface Step4LeaveProps {
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onBack: () => void;
  isLoading?: boolean;
}

// Only CL and SL are shown as editable leave allocation cards
const LEAVE_TYPE_CONFIG: Record<string, { dotColor: string; prefix: string }> = {
  CL: { dotColor: '#FF9500', prefix: 'casual' },
  SL: { dotColor: '#FF3B30', prefix: 'sick' },
};

export default function Step4Leave({ initialData, onSubmit, onBack, isLoading: propIsLoading }: Step4LeaveProps) {
  const params = useParams();
  const onboardingId = params.id as string;
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    if (initialData && Object.keys(initialData).length > 0) return initialData;
    return {
      casual_annual_quota: 12,
      casual_opening_balance: 12,
      sick_annual_quota: 12,
      sick_opening_balance: 12,
    };
  });
  const [showErrors, setShowErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [dropdowns, setDropdowns] = useState({
    leavePolicies: [] as any[],
    holidayCalendars: [] as any[],
    costCentres: [] as any[],
    businessUnits: [] as any[],
    legalEntities: [] as any[],
  });
  const [rawLeavePolicies, setRawLeavePolicies] = useState<any[]>([]);

  // Leave types loaded from API: [{ id: "CL", code: "CL", label: "Cl" }, ...]
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; code: string; label: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [policiesRes, holidaysRes, deptsRes, leaveTypesRes] = await Promise.all([
          dropdownsApi.getLeavePolicies(),
          dropdownsApi.getHolidayCalendar(),
          dropdownsApi.getDepartments(),
          dropdownsApi.getLeaveTypes(),
        ]);

        const mapResponse = (data: any[]) => data.map(item => ({
          value: item.id?.toString() || item.value?.toString() || '',
          label: item.name || item.label || item.title || item.country || item.id?.toString() || 'Select...'
        }));

        setDropdowns({
          leavePolicies: mapResponse(policiesRes.response || []),
          holidayCalendars: mapResponse(holidaysRes.response || []),
          costCentres: mapResponse(deptsRes.response || []),
          businessUnits: mapResponse(deptsRes.response || []),
          legalEntities: mapResponse(deptsRes.response || []),
        });
        setRawLeavePolicies(policiesRes.response || []);

        // Load leave types: [{ id: "CL", code: "CL", label: "Cl" }]
        const types = (leaveTypesRes.response || []) as any[];
        setLeaveTypes(types.map(t => ({
          id: t.id || t.code || t.value,
          code: t.code || t.id || t.value,
          label: t.label || t.name || t.code,
        })));

        if (initialData) {
          setFormValues(prev => ({ ...prev, ...initialData }));
        }
      } catch (error) {
        console.error('Failed to load Step 4 data', error);
        setError('Failed to load form data. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [initialData]);

  const handleChange = (name: string, value: any) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFinalSubmit = async () => {
    setShowErrors(true);
    
    if (!formValues.leave_plan || !formValues.holiday_calendar) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Build leave_allocations dynamically from loaded leave types
      const leave_allocations: Record<string, any> = {};
      leaveTypes.forEach(lt => {
        const config = LEAVE_TYPE_CONFIG[lt.code];
        const prefix = config?.prefix || lt.code.toLowerCase();
        leave_allocations[lt.code] = {
          annual_quota: Number(formValues[`${prefix}_annual_quota`]) || 0,
          opening_balance: Number(formValues[`${prefix}_opening_balance`]) || 0,
          carry_fwd_cap: 0,
        };
      });

      // Fallback: ensure casual & sick always included
      if (!leave_allocations['CL']) {
        leave_allocations['CL'] = {
          annual_quota: Number(formValues.casual_annual_quota) || 0,
          opening_balance: Number(formValues.casual_opening_balance) || 0,
          carry_fwd_cap: 0,
        };
      }
      if (!leave_allocations['SL']) {
        leave_allocations['SL'] = {
          annual_quota: Number(formValues.sick_annual_quota) || 0,
          opening_balance: Number(formValues.sick_opening_balance) || 0,
          carry_fwd_cap: 0,
        };
      }

      const payload = {
        leave_plan: formValues.leave_plan || null,
        holiday_calendar: formValues.holiday_calendar || null,
        leave_allocations,
        cost_centre: formValues.cost_centre || null,
        business_unit: formValues.business_unit || null,
        legal_entity: formValues.legal_entity || null,
        workspace_team: formValues.workspace_team || null,
      };

      if (onboardingId) {
        await onboardingApi.saveLeaveOrg(onboardingId, payload);
      }
      onSubmit(payload);
    } catch (err: any) {
      console.error('Failed to save leave & org', err);
      setError(err.message || 'Failed to save data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const SCHEMA = STEP4_LEAVE_SCHEMA.map(field => {
    if (field.name === 'leave_plan') return { ...field, options: dropdowns.leavePolicies };
    if (field.name === 'holiday_calendar') return { ...field, options: dropdowns.holidayCalendars };
    if (field.name === 'cost_centre') return { ...field, options: dropdowns.costCentres };
    if (field.name === 'business_unit') return { ...field, options: dropdowns.businessUnits };
    if (field.name === 'legal_entity') return { ...field, options: dropdowns.legalEntities };
    return field;
  });

  // Split schema for layout
  const leavePlanFields = SCHEMA.filter(f => ['leave_plan_header', 'leave_plan', 'holiday_calendar'].includes(f.name));

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}><Text>Loading leave configurations...</Text></div>;

  // 1. Identify active codes from selected plan
  const selectedPlanId = formValues.leave_plan;
  const selectedPlan = rawLeavePolicies.find(p => (p.id?.toString() || p.value?.toString()) === selectedPlanId?.toString());
  const planLeaveCodes = selectedPlan?.leave_types 
    ? Object.keys(selectedPlan.leave_types).map(k => k.toUpperCase())
    : [];

  // 2. Decide which codes to show (Plan-specific or default CL/SL)
  const codesToShow = planLeaveCodes.length > 0 ? planLeaveCodes : ['CL', 'SL'];

  // 3. Map codes to full type objects with forced labels for CL and SL
  const finalDisplayTypes = codesToShow.map(code => {
    const existing = leaveTypes.find(lt => lt.code.toUpperCase() === code);
    let label = existing?.label || code;
    
    if (code === 'CL') label = 'Casual Leave';
    if (code === 'SL') label = 'Sick Leave';

    return {
      id: existing?.id || code,
      code: code,
      label: label
    };
  });

  return (
    <div className={styles.stepContainer}>
      {error && (
        <Alert variant="error" title="Error" style={{ marginBottom: 20 }}>
          {error}
        </Alert>
      )}

      {/* LEAVE PLAN SECTION */}
      <FormRenderer
        schema={leavePlanFields as any}
        values={formValues}
        onChange={(n, v, all) => {
          setFormValues(all);
          
          // Auto-fill leave balances when a leave plan is selected
          if (n === 'leave_plan' && v) {
            const selectedPolicy = rawLeavePolicies.find(p => (p.id?.toString() || p.value?.toString()) === v.toString());
            if (selectedPolicy?.leave_types) {
              const updatedValues = { ...all };
              let hasChanges = false;

              Object.entries(LEAVE_TYPE_CONFIG).forEach(([code, config]) => {
                // Case-insensitive lookup for leave type code (e.g., CL, SL)
                let balance = selectedPolicy.leave_types[code];
                if (balance === undefined) {
                  const key = Object.keys(selectedPolicy.leave_types).find(k => k.toUpperCase() === code.toUpperCase());
                  if (key) balance = selectedPolicy.leave_types[key];
                }

                if (balance !== undefined) {
                  updatedValues[`${config.prefix}_annual_quota`] = balance;
                  updatedValues[`${config.prefix}_opening_balance`] = balance;
                  hasChanges = true;
                }
              });

              if (hasChanges) {
                setFormValues(updatedValues);
              }
            }
          }
        }}
        columns={2}
        showAllErrors={showErrors}
        hideActions={true}
      />

      {/* LEAVE TYPES SECTION — dynamic from API */}
      <div style={{ marginTop: 8 }}>
        <Text variant="body2" color="secondary" style={{ marginBottom: 16, display: 'block' }}>
          Enter annual allocation for each leave type
        </Text>
        
        <div className={styles.leaveCardsGrid}>
          {finalDisplayTypes.map(lt => {
            const config = LEAVE_TYPE_CONFIG[lt.code.toUpperCase()] || {
              dotColor: '#8E8E93',
              prefix: lt.code.toLowerCase()
            };
            return (
              <LeaveTypeCard
                key={lt.id}
                title={lt.label}
                dotColor={config.dotColor}
                prefix={config.prefix}
                values={formValues}
                onChange={handleChange}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.stepFooter}>
        <Button variant="ghost" onClick={onBack}>← Previous</Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost">Save draft</Button>
          <Button 
            variant="primary" 
            loading={isSaving || propIsLoading}
            onClick={handleFinalSubmit}
          >
            Save & continue →
          </Button>
        </div>
      </div>
    </div>
  );
}

function LeaveTypeCard({ title, dotColor, prefix, values, onChange }: any) {
  return (
    <div className={styles.leaveCard}>
      <div className={styles.cardHeader}>
        <span className={styles.dot} style={{ backgroundColor: dotColor }} />
        {title}
      </div>
      <div className={styles.cardFields}>
        <div className={styles.fieldGroup}>
          <label>Annual quota</label>
          <input 
            type="number" 
            className={styles.tableInput} 
            value={values[`${prefix}_annual_quota`] || ''} 
            onChange={(e) => onChange(`${prefix}_annual_quota`, e.target.value)}
            style={{ textAlign: 'left' }}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Opening balance</label>
          <input 
            type="number" 
            className={styles.tableInput} 
            value={values[`${prefix}_opening_balance`] || ''} 
            onChange={(e) => onChange(`${prefix}_opening_balance`, e.target.value)}
            style={{ textAlign: 'left' }}
          />
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Card, Text, Button, Icon, Checkbox, Alert } from '@/components';
import { ACTIVATION_CHECKLIST } from '../schemas/onboardingSchema';
import styles from './Steps.module.scss';

interface Step6ReviewProps {
  formData?: Record<string, any>;
  onActivate: (payload: { notify_by_email: boolean; notify_by_sms: boolean }) => void;
  onBack: () => void;
  onJumpToStep: (step: number) => void;
  isLoading?: boolean;
}

export default function Step6Review({ formData, onActivate, onBack, onJumpToStep, isLoading }: Step6ReviewProps) {
  const [activationChecklist, setActivationChecklist] = useState<Record<string, boolean>>({});
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [notifyBySms, setNotifyBySms] = useState(false);

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    setActivationChecklist(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const handleActivate = () => {
    onActivate({ notify_by_email: notifyByEmail, notify_by_sms: notifyBySms });
  };

  const getStepStatus = (stepId: number) => {
    if (!formData) return { complete: false, subtext: '' };
    
    switch (stepId) {
      case 1: // Personal Information
        const s1Required = ['first_name', 'last_name', 'date_of_birth', 'nationality', 'pan_number', 'personal_email', 'mobile_number', 'current_address', 'emergency_contact_name', 'emergency_contact_phone'];
        const s1Missing = s1Required.filter(field => !formData[field]);
        return { 
          complete: s1Missing.length === 0, 
          subtext: s1Missing.length > 0 ? `${s1Missing.length} field${s1Missing.length > 1 ? 's' : ''} missing` : 'All details verified' 
        };
      case 2: // Employment & Manager
        const s2Required = ['job_title', 'department_id', 'work_location_id', 'employment_type', 'date_of_joining', 'reporting_manager_id'];
        const s2Missing = s2Required.filter(field => !formData[field]);
        return { 
          complete: s2Missing.length === 0, 
          subtext: s2Missing.length > 0 ? 'Role or reporting missing' : 'Employment details set' 
        };
      case 3: // CTC & Bank
        const s3Required = ['annual_ctc', 'ctc_effective_from'];
        const s3Missing = s3Required.filter(field => !formData[field]);
        const bankMissing = !formData.bank_name || !formData.account_number;
        return { 
          complete: s3Missing.length === 0, 
          subtext: s3Missing.length > 0 ? 'CTC details missing' : (bankMissing ? 'Bank details pending' : 'Salary & bank verified')
        };
      case 4: // Leave & Org Policies
        const s4Required = ['leave_plan', 'holiday_calendar'];
        const s4Missing = s4Required.filter(field => !formData[field]);
        return { 
          complete: s4Missing.length === 0, 
          subtext: s4Missing.length > 0 ? 'Policies not assigned' : 'Leave & holiday plans set' 
        };
      case 5: // Documents
        const docs = formData.documents || [];
        const uploadedCount = docs.filter((d: any) => d.status === 'uploaded' || d.status === 'verified').length;
        const complete = uploadedCount >= 3; // Minimum required documents
        return { 
          complete, 
          label: `Documents (${uploadedCount} of 6)`, 
          subtext: complete ? 'Required docs uploaded' : 'Pending mandatory uploads' 
        };
      default: return { complete: false, subtext: '' };
    }
  };

  const SETUP_STEPS = [
    { id: 1, label: 'Personal information', step: 1 },
    { id: 2, label: 'Employment & manager', step: 2 },
    { id: 3, label: 'CTC & bank', step: 3 },
    { id: 4, label: 'Leave & org policies', step: 4 },
    { id: 5, label: 'Documents', step: 5 },
  ];

  const employeeName = formData?.first_name ? `${formData.first_name} ${formData.last_name || ''}`.trim() : 'New Employee';
  const employeeTitle = formData?.job_title || 'Employee';
  const joinDateRaw = formData?.date_of_joining;
  const joinDate = joinDateRaw ? new Date(joinDateRaw).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Set joining date';

  return (
    <div className={styles.stepContainer}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: 32, marginBottom: 24 }}>
        {/* Setup Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Text weight="bold" style={{ fontSize: 20, marginBottom: 8 }}>Setup checklist</Text>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SETUP_STEPS.map(item => {
              const status = getStepStatus(item.id);
              const isComplete = status.complete;
              
              return (
                <div 
                  key={item.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: isComplete ? '#ffffff' : '#fefce8',
                    border: `1px solid ${isComplete ? '#f1f5f9' : '#fef3c7'}`,
                    borderRadius: 20,
                    boxShadow: isComplete ? 'none' : '0 2px 4px rgba(251, 191, 36, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: '50%', 
                      background: isComplete ? '#22c55e' : '#f59e0b', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      <Icon name={isComplete ? "check" : "alert-triangle"} size={24} />
                    </div>
                    <div>
                      <Text weight="bold" style={{ fontSize: 16, color: '#1e293b' }}>
                        {status.label || item.label}
                      </Text>
                      <Text color="secondary" style={{ fontSize: 13, marginTop: 2 }}>{status.subtext}</Text>
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => onJumpToStep(item.step)}
                    style={{ 
                      padding: '8px 24px', 
                      height: 'auto', 
                      background: isComplete ? '#f1f5f9' : '#eff6ff', 
                      border: 'none',
                      color: isComplete ? '#475569' : '#1e40af',
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 12
                    }}
                  >
                    {isComplete ? 'Review' : 'Fix'}
                  </Button>
                </div>
              );
            })}
          </div>

        
        </div>

        {/* Join Card & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card style={{ padding: 32, background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', color: 'white', borderRadius: 24, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
            <Text weight="semibold" style={{ fontSize: 12, marginBottom: 12, opacity: 0.8, color: 'white', letterSpacing: '0.05em' }}>JOINS ON</Text>
            <Text weight="bold" style={{ fontSize: 36, lineHeight: 1, marginBottom: 20, color: 'white' }}>
              {joinDate}
            </Text>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 20 }} />
            <Text weight="semibold" style={{ fontSize: 18, marginBottom: 4, color: 'white' }}>
              {employeeName}
            </Text>
            <Text style={{ fontSize: 15, opacity: 0.8, color: 'white' }}>
              {employeeTitle}
            </Text>
          </Card>

          <Card style={{ padding: 24, borderRadius: 20 }}>
            <Text weight="semibold" style={{ marginBottom: 16, fontSize: 16 }}>On activation, we'll</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Send welcome email with login link',
                `Provision corporate email for Finforz`,
                'Add to Slack channels and Google Workspace',
                'Mail the onboarding kit to home address',
                'Schedule Day 1 orientation',
                'Notify the team via #welcomes'
              ].map((action, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Icon name="check" size={12} style={{ color: '#22c55e' }} />
                  </div>
                  <Text style={{ fontSize: 14, color: '#475569' }}>{action}</Text>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
              <Text weight="semibold" style={{ fontSize: 13, color: '#64748b', marginBottom: 10, display: 'block' }}>Notify candidate</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Checkbox
                    id="notify_by_email"
                    checked={notifyByEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotifyByEmail(e.target.checked)}
                  />
                  <label htmlFor="notify_by_email" style={{ cursor: 'pointer' }}>
                    <Text weight="medium" style={{ fontSize: 14, color: '#1e293b' }}>Send welcome email with login link</Text>
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Checkbox
                    id="notify_by_sms"
                    checked={notifyBySms}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotifyBySms(e.target.checked)}
                  />
                  <label htmlFor="notify_by_sms" style={{ cursor: 'pointer' }}>
                    <Text weight="medium" style={{ fontSize: 14, color: '#1e293b' }}>Send SMS notification</Text>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className={styles.stepFooter}>
        <Button variant="ghost" onClick={onBack} style={{ fontWeight: 600 }}>← Previous</Button>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="ghost" style={{ fontWeight: 600 }}>Save draft</Button>
          <Button
            variant="primary"
            onClick={handleActivate}
            disabled={isLoading}
            style={{ minWidth: 180, borderRadius: 12, fontWeight: 700 }}
          >
            {isLoading ? 'Activating...' : 'Activate employee'}
          </Button>
        </div>
      </div>
    </div>
  );
}

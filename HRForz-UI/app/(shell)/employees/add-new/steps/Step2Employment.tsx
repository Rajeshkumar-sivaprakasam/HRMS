'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components';
import { FormRenderer } from '@/components';
import { dropdownsApi, onboardingApi } from '@/lib/api';
import styles from './Steps.module.scss';

interface Step2EmploymentProps {
  onSubmit: (data: Record<string, any>) => void;
  onBack: () => void;
  initialData?: Record<string, any>;
  onboardingId?: string | null;
}

export default function Step2Employment({ onSubmit, onBack, initialData, onboardingId }: Step2EmploymentProps) {
  
  const [formValues, setFormValues] = useState<Record<string, any>>(initialData || {});
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [deptRes, locRes, empRes, mgrRes, desigRes] = await Promise.all([
          dropdownsApi.getDepartments(),
          dropdownsApi.getWorkLocations(),
          dropdownsApi.getEmploymentTypes(),
          dropdownsApi.getManagers(),
          dropdownsApi.getDesignations()
        ]);
        
        const mapResponse = (data: any[]) => data.map(item => ({
          value: item.id?.toString() || item.value?.toString() || '',
          label: item.name || item.label || ''
        }));

        setDepartments(mapResponse(deptRes.response || []));
        setLocations(mapResponse(locRes.response || []));
        setEmploymentTypes(mapResponse(empRes.response || []));
        setManagers(mapResponse(mgrRes.response || []));
        setDesignations(mapResponse(desigRes.response || []));
      } catch (error) {
        console.error('Failed to load dropdowns', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDropdowns();
  }, []);

  const FORM_SCHEMA = [
    {
      name: "profile_picture_url",
      label: "Profile photo",
      fieldType: "FNProfilePhoto",
      colSpan: "full",
      helperText: "JPG or PNG, max 2MB. Square crops work best.",
    },
    {
      fieldType: "FNDivider",
      label: "Position",
      variant: "subheading",
      name: "position_header",
    },
    {
      name: "job_title",
      label: "Job title",
      fieldType: "FNSelect",
      placeholder: "Select designation...",
      options: designations,
      required: true,
      colSpan: 1,
    },
    {
      name: "job_code",
      label: "Job code",
      fieldType: "FNInput",
      placeholder: "Enter code",
      colSpan: 1,
    },
    {
      name: "department_id",
      label: "Department",
      fieldType: "FNSelect",
      placeholder: "Select...",
      options: departments,
      required: true,
      colSpan: 1,
    },
    {
      name: "sub_department",
      label: "Sub-department",
      fieldType: "FNInput",
      placeholder: "e.g. Platform Engineering",
      colSpan: 1,
    },
    {
      name: "grade_band",
      label: "Grade / band",
      fieldType: "FNInput",
      placeholder: "e.g. L4",
      colSpan: 1,
    },
    {
      fieldType: "FNDivider",
      label: "Schedule & location",
      variant: "subheading",
      name: "schedule_header",
    },
    {
      name: "work_location_id",
      label: "Work location",
      fieldType: "FNSelect",
      placeholder: "Select...",
      options: locations,
      required: true,
      colSpan: 1,
    },
    {
      name: "employment_type",
      label: "Employment type",
      fieldType: "FNSelect",
      placeholder: "Select...",
      options: employmentTypes,
      required: true,
      colSpan: 1,
    },
    {
      name: "date_of_joining",
      label: "Date of joining",
      fieldType: "FNInput",
      type: "date",
      required: true,
      validations: {
        min: new Date().toISOString().split('T')[0],
      },
      colSpan: 1,
    },
    {
      name: "probation_end_date",
      label: "Probation end date",
      fieldType: "FNInput",
      type: "date",
      colSpan: 1,
    },
    {
      name: "notice_period_days",
      label: "Notice period (days)",
      fieldType: "FNInput",
      type: "number",
      placeholder: "e.g. 90",
      colSpan: 1,
    },
    {
      fieldType: "FNDivider",
      label: "Reporting",
      variant: "subheading",
      name: "reporting_header",
    },
    {
      name: "reporting_manager_id",
      label: "Reports to (manager)",
      fieldType: "FNAutocomplete",
      placeholder: "Search manager...",
      options: managers,
      required: true,
      colSpan: 1,
    },
    {
      name: "buddy_id",
      label: "Buddy / mentor",
      fieldType: "FNAutocomplete",
      placeholder: "Search employee...",
      options: managers,
      colSpan: 1,
    },
  ];

  const handleFormChange = async (name: string, value: any, allValues: any) => {
    setFormValues(allValues);
    
    if (name === 'profile_picture_url' && value instanceof File && onboardingId) {
      try {
        const res = await onboardingApi.uploadPhoto(onboardingId, value);
        // Update the form value with the returned URL so it's not sent as an empty object File
        if (res.response?.url || res.response?.profile_picture_url) {
          const photoUrl = res.response.url || res.response.profile_picture_url;
          setFormValues(prev => ({
            ...prev,
            profile_picture_url: photoUrl
          }));
        }
      } catch (error) {
        console.error('Failed to upload photo', error);
      }
    }
  };

  const handleSubmit = (data: Record<string, any>) => {
    // Send the full data including profile_picture_url
    onSubmit(data);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className={styles.stepContainer}>
      <FormRenderer
        schema={FORM_SCHEMA as any}
        onSubmit={handleSubmit}
        onChange={handleFormChange}
        values={formValues}
        columns={3}
        hideActions={true}
      />

      <div className={styles.stepFooter}>
        <Button variant="ghost" onClick={onBack}>← Previous</Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost">Save draft</Button>
          <Button 
            variant="primary" 
            onClick={() => (document.querySelector('form[data-testid="form-renderer"]') as HTMLFormElement)?.requestSubmit()}
          >
            Save & continue →
          </Button>
        </div>
      </div>
    </div>
  );
}

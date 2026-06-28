'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components';
import { FormRenderer } from '@/components';
import { dropdownsApi } from '@/lib/api';
import styles from './Steps.module.scss';

interface Step1PersonalProps {
  onSubmit: (data: Record<string, any>) => void;
  onBack: () => void;
  initialData?: Record<string, any>;
}

export default function Step1Personal({ onSubmit, onBack, initialData }: Step1PersonalProps) {
  const [genderOptions, setGenderOptions] = useState<any[]>([]);
  const [maritalOptions, setMaritalOptions] = useState<any[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [relationOptions, setRelationOptions] = useState<any[]>([]);
  const [bloodGroupOptions, setBloodGroupOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const safeFetch = async (apiCall: () => Promise<any>, fallback: any[]) => {
          try {
            const res = await apiCall();
            return mapResponse(res.response || []);
          } catch (e) {
            console.warn('API fetch failed, using fallback', e);
            return fallback;
          }
        };

        const mapResponse = (data: any[]) => data.map(item => ({
          value: item.id?.toString() || item.value?.toString() || '',
          label: item.name || item.label || ''
        }));

        const [genders, maritals, nationalities, relations, bloods] = await Promise.all([
          safeFetch(dropdownsApi.getGender, [
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
            { value: 'Other', label: 'Other' }
          ]),
          safeFetch(dropdownsApi.getMaritalStatus, [
            { value: 'Single', label: 'Single' },
            { value: 'Married', label: 'Married' },
            { value: 'Divorced', label: 'Divorced' },
            { value: 'Widowed', label: 'Widowed' }
          ]),
          safeFetch(dropdownsApi.getNationality, [
            { value: 'Indian', label: 'Indian' },
            { value: 'Other', label: 'Other' }
          ]),
          safeFetch(dropdownsApi.getRelationship, [
            { value: 'Father', label: 'Father' },
            { value: 'Mother', label: 'Mother' },
            { value: 'Spouse', label: 'Spouse' },
            { value: 'Sibling', label: 'Sibling' },
            { value: 'Other', label: 'Other' }
          ]),
          safeFetch(dropdownsApi.getBloodGroups, [
            { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
            { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
            { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
            { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }
          ])
        ]);

        setGenderOptions(genders);
        setMaritalOptions(maritals);
        setNationalityOptions(nationalities);
        setRelationOptions(relations);
        setBloodGroupOptions(bloods);
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
      name: "first_name",
      label: "First name",
      fieldType: "FNInput",
      placeholder: "e.g. Aarav",
      required: true,
      colSpan: 1,
    },
    {
      name: "middle_name",
      label: "Middle name",
      fieldType: "FNInput",
      placeholder: "",
      colSpan: 1,
    },
    {
      name: "last_name",
      label: "Last name",
      fieldType: "FNInput",
      placeholder: "e.g. Sharma",
      required: true,
      colSpan: 1,
    },
    {
      name: "date_of_birth",
      label: "Date of birth",
      fieldType: "FNInput",
      type: "date",
      placeholder: "DD MMM YYYY",
      required: true,
      validations: {
        max: new Date().toISOString().split('T')[0],
      },
      colSpan: 1,
    },
    {
      name: "gender",
      label: "Gender",
      fieldType: "FNSelect",
      placeholder: "Select...",
      options: genderOptions,
      colSpan: 1,
    },
    {
      name: "marital_status",
      label: "Marital status",
      fieldType: "FNSelect",
      placeholder: "Select...",
      options: maritalOptions,
      colSpan: 1,
    },
    {
      name: "nationality",
      label: "Nationality",
      fieldType: "FNSelect",
      placeholder: "Select...",
      // options: nationalityOptions,
      options: [
        { value: 'Indian', label: 'Indian' },
        { value: 'Other', label: 'Other' },
      ],
      required: true,
      colSpan: 1,
    },
    {
      name: "blood_group",
      label: "Blood group",
      fieldType: "FNSelect",
      placeholder: "Select...",
      options: bloodGroupOptions,
      colSpan: 1,
    },
    {
      name: "pan_number",
      label: "PAN",
      fieldType: "FNInput",
      placeholder: "ABCDE1234F",
      required: true,
      validations: {
        maxLength: 10,
        minLength: 10,
      },
      colSpan: 1,
    },
    {
      fieldType: "FNDivider",
      label: "Contact",
      variant: "subheading",
      name: "contact_header",
    },
    {
      name: "personal_email",
      label: "Personal email",
      fieldType: "FNInput",
      type: "email",
      placeholder: "name@example.com",
      required: true,
      validations: {
        email: true,
      },
      colSpan: 2,
    },
    {
      name: "mobile_number",
      label: "Mobile number",
      fieldType: "FNInput",
      type: "number",
      placeholder: "Enter 10 digit mobile number",
      required: true,
      colSpan: 1,
      validations: { 
        minLength: 10,
        maxLength: 10
      },
    },
    {
      name: "current_address",
      label: "Current address",
      fieldType: "FNInput",
      type: "textarea",
      placeholder: "Enter your current address",
      required: true,
      colSpan: "full",
    },
    {
      name: "permanent_address",
      label: "Permanent address",
      fieldType: "FNInput",
      type: "textarea",
      placeholder: "Enter your permanent address",
      colSpan: "full",
    },
    {
      fieldType: "FNDivider",
      label: "Emergency contact",
      variant: "subheading",
      name: "emergency_header",
    },
    {
      name: "emergency_contact_name",
      label: "Name",
      fieldType: "FNInput",
      placeholder: "Emergency contact name",
      required: true,
      colSpan: 1,
    },
    {
      name: "emergency_contact_relation",
      label: "Relationship",
      fieldType: "FNSelect",
      placeholder: "Select...",
      options: relationOptions,
      colSpan: 1,
    },
    {
      name: "emergency_contact_phone",
      label: "Phone",
      fieldType: "FNInput",
      type: "number",
      placeholder: "Enter 10 digit phone number",
      required: true,
      colSpan: 1,
      validations: { 
        minLength: 10,
        maxLength: 10
      },
    },
  ];


  if (isLoading) return <div>Loading...</div>;

  return (
    <div className={styles.stepContainer}>
      <FormRenderer
        schema={FORM_SCHEMA as any}
        onSubmit={onSubmit}
        defaultValues={initialData}
        columns={3}
        hideActions={true}
      />

      <div className={styles.stepFooter}>
        <Button variant="ghost" onClick={onBack} disabled>← Previous</Button>
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

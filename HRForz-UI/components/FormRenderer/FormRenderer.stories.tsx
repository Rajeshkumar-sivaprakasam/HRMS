import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { FormRenderer } from './FormRenderer';
import type { FormField } from './types';

const meta: Meta<typeof FormRenderer> = {
  title: 'Components/FormRenderer',
  component: FormRenderer,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof FormRenderer>;

// ─── 1. Registration form ─────────────────────────────────────────────────────
const registrationSchema: FormField[] = [
  { fieldType: 'FNDivider', name: 'sec-personal', label: 'Personal Information', variant: 'heading' },

  {
    fieldType: 'FNInput', name: 'firstName', label: 'First Name', required: true,
    validations: { minLength: { value: 2, message: 'First name must be at least 2 characters' } },
    errors: { required: 'First name is required' },
    placeholder: 'John',
  },
  {
    fieldType: 'FNInput', name: 'lastName', label: 'Last Name', required: true,
    validations: { minLength: 2 },
    placeholder: 'Doe',
  },
  {
    fieldType: 'FNInput', name: 'email', label: 'Email Address', type: 'email', required: true,
    validations: { email: true },
    errors: { required: 'Email is required', email: 'Please enter a valid email address' },
    placeholder: 'john@example.com',
    colSpan: 2,
  },
  {
    fieldType: 'FNInput', name: 'phone', label: 'Phone Number', type: 'tel', required: true,
    validations: { pattern: { value: '^[+]?[0-9]{7,15}$', message: 'Enter a valid phone number' } },
    placeholder: '+1234567890',
  },
  {
    fieldType: 'FNSelect', name: 'country', label: 'Country', required: true,
    errors: { required: 'Please select your country' },
    options: [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'in', label: 'India' },
      { value: 'au', label: 'Australia' },
      { value: 'ca', label: 'Canada' },
    ],
  },

  { fieldType: 'FNDivider', name: 'sec-account', label: 'Account Security', variant: 'heading' },

  {
    fieldType: 'FNInput', name: 'password', label: 'Password', type: 'password', required: true,
    validations: { minLength: { value: 8, message: 'Password must be at least 8 characters' } },
    helperText: 'Minimum 8 characters',
    placeholder: '••••••••',
  },
  {
    fieldType: 'FNInput', name: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true,
    validations: {
      custom: [{
        key: 'passwordMatch',
        validate: (value, allValues) => value === allValues.password,
        message: 'Passwords do not match',
      }],
    },
    errors: { required: 'Please confirm your password' },
    placeholder: '••••••••',
  },

  { fieldType: 'FNDivider', name: 'sec-about', label: 'About You', variant: 'heading' },

  {
    fieldType: 'FNTextarea', name: 'bio', label: 'Short Bio',
    validations: { maxLength: { value: 300, message: 'Bio cannot exceed 300 characters' } },
    showCharCount: true,
    placeholder: 'Tell us a bit about yourself...',
    colSpan: 2,
  },
  {
    fieldType: 'FNAutocomplete', name: 'skills', label: 'Skills', multiple: true, clearable: true,
    options: [
      { value: 'react', label: 'React' }, { value: 'typescript', label: 'TypeScript' },
      { value: 'node', label: 'Node.js' }, { value: 'python', label: 'Python' },
      { value: 'go', label: 'Go' }, { value: 'rust', label: 'Rust' },
      { value: 'docker', label: 'Docker' }, { value: 'k8s', label: 'Kubernetes' },
    ],
    placeholder: 'Add skills...',
    colSpan: 2,
  },

  { fieldType: 'FNDivider', name: 'sec-prefs', label: 'Preferences', variant: 'heading' },

  {
    fieldType: 'FNToggle', name: 'newsletter',
    label: 'Subscribe to newsletter',
    helperText: 'Receive product updates and tips',
  },
  {
    fieldType: 'FNToggle', name: 'marketing',
    label: 'Marketing emails',
    helperText: 'Allow us to contact you for promotions',
  },
  {
    fieldType: 'FNCheckbox', name: 'terms', label: 'I agree to the Terms & Conditions', required: true,
    errors: { required: 'You must accept the terms to proceed' },
    colSpan: 'full',
  },
];

export const RegistrationForm: Story = {
  render: () => {
    const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
    return (
      <div style={{ maxWidth: 720 }}>
        <FormRenderer
          schema={registrationSchema}
          columns={2}
          submitLabel="Create Account"
          showReset
          onSubmit={values => setSubmitted(values)}
        />
        {submitted && (
          <pre style={{ marginTop: 16, padding: 12, background: '#f1f5f9', borderRadius: 6, fontSize: 12, overflow: 'auto' }}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </div>
    );
  },
};

// ─── 2. Conditional / dependent fields ───────────────────────────────────────
const conditionalSchema: FormField[] = [
  {
    fieldType: 'FNRadio', name: 'employmentType', label: 'Employment Status', required: true,
    options: [
      { value: 'employed', label: 'Employed' },
      { value: 'self-employed', label: 'Self-Employed' },
      { value: 'student', label: 'Student' },
      { value: 'other', label: 'Other' },
    ],
    direction: 'horizontal',
    colSpan: 'full',
  },
  {
    fieldType: 'FNInput', name: 'companyName', label: 'Company Name', required: true,
    placeholder: 'Acme Corp',
    condition: { dependsOn: 'employmentType', showWhen: 'employed' },
  },
  {
    fieldType: 'FNInput', name: 'jobTitle', label: 'Job Title',
    placeholder: 'Senior Engineer',
    condition: { dependsOn: 'employmentType', showWhen: 'employed' },
  },
  {
    fieldType: 'FNInput', name: 'businessName', label: 'Business Name', required: true,
    placeholder: 'My Consulting LLC',
    condition: { dependsOn: 'employmentType', showWhen: 'self-employed' },
  },
  {
    fieldType: 'FNSelect', name: 'businessType', label: 'Business Type',
    options: [
      { value: 'sole-trader', label: 'Sole Trader' },
      { value: 'llc', label: 'LLC' },
      { value: 'partnership', label: 'Partnership' },
    ],
    condition: { dependsOn: 'employmentType', showWhen: 'self-employed' },
  },
  {
    fieldType: 'FNInput', name: 'university', label: 'University / School', required: true,
    placeholder: 'MIT',
    condition: { dependsOn: 'employmentType', showWhen: 'student' },
  },
  {
    fieldType: 'FNInput', name: 'course', label: 'Course / Major',
    placeholder: 'Computer Science',
    condition: { dependsOn: 'employmentType', showWhen: 'student' },
  },
  {
    fieldType: 'FNTextarea', name: 'otherDetails', label: 'Please describe',
    placeholder: 'Tell us about your situation...',
    condition: { dependsOn: 'employmentType', showWhen: 'other' },
    colSpan: 2,
  },
  {
    fieldType: 'FNInput', name: 'annualIncome', label: 'Annual Income (USD)', type: 'number',
    validations: { min: { value: 0, message: 'Income cannot be negative' } },
    placeholder: '50000',
    // Disable for students
    condition: { dependsOn: 'employmentType', disableWhen: 'student' },
    helperText: 'Disabled for students',
  },
];

export const ConditionalFields: Story = {
  render: () => (
    <div style={{ maxWidth: 600 }}>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
        Select an employment status to see dependent fields appear and disappear.
      </p>
      <FormRenderer schema={conditionalSchema} columns={2} submitLabel="Continue" />
    </div>
  ),
};

// ─── 3. Validation showcase ───────────────────────────────────────────────────
const validationSchema: FormField[] = [
  {
    fieldType: 'FNInput', name: 'username', label: 'Username', required: true,
    validations: {
      minLength: { value: 3, message: 'Username must be at least 3 characters' },
      maxLength: { value: 20, message: 'Username cannot exceed 20 characters' },
      pattern: { value: '^[a-z0-9_]+$', message: 'Only lowercase letters, numbers and underscores' },
    },
    helperText: '3–20 chars, lowercase + numbers + underscores only',
  },
  {
    fieldType: 'FNInput', name: 'age', label: 'Age', type: 'number', required: true,
    validations: {
      min: { value: 18, message: 'You must be at least 18 years old' },
      max: { value: 120, message: 'Please enter a valid age' },
    },
  },
  {
    fieldType: 'FNInput', name: 'website', label: 'Website', type: 'url',
    validations: {
      pattern: { value: '^https?://.+', message: 'URL must start with http:// or https://' },
    },
    placeholder: 'https://example.com',
  },
  {
    fieldType: 'FNInput', name: 'promoCode', label: 'Promo Code',
    validations: {
      pattern: { value: '^[A-Z]{4}[0-9]{4}$', message: 'Code format: 4 uppercase letters + 4 digits (e.g. SAVE2024)' },
    },
    placeholder: 'SAVE2024',
  },
];

export const ValidationShowcase: Story = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
        Click <strong>Validate</strong> to trigger all errors at once.
      </p>
      <FormRenderer
        schema={validationSchema}
        columns={2}
        submitLabel="Validate"
        showAllErrors={false}
      />
    </div>
  ),
};

// ─── 4. All field types ───────────────────────────────────────────────────────
const allFieldsSchema: FormField[] = [
  { fieldType: 'FNDivider', name: 'd1', label: 'Input Types', variant: 'heading' },
  { fieldType: 'FNInput',    name: 'text',     label: 'Text Input',     type: 'text',     placeholder: 'Text...' },
  { fieldType: 'FNInput',    name: 'email',    label: 'Email Input',    type: 'email',    placeholder: 'email@example.com' },
  { fieldType: 'FNInput',    name: 'password', label: 'Password Input', type: 'password', placeholder: '••••••••' },
  { fieldType: 'FNInput',    name: 'number',   label: 'Number Input',   type: 'number',   placeholder: '0' },

  { fieldType: 'FNDivider', name: 'd2', label: 'Multi-line & Selection', variant: 'heading' },
  { fieldType: 'FNTextarea',     name: 'bio',      label: 'Textarea',     placeholder: 'Type here...', showCharCount: true, validations: { maxLength: 200 }, colSpan: 2 },
  { fieldType: 'FNSelect',       name: 'country',  label: 'Select',       options: [{ value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }] },
  { fieldType: 'FNAutocomplete', name: 'skills',   label: 'Autocomplete', multiple: true, clearable: true, options: [{ value: 'react', label: 'React' }, { value: 'vue', label: 'Vue' }, { value: 'angular', label: 'Angular' }] },

  { fieldType: 'FNDivider', name: 'd3', label: 'Boolean Controls', variant: 'heading' },
  {
    fieldType: 'FNCheckbox', name: 'langs', label: 'Languages',
    options: [{ value: 'en', label: 'English' }, { value: 'fr', label: 'French' }, { value: 'de', label: 'German' }],
    direction: 'horizontal',
  },
  {
    fieldType: 'FNRadio', name: 'size', label: 'T-Shirt Size',
    options: [{ value: 's', label: 'S' }, { value: 'm', label: 'M' }, { value: 'l', label: 'L' }, { value: 'xl', label: 'XL' }],
    direction: 'horizontal',
  },
  { fieldType: 'FNToggle',   name: 'newsletter', label: 'Subscribe to newsletter' },
  { fieldType: 'FNCheckbox', name: 'terms',      label: 'Accept terms & conditions' },
];

export const AllFieldTypes: Story = {
  render: () => {
    const [vals, setVals] = useState<Record<string, unknown>>({});
    return (
      <div style={{ maxWidth: 680 }}>
        <FormRenderer
          schema={allFieldsSchema}
          columns={2}
          onChange={(_, __, formValues) => setVals(formValues)}
          submitLabel="Submit All"
        />
        <pre style={{ marginTop: 16, padding: 12, background: '#f1f5f9', borderRadius: 6, fontSize: 11, overflow: 'auto' }}>
          {JSON.stringify(vals, null, 2)}
        </pre>
      </div>
    );
  },
};

// ─── 5. Fieldset (nested sections) ───────────────────────────────────────────
const fieldsetSchema: FormField[] = [
  {
    fieldType: 'FNFieldset', name: 'billing', title: 'Billing Address',
    fields: [
      { fieldType: 'FNInput', name: 'billStreet',  label: 'Street',  required: true, colSpan: 2 },
      { fieldType: 'FNInput', name: 'billCity',    label: 'City',    required: true },
      { fieldType: 'FNInput', name: 'billZip',     label: 'ZIP',     required: true },
      { fieldType: 'FNSelect', name: 'billCountry', label: 'Country', required: true, options: [{ value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }] },
    ],
  },
  {
    fieldType: 'FNToggle', name: 'sameAddress', label: 'Shipping address same as billing',
    colSpan: 'full',
  },
  {
    fieldType: 'FNFieldset', name: 'shipping', title: 'Shipping Address',
    condition: { dependsOn: 'sameAddress', hideWhen: true },
    fields: [
      { fieldType: 'FNInput', name: 'shipStreet',  label: 'Street',  required: true, colSpan: 2 },
      { fieldType: 'FNInput', name: 'shipCity',    label: 'City',    required: true },
      { fieldType: 'FNInput', name: 'shipZip',     label: 'ZIP',     required: true },
      { fieldType: 'FNSelect', name: 'shipCountry', label: 'Country', required: true, options: [{ value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }] },
    ],
  },
];

export const FieldsetSections: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
        Toggle "Shipping address same as billing" to hide the shipping section.
      </p>
      <FormRenderer schema={fieldsetSchema} columns={2} submitLabel="Place Order" />
    </div>
  ),
};

// ─── 6. Single-column layout ──────────────────────────────────────────────────
export const SingleColumn: Story = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <FormRenderer
        schema={[
          { fieldType: 'FNInput',  name: 'email',    label: 'Email',    type: 'email',    required: true, validations: { email: true } },
          { fieldType: 'FNInput',  name: 'password', label: 'Password', type: 'password', required: true, validations: { minLength: 8 } },
          { fieldType: 'FNCheckbox', name: 'remember', label: 'Remember me' },
        ]}
        columns={1}
        submitLabel="Sign In"
      />
    </div>
  ),
};

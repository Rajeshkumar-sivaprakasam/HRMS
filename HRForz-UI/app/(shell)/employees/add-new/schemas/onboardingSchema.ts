// Step 1: Personal Information
export const STEP1_PERSONAL_SCHEMA = [
  {
    fieldType: 'FNDivider',
    label: 'Profile photo',
    variant: 'heading',
    name: 'profile_header'
  },
  {
    name: 'profile_photo',
    label: 'Profile Photo',
    fieldType: 'FNInput',
    type: 'file',
    accept: 'image/*',
    colSpan: 'full',
    helperText: 'JPG or PNG, max 2MB. Square crops work best.'
  },
  {
    fieldType: 'FNDivider',
    label: 'Identity',
    variant: 'heading',
    name: 'identity_header'
  },
  {
    name: 'first_name',
    label: 'First name *',
    fieldType: 'FNInput',
    placeholder: 'e.g. Aarav',
    validations: { required: true },
  },
  {
    name: 'middle_name',
    label: 'Middle name',
    fieldType: 'FNInput',
    placeholder: 'e.g. Kumar',
  },
  {
    name: 'last_name',
    label: 'Last name *',
    fieldType: 'FNInput',
    placeholder: 'e.g. Sharma',
    validations: { required: true },
  },
  {
    name: 'date_of_birth',
    label: 'Date of birth *',
    fieldType: 'FNInput',
    type: 'date',
    placeholder: 'DD MMM YYYY',
    validations: { required: true },
  },
  {
    name: 'gender',
    label: 'Gender',
    fieldType: 'FNSelect',
    options: [
      { label: 'Select...', value: '' },
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' },
      { label: 'Other', value: 'other' },
    ],
  },
  {
    name: 'marital_status',
    label: 'Marital status',
    fieldType: 'FNSelect',
    options: [
      { label: 'Select...', value: '' },
      { label: 'Single', value: 'single' },
      { label: 'Married', value: 'married' },
      { label: 'Divorced', value: 'divorced' },
      { label: 'Widowed', value: 'widowed' },
    ],
  },
  {
    name: 'nationality',
    label: 'Nationality *',
    fieldType: 'FNInput',
    placeholder: 'e.g. Indian',
    validations: { required: true },
  },
  {
    name: 'blood_group',
    label: 'Blood group',
    fieldType: 'FNSelect',
    options: [
      { label: 'Select...', value: '' },
      { label: 'A+', value: 'A+' },
      { label: 'A-', value: 'A-' },
      { label: 'B+', value: 'B+' },
      { label: 'B-', value: 'B-' },
      { label: 'AB+', value: 'AB+' },
      { label: 'AB-', value: 'AB-' },
      { label: 'O+', value: 'O+' },
      { label: 'O-', value: 'O-' },
    ],
  },
  {
    name: 'pan_number',
    label: 'PAN *',
    fieldType: 'FNInput',
    placeholder: 'ABCDE1234F',
    validations: { required: true },
  },
  {
    fieldType: 'FNDivider',
    label: 'Contact',
    variant: 'heading',
    name: 'contact_header'
  },
  {
    name: 'personal_email',
    label: 'Personal email *',
    fieldType: 'FNInput',
    type: 'email',
    placeholder: 'name@example.com',
    colSpan: 'full',
    validations: { required: true, email: true },
  },
  {
    name: 'mobile_number',
    label: 'Mobile number',
    fieldType: 'FNInput',
    placeholder: 'Enter 10 digit mobile number',
    validations: { 
      required: true,
      minLength: 10,
      maxLength: 10
    },
  },
  {
    name: 'current_address',
    label: 'Current address *',
    fieldType: 'FNInput',
    placeholder: 'Enter your current address',
    colSpan: 'full',
    validations: { required: true },
  },
  {
    name: 'permanent_address',
    label: 'Permanent address',
    fieldType: 'FNInput',
    placeholder: 'Enter your permanent address',
    colSpan: 'full',
  },
  {
    fieldType: 'FNDivider',
    label: 'Emergency contact',
    variant: 'heading',
    name: 'emergency_header'
  },
  {
    name: 'emergency_contact_name',
    label: 'Name *',
    fieldType: 'FNInput',
    placeholder: 'Emergency contact name',
    validations: { required: true },
  },
  {
    name: 'emergency_contact_relation',
    label: 'Relationship',
    fieldType: 'FNSelect',
    options: [
      { label: 'Select...', value: '' },
      { label: 'Spouse', value: 'spouse' },
      { label: 'Parent', value: 'parent' },
      { label: 'Sibling', value: 'sibling' },
      { label: 'Friend', value: 'friend' },
      { label: 'Other', value: 'other' },
    ],
  },
  {
    name: 'emergency_contact_phone',
    label: 'Phone *',
    fieldType: 'FNInput',
    placeholder: 'Enter 10 digit phone number',
    validations: { 
      required: true,
      minLength: 10,
      maxLength: 10
    },
  },
];

// Step 2: Employment Details
export const STEP2_EMPLOYMENT_SCHEMA = [
  {
    fieldType: 'FNDivider',
    label: 'Position',
    variant: 'heading',
    name: 'position_header'
  },
  {
    name: 'job_title',
    label: 'Job title *',
    fieldType: 'FNInput',
    placeholder: 'e.g. Senior Engineer',
    validations: { required: true },
  },
  {
    name: 'employee_id',
    label: 'Employee ID *',
    fieldType: 'FNInput',
    placeholder: 'Auto-generated',
    validations: { required: true },
  },
  {
    name: 'job_code',
    label: 'Job code',
    fieldType: 'FNInput',
    placeholder: 'Enter job code',
  },
  {
    name: 'department_id',
    label: 'Department *',
    fieldType: 'FNSelect',
    options: [
      { label: 'Select...', value: '' },
      { label: 'Engineering', value: 'Engineering' },
      { label: 'Product', value: 'Product' },
      { label: 'Design', value: 'Design' },
      { label: 'Sales', value: 'Sales' },
      { label: 'HR', value: 'HR' },
      { label: 'Finance', value: 'Finance' },
    ],
    validations: { required: true },
  },
  {
    name: 'sub_department',
    label: 'Sub-department',
    fieldType: 'FNSelect',
    options: [
      { label: 'Select...', value: '' },
    ],
  },
  {
    name: 'grade_band',
    label: 'Grade / band',
    fieldType: 'FNSelect',
    options: [
      { label: 'Select...', value: '' },
    ],
  },
  {
    fieldType: 'FNDivider',
    label: 'Schedule & location',
    variant: 'heading',
    name: 'schedule_header'
  },
  {
    name: 'work_location_id',
    label: 'Work location *',
    fieldType: 'FNSelect',
    options: [
      { label: 'Bangalore — Indiranagar', value: 'Bangalore — Indiranagar' },
      { label: 'Mumbai', value: 'Mumbai' },
      { label: 'Pune', value: 'Pune' },
      { label: 'Hyderabad', value: 'Hyderabad' },
    ],
    validations: { required: true },
  },
  {
    name: 'employment_type',
    label: 'Employment type',
    fieldType: 'FNSelect',
    options: [
      { label: 'Full-time - permanent', value: 'Full-time - permanent' },
      { label: 'Full-time - contract', value: 'Full-time - contract' },
      { label: 'Part-time', value: 'Part-time' },
      { label: 'Internship', value: 'Internship' },
    ],
    required: true,
  },
  {
    name: 'date_of_joining',
    label: 'Date of joining ',
    fieldType: 'FNInput',
    type: 'date',
    required: true,
  },
  {
    name: 'shift_id',
    label: 'Shift',
    fieldType: 'FNSelect',
    options: [
      { label: 'Select...', value: '' },
      { label: 'Morning', value: 'morning' },
      { label: 'Afternoon', value: 'afternoon' },
      { label: 'Evening', value: 'evening' },
    ],
  },
  {
    name: 'probation_end_date',
    label: 'Probation end date',
    fieldType: 'FNInput',
    type: 'date',
  },
  {
    name: 'notice_period_days',
    label: 'Notice period (days)',
    fieldType: 'FNInput',
    type: 'number',
  },
  {
    fieldType: 'FNDivider',
    label: 'Reporting',
    variant: 'heading',
    name: 'reporting_header'
  },
  {
    name: 'reporting_manager_id',
    label: 'Reports to (manager) ',
    fieldType: 'FNInput',
    placeholder: 'Search by name or ID',
    required: true,
  },
  {
    name: 'buddy_id',
    label: 'Buddy / mentor (optional)',
    fieldType: 'FNInput',
    placeholder: 'Search by name or ID',
  },
];

// Step 3: CTC & Bank
export const STEP3_CTC_SCHEMA = [
  {
    fieldType: 'FNDivider',
    label: 'Annual CTC',
    variant: 'heading',
    name: 'ctc_header'
  },
  {
    name: 'annual_ctc',
    label: 'Annual CTC',
    fieldType: 'FNInput',
    type: 'number',
    placeholder: 'Enter annual CTC',
    required: true,
  },
  {
    name: 'ctc_effective_from',
    label: 'Effective from',
    fieldType: 'FNInput',
    type: 'date',
    required: true,
  },
  {
    name: 'salary_structure',
    label: 'Salary structure',
    fieldType: 'FNSelect',
    options: [
      { label: 'Select...', value: '' },
    ],
  },
  {
    fieldType: 'FNDivider',
    label: 'Bank details',
    variant: 'heading',
    name: 'bank_header',
    helperText: 'Optional now — copied to unit salary addition'
  },
  {
    name: 'bank_name',
    label: 'Bank name',
    fieldType: 'FNInput',
    placeholder: 'e.g. HDFC Bank',
  },
  {
    name: 'bank_branch',
    label: 'Branch',
    fieldType: 'FNInput',
    placeholder: 'Indiranagar, Bangalore',
  },
  {
    name: 'account_number',
    label: 'Account number',
    fieldType: 'FNInput',
    placeholder: 'Enter account number',
  },
  {
    name: 'account_type',
    label: 'Account type',
    fieldType: 'FNSelect',
    options: [], // Populated from /v1/dropdowns/account-types at runtime
  },
];

// Step 4: Leave & Organization
export const STEP4_LEAVE_SCHEMA = [
  {
    fieldType: 'FNDivider',
    label: 'Leave plan',
    variant: 'heading',
    name: 'leave_plan_header'
  },
  {
    name: 'leave_plan',
    label: 'Leave plan',
    fieldType: 'FNSelect',
    placeholder: 'Select leave plan...',
    options: ["Gowun_Dodum_2025", "Bad_Leave"],
    required: true,
    colSpan: 1,
  },
  {
    name: 'holiday_calendar',
    label: 'Holiday calendar',
    fieldType: 'FNSelect',
    placeholder: 'Select calendar...',
    options: [],
    required: true,
    colSpan: 1,
  },
  {
    fieldType: 'FNDivider',
    label: 'Organisation',
    variant: 'heading',
    name: 'org_header'
  },
  {
    name: 'cost_centre',
    label: 'Cost centre',
    fieldType: 'FNSelect',
    placeholder: 'Select cost centre...',
    options: [],
    colSpan: 1,
  },
  {
    name: 'business_unit',
    label: 'Business unit',
    fieldType: 'FNSelect',
    placeholder: 'Select business unit...',
    options: [],
    colSpan: 1,
  },
  {
    name: 'legal_entity',
    label: 'Legal entity',
    fieldType: 'FNSelect',
    placeholder: 'Select legal entity...',
    options: [],
    colSpan: 1,
  },
  {
    name: 'workspace_team',
    label: 'Workspace / team',
    fieldType: 'FNInput',
    placeholder: 'Enter workspace or team',
    colSpan: 1,
  },
];

// Step 5: Documents & KYC
export const STEP5_DOCUMENTS_SCHEMA = [
  {
    fieldType: 'FNDivider',
    label: 'Documents',
    variant: 'heading',
    name: 'documents_header',
    helperText: 'Track uploads, mark verified or request re-uploads. Required documents are starred.'
  },
];

// Step 6: Review & Activate
export const STEP6_REVIEW_SCHEMA = [
  {
    fieldType: 'FNDivider',
    label: 'Review & activate',
    variant: 'heading',
    name: 'review_header'
  },
];

export const REQUIRED_DOCUMENTS = [
  { id: 'offer_letter', label: 'Offer letter (signed)', required: true },
  { id: 'pan_card', label: 'PAN card', required: true },
  { id: 'aadhaar_card', label: 'Aadhar card', required: true },
  { id: 'bank_passbook', label: 'Bank passbook / cheque', required: true },
  { id: 'relieving_letter', label: 'Previous employer relieving', required: true },
  { id: 'education_certificate', label: 'Education certificates', required: true },
];

export const ACTIVATION_CHECKLIST = [
  { id: 'welcome_email', label: 'Send welcome email with login link' },
  { id: 'provision_email', label: 'Provision kavya.reddy@finforz.com' },
  { id: 'slack_workspace', label: 'Add to Slack channels and Google Workspace' },
  { id: 'mail_kit', label: 'Mail the onboarding kit to office address' },
  { id: 'one_on_one', label: 'Schedule a Day 1 1:1 with Rohan Iyer' },
  { id: 'notify_team', label: 'Notify the team via #welcomes' },
];

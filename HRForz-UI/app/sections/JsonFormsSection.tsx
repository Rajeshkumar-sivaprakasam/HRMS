'use client';
import React, { useState } from 'react';
import { FormRenderer } from '@/components';
import { Heading, Text, Badge, Divider } from '@/components';

// ─── Demo wrapper ─────────────────────────────────────────────────────────────

function DemoBlock({
  title,
  badge,
  description,
  children,
}: {
  title: string;
  badge: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
        <Heading level="h4" style={{ margin: 0 }}>{title}</Heading>
        <Badge color="primary">{badge}</Badge>
      </div>
      <Text variant="body2" style={{ color: '#6b7280', marginBottom: '1.25rem' }}>{description}</Text>
      {children}
    </div>
  );
}

// ─── 1. showWhen / hideWhen (legacy shorthand — still works) ──────────────────

function ShowHideDemo() {
  return (
    <DemoBlock
      title="Show / Hide"
      badge="showWhen · hideWhen"
      description="Selecting Employment Status reveals the relevant fields. The 'Company Name' field resets its value when it becomes hidden (resetOnHide)."
    >
      <FormRenderer
        columns={2}
        showReset
        schema={[
          {
            fieldType: 'FNRadio', name: 'employmentType', label: 'Employment Status',
            direction: 'horizontal', colSpan: 2,
            options: [
              { value: 'employed',      label: 'Employed' },
              { value: 'self-employed', label: 'Self-Employed' },
              { value: 'student',       label: 'Student' },
              { value: 'unemployed',    label: 'Unemployed' },
            ],
          },
          // showWhen — visible only when value matches
          {
            fieldType: 'FNInput', name: 'company', label: 'Company Name',
            placeholder: 'Acme Corp', required: true,
            condition: { dependsOn: 'employmentType', showWhen: 'employed', resetOnHide: true },
          },
          {
            fieldType: 'FNInput', name: 'jobTitle', label: 'Job Title',
            placeholder: 'Software Engineer',
            condition: { dependsOn: 'employmentType', showWhen: 'employed', resetOnHide: true },
          },
          {
            fieldType: 'FNInput', name: 'businessName', label: 'Business Name',
            placeholder: 'My LLC',
            condition: { dependsOn: 'employmentType', showWhen: 'self-employed', resetOnHide: true },
          },
          {
            fieldType: 'FNInput', name: 'university', label: 'University',
            placeholder: 'MIT',
            condition: { dependsOn: 'employmentType', showWhen: 'student', resetOnHide: true },
          },
          // hideWhen — visible for everything EXCEPT 'employed'
          {
            fieldType: 'FNTextarea', name: 'additionalInfo', label: 'Additional Information',
            placeholder: 'Tell us more…', rows: 2,
            condition: { dependsOn: 'employmentType', hideWhen: 'employed' },
          },
        ]}
        onSubmit={v => alert(JSON.stringify(v, null, 2))}
      />
    </DemoBlock>
  );
}

// ─── 2. enableWhen / disableWhen ──────────────────────────────────────────────

function EnableDisableDemo() {
  return (
    <DemoBlock
      title="Enable / Disable"
      badge="enableWhen · disableWhen · disable expr"
      description="Toggle the checkbox to unlock billing fields. The card number field stays disabled until a card type is chosen AND billing is enabled."
    >
      <FormRenderer
        columns={2}
        showReset
        schema={[
          {
            fieldType: 'FNCheckbox', name: 'addBilling', label: 'Add billing information',
            colSpan: 2,
          },
          // Legacy disableWhen
          {
            fieldType: 'FNSelect', name: 'cardType', label: 'Card Type',
            options: [
              { value: 'visa',   label: 'Visa' },
              { value: 'mc',     label: 'Mastercard' },
              { value: 'amex',   label: 'Amex' },
            ],
            condition: { dependsOn: 'addBilling', enableWhen: true },
          },
          // New disable expression: disabled when EITHER billing unchecked OR no card type chosen
          {
            fieldType: 'FNInput', name: 'cardNumber', label: 'Card Number',
            placeholder: '**** **** **** ****',
            condition: {
              disable: {
                logic: 'OR',
                rules: [
                  { dependsOn: 'addBilling', op: '!=', value: true },
                  { dependsOn: 'cardType',   op: 'empty' },
                ],
              },
            },
          },
          {
            fieldType: 'FNInput', name: 'expiry', label: 'Expiry',
            placeholder: 'MM/YY',
            condition: { dependsOn: 'addBilling', enableWhen: true },
          },
          {
            fieldType: 'FNInput', name: 'cvv', label: 'CVV',
            placeholder: '•••',
            condition: { dependsOn: 'addBilling', enableWhen: true },
          },
        ]}
        onSubmit={v => alert(JSON.stringify(v, null, 2))}
      />
    </DemoBlock>
  );
}

// ─── 3. AND / OR compound conditions ─────────────────────────────────────────

function CompoundConditionDemo() {
  return (
    <DemoBlock
      title="AND / OR Compound Conditions"
      badge="ConditionGroup"
      description="The Custom Pricing field appears only when Plan = Enterprise AND Billing = Annual. The Discount Code field appears when Plan = Startup OR Plan = Pro."
    >
      <FormRenderer
        columns={2}
        showReset
        schema={[
          {
            fieldType: 'FNSelect', name: 'plan', label: 'Plan',
            options: [
              { value: 'startup',    label: 'Startup' },
              { value: 'pro',        label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ],
          },
          {
            fieldType: 'FNRadio', name: 'billing', label: 'Billing Cycle',
            direction: 'horizontal',
            options: [
              { value: 'monthly', label: 'Monthly' },
              { value: 'annual',  label: 'Annual' },
            ],
          },
          // Show when plan == 'enterprise' AND billing == 'annual'
          {
            fieldType: 'FNInput', name: 'customPrice', label: 'Custom Pricing (USD)',
            type: 'number', placeholder: '5000',
            helperText: 'Visible only for Enterprise + Annual',
            condition: {
              show: {
                logic: 'AND',
                rules: [
                  { dependsOn: 'plan',    op: '==', value: 'enterprise' },
                  { dependsOn: 'billing', op: '==', value: 'annual' },
                ],
              },
              resetOnHide: true,
            },
          },
          // Show when plan is 'startup' OR 'pro'
          {
            fieldType: 'FNInput', name: 'discountCode', label: 'Discount Code',
            placeholder: 'SAVE20',
            helperText: 'Visible for Startup or Pro plans',
            condition: {
              show: {
                logic: 'OR',
                rules: [
                  { dependsOn: 'plan', op: '==', value: 'startup' },
                  { dependsOn: 'plan', op: '==', value: 'pro' },
                ],
              },
              resetOnHide: true,
            },
          },
        ]}
        onSubmit={v => alert(JSON.stringify(v, null, 2))}
      />
    </DemoBlock>
  );
}

// ─── 4. Operator variety (gt, gte, lt, notEmpty, contains) ───────────────────

function OperatorDemo() {
  return (
    <DemoBlock
      title="Rich Operators"
      badge="gt · gte · notEmpty · contains"
      description="Quantity ≥ 10 unlocks bulk discount. A shipping address section appears only when the quantity field is filled. A warning appears when the note contains 'urgent'."
    >
      <FormRenderer
        columns={2}
        showReset
        schema={[
          {
            fieldType: 'FNInput', name: 'quantity', label: 'Quantity', type: 'number',
            placeholder: '1', colSpan: 1,
          },
          // Show when quantity >= 10 (numeric gte)
          {
            fieldType: 'FNInput', name: 'bulkDiscount', label: 'Bulk Discount %',
            type: 'number', placeholder: '15',
            helperText: 'Unlocked when quantity ≥ 10',
            condition: {
              show: { dependsOn: 'quantity', op: 'gte', value: 10 },
              resetOnHide: true,
            },
          },
          {
            fieldType: 'FNDivider', name: 'div1', label: 'Shipping Address',
            variant: 'heading', colSpan: 'full',
            // Show when quantity field is not empty
            condition: { show: { dependsOn: 'quantity', op: 'notEmpty' } },
          },
          {
            fieldType: 'FNInput', name: 'street', label: 'Street',
            colSpan: 2,
            condition: { show: { dependsOn: 'quantity', op: 'notEmpty' }, resetOnHide: true },
          },
          {
            fieldType: 'FNInput', name: 'city', label: 'City',
            condition: { show: { dependsOn: 'quantity', op: 'notEmpty' }, resetOnHide: true },
          },
          {
            fieldType: 'FNInput', name: 'zip', label: 'ZIP Code',
            condition: { show: { dependsOn: 'quantity', op: 'notEmpty' }, resetOnHide: true },
          },
          {
            fieldType: 'FNTextarea', name: 'orderNote', label: 'Order Note',
            placeholder: 'Any special instructions…', rows: 2, colSpan: 2,
          },
          // contains operator on string
          {
            fieldType: 'FNDivider', name: 'urgentWarning', label: '⚠ Urgent orders require phone confirmation',
            variant: 'subheading', colSpan: 'full',
            condition: { show: { dependsOn: 'orderNote', op: 'contains', value: 'urgent' } },
          },
          {
            fieldType: 'FNInput', name: 'phone', label: 'Phone (required for urgent)',
            type: 'tel', colSpan: 2,
            condition: {
              show: { dependsOn: 'orderNote', op: 'contains', value: 'urgent' },
              resetOnHide: true,
            },
          },
        ]}
        onSubmit={v => alert(JSON.stringify(v, null, 2))}
      />
    </DemoBlock>
  );
}

// ─── 5. requiredWhen — conditional required ───────────────────────────────────

function RequiredWhenDemo() {
  return (
    <DemoBlock
      title="Conditional Required (requiredWhen)"
      badge="requiredWhen"
      description="Fields become required dynamically. 'Company Registration' is only required when Entity Type is LLC or Corporation. 'Referral Name' is required when source is Referral."
    >
      <FormRenderer
        columns={2}
        showReset
        submitLabel="Validate"
        schema={[
          {
            fieldType: 'FNSelect', name: 'entityType', label: 'Entity Type',
            options: [
              { value: 'individual',   label: 'Individual' },
              { value: 'llc',          label: 'LLC' },
              { value: 'corporation',  label: 'Corporation' },
              { value: 'partnership',  label: 'Partnership' },
            ],
          },
          // Required when entityType is 'llc' OR 'corporation'
          {
            fieldType: 'FNInput', name: 'registrationNo', label: 'Company Registration #',
            placeholder: 'Reg-123456',
            condition: {
              requiredWhen: {
                logic: 'OR',
                rules: [
                  { dependsOn: 'entityType', op: '==', value: 'llc' },
                  { dependsOn: 'entityType', op: '==', value: 'corporation' },
                ],
              },
            },
          },
          {
            fieldType: 'FNSelect', name: 'hearAboutUs', label: 'How did you hear about us?',
            options: [
              { value: 'google',   label: 'Google' },
              { value: 'referral', label: 'Referral' },
              { value: 'social',   label: 'Social Media' },
              { value: 'other',    label: 'Other' },
            ],
          },
          // Required when source is 'referral'
          {
            fieldType: 'FNInput', name: 'referralName', label: 'Referral Name',
            placeholder: 'John Doe',
            condition: {
              requiredWhen: { dependsOn: 'hearAboutUs', op: '==', value: 'referral' },
            },
          },
        ]}
        onSubmit={v => alert(JSON.stringify(v, null, 2))}
      />
    </DemoBlock>
  );
}

// ─── 6. setValueWhen — auto-set values ───────────────────────────────────────

function SetValueWhenDemo() {
  return (
    <DemoBlock
      title="Auto-Set Values (setValueWhen)"
      badge="setValueWhen"
      description="Selecting a Shipping Method pre-fills the Delivery Days field. Choosing a plan pre-fills the default seat count. Users can still override both values."
    >
      <FormRenderer
        columns={2}
        showReset
        schema={[
          {
            fieldType: 'FNSelect', name: 'shippingMethod', label: 'Shipping Method',
            options: [
              { value: 'standard', label: 'Standard (5–7 days)' },
              { value: 'express',  label: 'Express (2–3 days)' },
              { value: 'overnight',label: 'Overnight (1 day)' },
            ],
          },
          // Auto-set based on shipping method selection
          {
            fieldType: 'FNInput', name: 'deliveryDays', label: 'Delivery Days (editable)',
            type: 'number', placeholder: '—',
            helperText: 'Pre-filled by shipping method, but you can change it',
            condition: {
              setValueWhen: [
                { when: { dependsOn: 'shippingMethod', op: '==', value: 'standard' },  value: 6 },
                { when: { dependsOn: 'shippingMethod', op: '==', value: 'express' },   value: 2 },
                { when: { dependsOn: 'shippingMethod', op: '==', value: 'overnight' }, value: 1 },
              ],
            },
          },
          {
            fieldType: 'FNRadio', name: 'teamPlan', label: 'Team Plan',
            direction: 'horizontal',
            options: [
              { value: 'small',      label: 'Small (up to 10)' },
              { value: 'medium',     label: 'Medium (up to 50)' },
              { value: 'enterprise', label: 'Enterprise' },
            ],
          },
          {
            fieldType: 'FNInput', name: 'seatCount', label: 'Seat Count',
            type: 'number',
            helperText: 'Pre-filled by plan; adjust as needed',
            condition: {
              setValueWhen: [
                { when: { dependsOn: 'teamPlan', op: '==', value: 'small' },      value: 10 },
                { when: { dependsOn: 'teamPlan', op: '==', value: 'medium' },     value: 50 },
                { when: { dependsOn: 'teamPlan', op: '==', value: 'enterprise' }, value: 100 },
              ],
            },
          },
        ]}
        onSubmit={v => alert(JSON.stringify(v, null, 2))}
      />
    </DemoBlock>
  );
}

// ─── 7. optionsMap — cascading dropdowns ─────────────────────────────────────

function CascadingDemo() {
  return (
    <DemoBlock
      title="Cascading Dropdowns (optionsMap)"
      badge="optionsMap"
      description="Selecting a Country filters the State/Region options automatically. Selecting a Category filters the Subcategory list."
    >
      <FormRenderer
        columns={2}
        showReset
        schema={[
          {
            fieldType: 'FNSelect', name: 'country', label: 'Country',
            clearable: true,
            options: [
              { value: 'us', label: 'United States' },
              { value: 'uk', label: 'United Kingdom' },
              { value: 'au', label: 'Australia' },
            ],
          },
          {
            fieldType: 'FNSelect', name: 'state', label: 'State / Region',
            clearable: true,
            options: [], // Fallback (empty until country selected)
            optionsMap: [
              {
                when: { dependsOn: 'country', op: '==', value: 'us' },
                options: [
                  { value: 'ca', label: 'California' },
                  { value: 'tx', label: 'Texas' },
                  { value: 'ny', label: 'New York' },
                  { value: 'fl', label: 'Florida' },
                ],
              },
              {
                when: { dependsOn: 'country', op: '==', value: 'uk' },
                options: [
                  { value: 'eng', label: 'England' },
                  { value: 'sco', label: 'Scotland' },
                  { value: 'wal', label: 'Wales' },
                ],
              },
              {
                when: { dependsOn: 'country', op: '==', value: 'au' },
                options: [
                  { value: 'nsw', label: 'New South Wales' },
                  { value: 'vic', label: 'Victoria' },
                  { value: 'qld', label: 'Queensland' },
                ],
              },
            ],
            condition: { show: { dependsOn: 'country', op: 'notEmpty' }, resetOnHide: true },
          },
          {
            fieldType: 'FNSelect', name: 'category', label: 'Category',
            clearable: true,
            options: [
              { value: 'tech',     label: 'Technology' },
              { value: 'finance',  label: 'Finance' },
              { value: 'health',   label: 'Health' },
            ],
          },
          {
            fieldType: 'FNSelect', name: 'subcategory', label: 'Subcategory',
            clearable: true,
            options: [],
            optionsMap: [
              {
                when: { dependsOn: 'category', op: '==', value: 'tech' },
                options: [
                  { value: 'fe',    label: 'Frontend' },
                  { value: 'be',    label: 'Backend' },
                  { value: 'devops',label: 'DevOps' },
                  { value: 'ml',    label: 'Machine Learning' },
                ],
              },
              {
                when: { dependsOn: 'category', op: '==', value: 'finance' },
                options: [
                  { value: 'banking',  label: 'Banking' },
                  { value: 'invest',   label: 'Investments' },
                  { value: 'crypto',   label: 'Crypto' },
                ],
              },
              {
                when: { dependsOn: 'category', op: '==', value: 'health' },
                options: [
                  { value: 'fitness', label: 'Fitness' },
                  { value: 'mental',  label: 'Mental Health' },
                  { value: 'nutrition',label: 'Nutrition' },
                ],
              },
            ],
            condition: { show: { dependsOn: 'category', op: 'notEmpty' }, resetOnHide: true },
          },
        ]}
        onSubmit={v => alert(JSON.stringify(v, null, 2))}
      />
    </DemoBlock>
  );
}

// ─── Root section ─────────────────────────────────────────────────────────────

export default function JsonFormsSection() {
  const [activeDemo, setActiveDemo] = useState<string>('all');

  const demos: { id: string; label: string }[] = [
    { id: 'all',        label: 'All' },
    { id: 'show-hide',  label: 'Show / Hide' },
    { id: 'enable',     label: 'Enable / Disable' },
    { id: 'compound',   label: 'AND / OR' },
    { id: 'operators',  label: 'Operators' },
    { id: 'required',   label: 'requiredWhen' },
    { id: 'setvalue',   label: 'setValueWhen' },
    { id: 'cascading',  label: 'Cascading' },
  ];

  const show = (id: string) => activeDemo === 'all' || activeDemo === id;

  return (
    <div style={{ padding: '1rem 0' }}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {demos.map(d => (
          <button
            key={d.id}
            onClick={() => setActiveDemo(d.id)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              background: activeDemo === d.id ? '#4F46E5' : 'transparent',
              borderColor: activeDemo === d.id ? '#4F46E5' : '#d1d5db',
              color: activeDemo === d.id ? '#fff' : '#374151',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {show('show-hide')  && <ShowHideDemo />}
      {show('show-hide')  && show('enable') && <Divider />}
      {show('enable')     && <EnableDisableDemo />}
      {show('enable')     && show('compound') && <Divider />}
      {show('compound')   && <CompoundConditionDemo />}
      {show('compound')   && show('operators') && <Divider />}
      {show('operators')  && <OperatorDemo />}
      {show('operators')  && show('required') && <Divider />}
      {show('required')   && <RequiredWhenDemo />}
      {show('required')   && show('setvalue') && <Divider />}
      {show('setvalue')   && <SetValueWhenDemo />}
      {show('setvalue')   && show('cascading') && <Divider />}
      {show('cascading')  && <CascadingDemo />}
    </div>
  );
}

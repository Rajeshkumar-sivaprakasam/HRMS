'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button, Input, Select, Heading, Text, Card, FormRenderer } from '@/components';
import { dropdownsApi } from '@/lib/api';
import { validateForm, computeVisibilityMap, computeRequiredMap } from '@/components/FormRenderer/validators';
import styles from './Steps.module.scss';

interface Step3CTCProps {
  onSubmit: (data: Record<string, any>) => void;
  onBack: () => void;
  initialData?: Record<string, any>;
}

const formatCurrency = (val: number) => {
  return Math.round(val).toLocaleString('en-IN');
};

const TableInput = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
  const [localValue, setLocalValue] = useState<string>(value === 0 ? '' : Math.round(value).toString());

  useEffect(() => {
    const rounded = Math.round(value);
    if (rounded.toString() !== localValue && (value !== 0 || localValue !== '')) {
      setLocalValue(value === 0 ? '' : rounded.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (val === '') {
      onChange(0);
    } else {
      const num = Number(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  return (
    <input
      type="number"
      className={styles.tableInput}
      value={localValue}
      onChange={handleChange}
    />
  );
};

export default function Step3CTC({ onSubmit, onBack, initialData }: Step3CTCProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({
    annual_ctc: 0,
    ctc_effective_from: '',
    salary_structure_id: '',
    bank_name: '',
    bank_branch: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'savings',
    // Breakup components (Annual values)
    basic: 0,
    hra: 0,
    conveyance: 0,
    other: 0,
    esi: 0,
    pf: 0,
    empEsi: 0,
    empPf: 0,
    pfAdmin: 0,
    mediclaim: 0,
    mealCard: 0,
    incentive: 0,
    ...initialData
  });
  
  const [salaryStructures, setSalaryStructures] = useState<any[]>([]);
  const [accountTypes, setAccountTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [salaryRes, accountTypesRes] = await Promise.all([
          dropdownsApi.getSalaryStructures(),
          dropdownsApi.getAccountTypes(),
        ]);
        const mapped = (salaryRes.response || []).map((s: any) => ({
          value: s.id?.toString() || s.value?.toString() || '',
          label: s.name || s.label || ''
        }));
        setSalaryStructures(mapped);

        const mappedAccountTypes = (accountTypesRes.response || []).map((t: any) => ({
          value: t.id?.toString() || t.value?.toString() || '',
          label: t.name || t.label || t.value || ''
        }));
        // Fallback if API returns empty
        setAccountTypes(mappedAccountTypes.length > 0 ? mappedAccountTypes : [
          { value: 'savings', label: 'Savings' },
          { value: 'current', label: 'Current' },
          { value: 'salary', label: 'Salary' },
        ]);
      } catch (error) {
        console.error('Failed to load dropdowns', error);
        // Fallback defaults
        setAccountTypes([
          { value: 'savings', label: 'Savings' },
          { value: 'current', label: 'Current' },
          { value: 'salary', label: 'Salary' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    loadDropdowns();
  }, []);

  // Recalculate components when Annual CTC changes
  const calculateBreakup = (annualCTC: number) => {
    const monthlyCTC = annualCTC / 12;
    
    // EARNINGS
    const basicMonthly = Math.max(0, (0.5 * monthlyCTC) - 1000);
    const hraMonthly = 0.5 * basicMonthly;
    const conveyanceMonthly = monthlyCTC > 0 ? 1600 : 0;
    const otherMonthly = Math.max(0, monthlyCTC - (basicMonthly + hraMonthly + conveyanceMonthly));
    const grossMonthly = basicMonthly + hraMonthly + conveyanceMonthly + otherMonthly;
    
    // DEDUCTIONS
    const employeeESI = grossMonthly > 0 && grossMonthly <= 21000 ? Math.round(grossMonthly * 0.0075) : 0;
    const employeePF = Math.min(1800, Math.round(basicMonthly * 0.12));
    
    // BENEFITS
    const employerESI = grossMonthly > 0 && grossMonthly <= 21000 ? Math.round(grossMonthly * 0.0325) : 0;
    const employerPF = Math.min(1800, Math.round(basicMonthly * 0.12));
    const pfAdmin = Math.min(150, Math.round(basicMonthly * 0.01));
    const mediclaim = monthlyCTC > 0 ? 500 : 0;
    const mealCard = monthlyCTC > 0 ? 2200 : 0;

    return {
      basic: basicMonthly * 12,
      hra: hraMonthly * 12,
      conveyance: conveyanceMonthly * 12,
      other: otherMonthly * 12,
      esi: employeeESI * 12,
      pf: employeePF * 12,
      empEsi: employerESI * 12,
      empPf: employerPF * 12,
      pfAdmin: pfAdmin * 12,
      mediclaim: mediclaim * 12,
      mealCard: mealCard * 12,
      incentive: 0
    };
  };

  const handleAnnualCTCChange = (value: string) => {
    const annualCTC = Number(value) || 0;
    const newBreakup = calculateBreakup(annualCTC);
    setFormValues(prev => ({
      ...prev,
      annual_ctc: value,
      ...newBreakup
    }));
  };

  const handleComponentChange = (key: string, value: number, isMonthly: boolean) => {
    const annualValue = isMonthly ? value * 12 : value;
    setFormValues(prev => {
      const updatedValues = { ...prev, [key]: annualValue };
      
      // Recalculate CTC based on all components
      // Gross = Basic + HRA + Conveyance + Other
      const grossAnnual = (updatedValues.basic || 0) + (updatedValues.hra || 0) + (updatedValues.conveyance || 0) + (updatedValues.other || 0);
      // Total Benefits = empEsi + empPf + pfAdmin + mediclaim + mealCard
      const benefitsAnnual = (updatedValues.empEsi || 0) + (updatedValues.empPf || 0) + (updatedValues.pfAdmin || 0) + (updatedValues.mediclaim || 0) + (updatedValues.mealCard || 0);
      // CTC = Gross + Benefits + Incentive
      const totalCTCAnnual = grossAnnual + benefitsAnnual + (updatedValues.incentive || 0);
      
      return {
        ...updatedValues,
        annual_ctc: totalCTCAnnual
      };
    });
  };

  const breakup = useMemo(() => {
    const v = formValues;
    const grossMonthly = ((v.basic || 0) + (v.hra || 0) + (v.conveyance || 0) + (v.other || 0)) / 12;
    const totalDeductionsMonthly = ((v.esi || 0) + (v.pf || 0)) / 12;
    const totalBenefitsMonthly = ((v.empEsi || 0) + (v.empPf || 0) + (v.pfAdmin || 0) + (v.mediclaim || 0) + (v.mealCard || 0)) / 12;
    
    return {
      monthly: {
        basic: (v.basic || 0) / 12,
        hra: (v.hra || 0) / 12,
        conveyance: (v.conveyance || 0) / 12,
        other: (v.other || 0) / 12,
        gross: grossMonthly,
        esi: (v.esi || 0) / 12,
        pf: (v.pf || 0) / 12,
        totalDeductions: totalDeductionsMonthly,
        net: grossMonthly - totalDeductionsMonthly,
        empEsi: (v.empEsi || 0) / 12,
        empPf: (v.empPf || 0) / 12,
        pfAdmin: (v.pfAdmin || 0) / 12,
        mediclaim: (v.mediclaim || 0) / 12,
        mealCard: (v.mealCard || 0) / 12,
        totalBenefits: totalBenefitsMonthly,
        incentive: (v.incentive || 0) / 12,
        ctc: grossMonthly + totalBenefitsMonthly + ((v.incentive || 0) / 12)
      },
      annual: {
        basic: (v.basic || 0),
        hra: (v.hra || 0),
        conveyance: (v.conveyance || 0),
        other: (v.other || 0),
        gross: grossMonthly * 12,
        esi: (v.esi || 0),
        pf: (v.pf || 0),
        totalDeductions: totalDeductionsMonthly * 12,
        net: (grossMonthly - totalDeductionsMonthly) * 12,
        empEsi: (v.empEsi || 0),
        empPf: (v.empPf || 0),
        pfAdmin: (v.pfAdmin || 0),
        mediclaim: (v.mediclaim || 0),
        mealCard: (v.mealCard || 0),
        totalBenefits: totalBenefitsMonthly * 12,
        incentive: (v.incentive || 0),
        ctc: (grossMonthly + totalBenefitsMonthly + ((v.incentive || 0) / 12)) * 12
      }
    };
  }, [formValues]);

  const handleChange = (name: string, value: any) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const [showErrors, setShowErrors] = useState(false);

  const handleFinalSubmit = () => {
    const topSchema = TOP_SECTION_SCHEMA as any;
    const bankSchema = BANK_SECTION_SCHEMA as any;
    
    const topVis = computeVisibilityMap(topSchema, formValues);
    const topReq = computeRequiredMap(topSchema, formValues);
    const topErrors = validateForm(topSchema, formValues, topVis, topReq);

    const bankVis = computeVisibilityMap(bankSchema, formValues);
    const bankReq = computeRequiredMap(bankSchema, formValues);
    const bankErrors = validateForm(bankSchema, formValues, bankVis, bankReq);

    if (Object.keys(topErrors).length > 0 || Object.keys(bankErrors).length > 0) {
      setShowErrors(true);
      // Find the first error message to show in an alert or just rely on FormRenderer
      return;
    }

    // Build the backend-expected ctc_breakdown nested object
    const ctc_breakdown = {
      earnings: {
        basic: formValues.basic || 0,
        hra: formValues.hra || 0,
        conveyance: formValues.conveyance || 0,
        other_allowance: formValues.other || 0,
      },
      deductions: {
        employee_esi: formValues.esi || 0,
        employee_pf: formValues.pf || 0,
      },
      benefits: {
        employer_esi: formValues.empEsi || 0,
        employer_pf: formValues.empPf || 0,
        pf_admin: formValues.pfAdmin || 0,
        mediclaim: formValues.mediclaim || 0,
        meal_card: formValues.mealCard || 0,
      },
      compensation: {
        incentive: formValues.incentive || 0,
      },
    };

    const payload = {
      annual_ctc: Number(formValues.annual_ctc) || 0,
      ctc_effective_from: formValues.ctc_effective_from,
      salary_structure_id: formValues.salary_structure_id || null,
      bank_name: formValues.bank_name || null,
      bank_branch: formValues.bank_branch || null,
      account_number: formValues.account_number || null,
      ifsc_code: formValues.ifsc_code || null,
      account_type: formValues.account_type || null,
      ctc_breakdown,
    };
    onSubmit(payload);
  };

  const TOP_SECTION_SCHEMA = [
    {
      name: "annual_ctc",
      label: "Annual CTC",
      fieldType: "FNInput",
      type: "number",
      prefix: "₹",
      placeholder: "0",
      required: true,
      colSpan: 1,
    },
    {
      name: "ctc_effective_from",
      label: "Effective from",
      fieldType: "FNInput",
      type: "date",
      required: true,
      colSpan: 1,
    },
    {
      name: "salary_structure_id",
      label: "Salary structure",
      fieldType: "FNSelect",
      placeholder: "Select...",
      options: salaryStructures,
      required: true,
      colSpan: 1,
    }
  ];


  const BANK_SECTION_SCHEMA = [
    {
      name: "bank_name",
      label: "Bank name",
      fieldType: "FNInput",
      placeholder: "e.g. HDFC Bank",
      colSpan: 1,
    },
    {
      name: "bank_branch",
      label: "Branch",
      fieldType: "FNInput",
      placeholder: "Indiranagar, Bangalore",
      colSpan: 1,
    },
    {
      name: "account_number",
      label: "Account number",
      fieldType: "FNInput",
      placeholder: "••••••••",
      colSpan: 1,
    },
    {
      name: "ifsc_code",
      label: "IFSC code",
      fieldType: "FNInput",
      placeholder: "HDFC0001234",
      colSpan: 1,
    },
    {
      name: "account_type",
      label: "Account type",
      fieldType: "FNSegmentedControl",
      direction: "horizontal",
      options: accountTypes,
      colSpan: 2,
    }
  ];

  const handleTopSectionChange = (name: string, value: any, allValues: any) => {
    if (name === 'annual_ctc') {
      handleAnnualCTCChange(value);
    } else {
      setFormValues(allValues);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className={styles.stepContainer}>
      <FormRenderer
        schema={TOP_SECTION_SCHEMA as any}
        values={formValues}
        onChange={handleTopSectionChange}
        onSubmit={handleFinalSubmit}
        columns={3}
        hideActions={true}
        showAllErrors={showErrors}
      />

      <div>
        <Heading level="h4" style={{ marginBottom: 4 }}>CTC breakup</Heading>
        <Text variant="caption" color="secondary">
          Enter Total CTC; admin can override each row. Per-month auto-derives from per-annum / 12.
        </Text>

        <div className={styles.ctcTableContainer}>
          <table className={styles.ctcTable}>
            <thead>
              <tr>
                <th>Components</th>
                <th className={styles.amountCell}>Per Month</th>
                <th className={styles.amountCell}>Per Annum</th>
              </tr>
            </thead>
            <tbody>
              {/* EARNINGS */}
              <tr className={styles.sectionHeader}>
                <td colSpan={3}>Earnings</td>
              </tr>
              <tr>
                <td>Basic pay <span className={styles.formula}>(50% × CTC - 1000)</span></td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.basic} onChange={(val) => handleComponentChange('basic', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.basic} onChange={(val) => handleComponentChange('basic', val, false)} />
                </td>
              </tr>
              <tr>
                <td>HRA <span className={styles.formula}>(50% × Basic)</span></td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.hra} onChange={(val) => handleComponentChange('hra', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.hra} onChange={(val) => handleComponentChange('hra', val, false)} />
                </td>
              </tr>
              <tr>
                <td>Conveyance</td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.conveyance} onChange={(val) => handleComponentChange('conveyance', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.conveyance} onChange={(val) => handleComponentChange('conveyance', val, false)} />
                </td>
              </tr>
              <tr>
                <td>Other allowance / adjustment</td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.other} onChange={(val) => handleComponentChange('other', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.other} onChange={(val) => handleComponentChange('other', val, false)} />
                </td>
              </tr>
              <tr className={styles.subtotalRow}>
                <td>Cross salary (A)</td>
                <td className={styles.amountCell}>₹{formatCurrency(breakup.monthly.gross)}</td>
                <td className={styles.amountCell}>₹{formatCurrency(breakup.annual.gross)}</td>
              </tr>

              {/* DEDUCTIONS */}
              <tr className={styles.sectionHeader}>
                <td colSpan={3}>Deductions</td>
              </tr>
              <tr>
                <td>Employee ESI <span className={styles.formula}>(0.75% if gross &lt; 21k)</span></td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.esi} onChange={(val) => handleComponentChange('esi', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.esi} onChange={(val) => handleComponentChange('esi', val, false)} />
                </td>
              </tr>
              <tr>
                <td>Employee PF <span className={styles.formula}>(12%, capped 1800)</span></td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.pf} onChange={(val) => handleComponentChange('pf', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.pf} onChange={(val) => handleComponentChange('pf', val, false)} />
                </td>
              </tr>
              <tr className={styles.subtotalRow}>
                <td>Total deduction (B)</td>
                <td className={styles.amountCell}>₹{formatCurrency(breakup.monthly.totalDeductions)}</td>
                <td className={styles.amountCell}>₹{formatCurrency(breakup.annual.totalDeductions)}</td>
              </tr>

              {/* NET SALARY */}
              <tr className={styles.netSalaryRow}>
                <td>Net salary (A - B)</td>
                <td className={styles.amountCell}>₹{formatCurrency(breakup.monthly.net)}</td>
                <td className={styles.amountCell}>₹{formatCurrency(breakup.annual.net)}</td>
              </tr>

              {/* BENEFITS */}
              <tr className={styles.sectionHeader}>
                <td colSpan={3}>Benefits</td>
              </tr>
              <tr>
                <td>Employer ESI <span className={styles.formula}>(3.25% if gross &lt; 21k)</span></td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.empEsi} onChange={(val) => handleComponentChange('empEsi', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.empEsi} onChange={(val) => handleComponentChange('empEsi', val, false)} />
                </td>
              </tr>
              <tr>
                <td>Employer PF</td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.empPf} onChange={(val) => handleComponentChange('empPf', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.empPf} onChange={(val) => handleComponentChange('empPf', val, false)} />
                </td>
              </tr>
              <tr>
                <td>PF admin &amp; EDLI <span className={styles.formula}>(1%, capped 150)</span></td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.pfAdmin} onChange={(val) => handleComponentChange('pfAdmin', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.pfAdmin} onChange={(val) => handleComponentChange('pfAdmin', val, false)} />
                </td>
              </tr>
              <tr>
                <td>Annual mediclaim premium</td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.mediclaim} onChange={(val) => handleComponentChange('mediclaim', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.mediclaim} onChange={(val) => handleComponentChange('mediclaim', val, false)} />
                </td>
              </tr>
              <tr>
                <td>Meal card</td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.mealCard} onChange={(val) => handleComponentChange('mealCard', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.mealCard} onChange={(val) => handleComponentChange('mealCard', val, false)} />
                </td>
              </tr>
              <tr className={styles.subtotalRow}>
                <td>Total benefits (C)</td>
                <td className={styles.amountCell}>₹{formatCurrency(breakup.monthly.totalBenefits)}</td>
                <td className={styles.amountCell}>₹{formatCurrency(breakup.annual.totalBenefits)}</td>
              </tr>

              {/* COMPENSATION */}
              <tr className={styles.sectionHeader}>
                <td colSpan={3}>Compensation</td>
              </tr>
              <tr>
                <td>Performance-linked incentives</td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.monthly.incentive} onChange={(val) => handleComponentChange('incentive', val, true)} />
                </td>
                <td className={styles.amountCell}>
                  <TableInput value={breakup.annual.incentive} onChange={(val) => handleComponentChange('incentive', val, false)} />
                </td>
              </tr>
              <tr className={styles.ctcRow}>
                <td>Cost to company (A + B + C)</td>
                <td className={styles.amountCell}>₹{formatCurrency(breakup.monthly.ctc)}</td>
                <td className={styles.amountCell}>₹{formatCurrency(breakup.annual.ctc)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Text variant="caption" color="secondary" style={{ marginTop: 8, display: 'block' }}>
          * Performance-linked incentives are paid annually based on review outcome. Mediclaim premium varies by age band.
        </Text>
      </div>

      <div style={{ marginTop: 24 }}>
        <Heading level="h4" style={{ marginBottom: 4 }}>Bank details</Heading>
        <Text variant="caption" color="secondary">
          Optional now — payroll holds until added
        </Text>

        <FormRenderer
          schema={BANK_SECTION_SCHEMA as any}
          values={formValues}
          onChange={(name, value, all) => setFormValues(all)}
          columns={2}
          hideActions={true}
          showAllErrors={showErrors}
        />
      </div>

      <div className={styles.stepFooter}>
        <Button variant="ghost" onClick={onBack}>← Previous</Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" type="button">Save draft</Button>
          <Button 
            variant="primary" 
            onClick={handleFinalSubmit}
          >
            Save & continue →
          </Button>
        </div>
      </div>
    </div>
  );
}

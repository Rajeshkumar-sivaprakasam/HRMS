'use client';
import React, { useState, useEffect } from 'react';
import { Drawer, Icon, Spinner } from '@/components';
import { apiService } from '@/app/core/services/api-service';
import { API_ENDPOINTS } from '@/app/shared/constants/api-endpoints';
import { DEFAULT_CURRENCY } from '@/components/DataTable/constants';
import styles from './salary-breakup-drawer.module.scss';

interface SalaryBreakupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  revision: any;
}

export const SalaryBreakupDrawer: React.FC<SalaryBreakupDrawerProps> = ({ isOpen, onClose, revision }) => {
  const [loading, setLoading] = useState(false);
  const [breakupData, setBreakupData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && revision) {
      const date = new Date(revision.effective_from);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const fetchBreakup = async () => {
        setLoading(true);
        try {
          const res = await apiService.get(API_ENDPOINTS.PAYROLL.SALARY_BREAKUP(month.toString(), year.toString()));
          setBreakupData(res.response?.data || res.data || res.response);
        } catch (err) {
          console.error('Failed to fetch breakup data', err);
        } finally {
          setLoading(false);
        }
      };
      fetchBreakup();
    }
  }, [isOpen, revision]);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      style={{ width: '1000px', maxWidth: '90vw' }}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.mainContent}>
          <div className={styles.drawerTitle}>
            <span className={styles.highlight}>Salary Breakup</span> for {DEFAULT_CURRENCY} {revision?.new_ctc?.toLocaleString('en-IN')}
          </div>

          <table className={styles.breakupTable}>
            <thead className={styles.tableHeader}>
              <tr>
                <th>Earnings</th>
                <th>Monthly</th>
                <th>Annually</th>
              </tr>
            </thead>
            <tbody>
              {breakupData?.earnings?.length > 0 ? (
                breakupData.earnings.map((item: any) => (
                  <tr key={item.name} className={styles.tableRow}>
                    <td className={styles.tableCell}>{item.name}</td>
                    <td className={styles.tableCell}>{DEFAULT_CURRENCY} {item.monthly?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className={styles.tableCell}>{DEFAULT_CURRENCY} {item.annually?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr className={styles.tableRow}><td className={styles.tableCell}>Basic</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 57,500.00</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 6,90,000.00</td></tr>
                  <tr className={styles.tableRow}><td className={styles.tableCell}>HRA</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 28,750.00</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 3,45,000.00</td></tr>
                  <tr className={styles.tableRow}><td className={styles.tableCell}>Conveyance Allowance</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 1,600.00</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 19,200.00</td></tr>
                  <tr className={styles.tableRow}><td className={styles.tableCell}>Other Allowance</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 25,200.00</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 3,02,400.00</td></tr>
                  <tr className={[styles.tableRow, styles.subTotal].join(' ')}><td className={styles.tableCell}>Sub Total</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 1,13,050.00</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 13,56,600.00</td></tr>
                  <tr className={styles.tableRow}><td className={styles.tableCell}>PF - Employer</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 1,800.00</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 21,600.00</td></tr>
                  <tr className={styles.tableRow}><td className={styles.tableCell}>PF - Other Charges</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 150.00</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 1,800.00</td></tr>
                  <tr className={[styles.tableRow, styles.total].join(' ')}><td className={styles.tableCell}>Total Earnings</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 1,15,000.00</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 13,80,000.00</td></tr>
                </>
              )}
            </tbody>

            <thead className={styles.tableHeader}>
              <tr>
                <th>Deductions</th>
                <th>Monthly</th>
                <th>Annually</th>
              </tr>
            </thead>
            <tbody>
              {breakupData?.deductions?.length > 0 ? (
                breakupData.deductions.map((item: any) => (
                  <tr key={item.name} className={styles.tableRow}>
                    <td className={styles.tableCell}>{item.name}</td>
                    <td className={styles.tableCell}>{DEFAULT_CURRENCY} {item.monthly?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className={styles.tableCell}>{DEFAULT_CURRENCY} {item.annually?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr className={styles.tableRow}><td className={styles.tableCell}>PF Employee</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 1,800.00</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 21,600.00</td></tr>
                  <tr className={[styles.tableRow, styles.total].join(' ')}><td className={styles.tableCell}>Total Deductions</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 1,800.00</td><td className={styles.tableCell}>{DEFAULT_CURRENCY} 21,600.00</td></tr>
                </>
              )}
            </tbody>
          </table>

          <div className={styles.netPayRow}>
            <span>NET PAY</span>
            <div>
              <span style={{ marginRight: '4rem' }}>{DEFAULT_CURRENCY} 1,11,250.00</span>
              <span>{DEFAULT_CURRENCY} 13,35,000.00</span>
            </div>
          </div>

          <div className={styles.noteSection}>
            <div className={styles.noteTitle}>
              <Icon name="info" size={16} /> Note
            </div>
            <ul className={styles.noteList}>
              <li>NOTE: Net Pay above does not include Taxes or Other deductions (if any).</li>
            </ul>
          </div>
        </div>
      )}
    </Drawer>
  );
};

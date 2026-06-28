'use client';
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  DataTable,
  Icon,
  Badge,
  ProgressBar,
  Timeline,
  FinanceCard,
  Spinner
} from '@/components';
import { useTranslation } from '@/lib/i18n';
import { API_ENDPOINTS } from '@/app/shared/constants/api-endpoints';
import { apiService } from '@/app/core/services/api-service';
import { DEFAULT_CURRENCY } from '@/components/DataTable/constants';
import styles from '../(shell)/my-finance/my-finance.module.scss';

import { SalaryBreakupDrawer } from '../(shell)/my-finance/SalaryBreakupDrawer';

export default function MyFinanceSection() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [ctcData, setCtcData] = useState<any>(null);
  const [latestPayslip, setLatestPayslip] = useState<any>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [pfData, setPfData] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ctc, payslip, revs, pf] = await Promise.all([
          apiService.get(API_ENDPOINTS.PAYROLL.CTC_SUMMARY),
          apiService.get(API_ENDPOINTS.PAYROLL.LATEST_PAYSLIP),
          apiService.get(API_ENDPOINTS.PAYROLL.REVISIONS),
          apiService.get(API_ENDPOINTS.PAYROLL.PF_DETAILS)
        ]);

        setCtcData(ctc.response?.data || ctc.data || ctc.response);
        setLatestPayslip(payslip.response?.data || payslip.data || payslip.response);
        setRevisions(revs.response?.data || revs.data || revs.response || []);
        setPfData(pf.response?.data || pf.data || pf.response);
      } catch (err) {
        console.error('Failed to fetch finance data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPayPeriod = (row: any) => {
    if (!row) return 'N/A';
    if (row.pay_period) return row.pay_period;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[row.month - 1]} ${row.year}`;
  };

  const handleDownload = async (row: any) => {
    console.log('Starting download for row:', row);
    const payslipId = row.id || row._id;

    if (!payslipId) {
      alert(t('my_finance.invalid_payslip'));
      return;
    }

    try {
      // 1. Generate PDF (POST)
      const generateUrl = API_ENDPOINTS.PAYROLL.GENERATE_PDF(payslipId);
      console.log('Generating PDF:', generateUrl);
      await apiService.post(generateUrl, {});

      // Small delay to ensure server has finished processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Get Download URL (GET)
      const downloadUrl = API_ENDPOINTS.PAYROLL.DOWNLOAD_PAYSLIP(payslipId);
      console.log('Fetching download URL:', downloadUrl);
      const res = await apiService.get(downloadUrl);

      const url = res.response?.data?.url || res.data?.url || res.url || res.response?.url;
      console.log('Download URL received:', url);

      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('No download URL returned from server');
      }
    } catch (err) {
      console.error('Download workflow failed:', err);
      alert(t('my_finance.download_error'));
    }
  };

  const formatToLakhs = (amount: number) => {
    if (!amount) return `${DEFAULT_CURRENCY}0`;
    if (amount >= 100000) {
      return DEFAULT_CURRENCY + (amount / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    }
    return DEFAULT_CURRENCY + amount.toLocaleString('en-IN');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
      </div>
    );
  }

  const payslipColumns = [
    { id: 'period', header: t('my_finance.pay_period'), accessor: (row: any) => getPayPeriod(row), sortable: true },
    { id: 'days', header: t('my_finance.working_days'), field: 'working_days' },
    { id: 'gross', header: t('my_finance.gross'), field: 'gross_salary', cellType: 'currency' },
    { id: 'deductions', header: t('my_finance.deductions'), accessor: (row: any) => `-${(row.total_deductions || row.deductions || 0).toLocaleString('en-IN')}`, cellType: 'amount', className: styles.negative },
    { id: 'net', header: t('my_finance.net_pay'), field: 'net_salary', cellType: 'currency' },
    { id: 'status', header: t('common.status'), accessor: (row: any) => <Badge color="success" size="sm">{row.status || (row.is_published ? 'Paid' : 'Pending')}</Badge> },
    {
      id: 'actions',
      header: t('common.actions'),
      accessor: (row: any) => (
        <Button variant="ghost" size="sm" onClick={() => handleDownload(row)}>
          <Icon name="download" size={16} />
        </Button>
      )
    }
  ];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerArea}>
        <div className={styles.titleGroup}>
          <Typography variant="h1" className={styles.mainTitle}>{t('my_finance.title')}</Typography>
          <Typography as="p" className={styles.subTitle}>{t('my_finance.subtitle')}</Typography>
        </div>
        <Button variant="secondary" iconLeft={<Icon name="file-text" size={16} />}>{t('my_finance.form_16')}</Button>
      </header>

      <section className={styles.dashboardGrid}>
        {/* CTC Card */}
        <FinanceCard
          title={`Annual CTC · ${new Date().getFullYear()}`}
          variant="premium"
          subtitle={`Effective ${ctcData?.effective_from || 'N/A'}`}
        >
          <div className={styles.ctcValue}>{DEFAULT_CURRENCY}{ctcData?.ctc?.toLocaleString('en-IN')}</div>
          <div className={styles.ctcBreakdown}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>{t('my_finance.fixed')}</span>
              <span className={styles.breakdownValue}>{DEFAULT_CURRENCY}{ctcData?.fixed?.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>{t('my_finance.variable')}</span>
              <span className={styles.breakdownValue}>{DEFAULT_CURRENCY}{ctcData?.variable?.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>{t('my_finance.benefits')}</span>
              <span className={styles.breakdownValue}>{DEFAULT_CURRENCY}{ctcData?.benefits?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </FinanceCard>

        {/* Latest Payslip Card */}
        <FinanceCard
          title={`LATEST PAYSLIP · ${getPayPeriod(latestPayslip || {}).toUpperCase()}`}
          className={styles.latestPayslipCard}
          action={<Button variant="ghost" size="sm" iconLeft={<Icon name="download" size={16} />} onClick={() => handleDownload(latestPayslip)} />}
        >
          <div className={styles.payslipNet}>{DEFAULT_CURRENCY}{(latestPayslip?.net_salary || latestPayslip?.net_pay)?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <Typography as="p" className={styles.revLabel}>Net credited to •••• {latestPayslip?.account_end || 'XXXX'} on {latestPayslip?.credit_date || 'N/A'}</Typography>

          <div className={styles.payslipDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{t('my_finance.earnings')}</span>
              <span className={styles.detailValue}>{DEFAULT_CURRENCY}{(latestPayslip?.gross_salary || latestPayslip?.gross)?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{t('my_finance.deductions')}</span>
              <span className={[styles.detailValue, styles.negative].join(' ')}>-{DEFAULT_CURRENCY}{(latestPayslip?.total_deductions || latestPayslip?.deductions)?.toLocaleString('en-IN', { minimumFractionDigits: 1 }).replace('.0', '')}</span>
            </div>
          </div>
        </FinanceCard>
      </section>

      {/* Payslip History */}
      <section className={styles.historySection}>
        <div className={styles.sectionTitle}>
          <span>{t('my_finance.payslip_history')}</span>
          <Button variant="link" size="sm">{t('my_finance.all_payslips')}</Button>
        </div>
        <div className={styles.historyTable}>
          <DataTable
            columns={payslipColumns}
            apiConfig={{
              url: API_ENDPOINTS.PAYROLL.PAYSLIP_HISTORY,
              method: 'GET',

            }}
            pageSize={5}
          />
        </div>
      </section>

      {/* Bottom Section: Earnings Breakup & Revision History */}
      <section className={styles.bottomSectionGrid}>
        <div className={styles.statCard}>
          <Typography variant="h3" className={styles.statTitle}>{t('my_finance.pf_account_info')}</Typography>
          <div className={styles.statutoryInfo}>
            {/* PF Section */}
            <div className={styles.statSection}>
              <div className={styles.statField}>
                <span className={styles.statLabel}>{t('my_finance.pf_status')}</span>
                <span className={styles.statValue}>{pfData?.pf_status || 'Enabled'}</span>
              </div>
              <div className={styles.statGrid}>
                <div className={styles.statField}>
                  <span className={styles.statLabel}>{t('my_finance.pf_number')}</span>
                  <span className={styles.statValue}>{pfData?.pf_number || 'N/A'}</span>
                </div>
                <div className={styles.statField}>
                  <span className={styles.statLabel}>{t('my_finance.uan')}</span>
                  <span className={styles.statValue}>{pfData?.uan || 'N/A'}</span>
                </div>

              </div>
              <div className={styles.statField}>
                <span className={styles.statLabel}>{t('my_finance.account_name')}</span>
                <span className={styles.statValue}>{pfData?.account_name || 'N/A'}</span>
              </div>
            </div>

            {/* ESI Section */}
            <div className={styles.statSection}>
              <Typography variant="h4" className={styles.statSectionTitle}>{t('my_finance.esi_account_info')}</Typography>
              <div className={styles.statField}>
                <span className={styles.statLabel}>{t('my_finance.esi_status')}</span>
                <span className={styles.statValue}>{pfData?.esi_status || 'Not Eligible'}</span>
              </div>
            </div>

            {/* PT Section */}
            <div className={styles.statSection}>
              <Typography variant="h4" className={styles.statSectionTitle}>{t('my_finance.pt_details')}</Typography>
              <div className={styles.statGrid}>
                <div className={styles.statField}>
                  <span className={styles.statLabel}>{t('my_finance.pt_state')}</span>
                  <span className={styles.statValue}>{pfData?.pt_state || 'N/A'}</span>
                </div>
                <div className={styles.statField}>
                  <span className={styles.statLabel}>{t('my_finance.pt_location')}</span>
                  <span className={styles.statValue}>{pfData?.pt_location || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.sectionTitle}>
            <span>Salary revision history</span>
            <span className={styles.revCountBadge}>{revisions.length} revisions</span>
          </div>

            <Timeline
              items={revisions.map((rev: any, index: number) => {
                const isLatest = index === 0;
                const date = new Date(rev.effective_from);
                const dateLabel = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

                return {
                  id: rev.id,
                  title: '',
                  status: isLatest ? 'success' : 'default',
                  active: isLatest,
                  icon: isLatest ? <Icon name="check" size={14} /> : null,
                  content: (
                    <div
                      className={[styles.revisionCard, isLatest && styles.activeRevision].filter(Boolean).join(' ')}
                      onClick={() => {
                        setSelectedRevision(rev);
                        setIsDrawerOpen(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.revHeader}>
                        <div className={styles.revTitleGroup}>
                          <div className={styles.revTitleArea}>
                            <span className={styles.revDate}>{dateLabel}</span>
                            <span className={[styles.revBadge, styles[rev.revision_type?.toLowerCase()] || styles.annual].join(' ')}>
                              {rev.revision_type || 'ANNUAL REVISION'}
                            </span>
                            {isLatest && <span className={styles.currentLabel}>Current</span>}
                          </div>
                          <div className={styles.revSummary}>
                            Revised from {formatToLakhs(rev.old_ctc)} to {formatToLakhs(rev.new_ctc)}
                          </div>
                        </div>
                        <div className={styles.revRight}>
                          <div className={styles.revMainAmount}>
                            <span className={styles.mainAmount}>{formatToLakhs(rev.new_ctc)}</span>
                            <span className={styles.hikePercent}>+{rev.hike_percentage}% hike</span>
                          </div>
                          <Icon name="chevron-right" size={20} color="#cbd5e1" />
                        </div>
                      </div>

                      {isLatest && (
                        <>
                          <div className={styles.revDivider} />
                          <div className={styles.revGrid}>
                            <div className={styles.gridItem}>
                              <span className={styles.gridLabel}>Old Salary</span>
                              <span className={styles.gridValue}>{formatToLakhs(rev.old_ctc)}</span>
                            </div>
                            <div className={styles.gridItem}>
                              <span className={styles.gridLabel}>Revised Salary</span>
                              <span className={styles.gridValue}>{formatToLakhs(rev.new_ctc)}</span>
                            </div>
                            <div className={styles.gridItem}>
                              <span className={styles.gridLabel}>Hike</span>
                              <span className={[styles.gridValue, styles.hike].join(' ')}>+{rev.hike_percentage}% hike</span>
                            </div>
                            <div className={styles.gridItem}>
                              <span className={styles.gridLabel}>Type</span>
                              <span className={styles.gridValue}>{rev.revision_type || 'Annual Revision'}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                };
              })}
            />
          </div>
      </section>

      <SalaryBreakupDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        revision={selectedRevision}
      />
    </div>
  );
}

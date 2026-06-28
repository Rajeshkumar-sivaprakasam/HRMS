'use client';

import { useTranslation } from '@/lib/i18n';
import { Button, Icon, ProgressBar, Chart, Typography } from '@/components';
import type { ChartDataPoint } from '@/components';
import styles from './OrganisationSection.module.scss';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrgNode {
  id: string;
  name: string;
  title: string;
  headcount: number;
  isCeo?: boolean;
  children: OrgNode[];
}

interface LocationRow {
  city: string;
  count: number;
  percent: number;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const ORG_TREE: OrgNode = {
  id: '1',
  name: 'Anika Sharma',
  title: 'CEO',
  headcount: 190,
  isCeo: true,
  children: [
    {
      id: '2',
      name: 'Rahul Bhatia',
      title: 'VP Engineering',
      headcount: 86,
      children: [
        { id: '4', name: 'Dev Patel',   title: 'Eng Lead',    headcount: 18, children: [] },
        { id: '5', name: 'Sneha Iyer',  title: 'Eng Lead',    headcount: 14, children: [] },
      ],
    },
    {
      id: '3',
      name: 'Priya Nair',
      title: 'Head of Design',
      headcount: 24,
      children: [
        { id: '6', name: 'Aarav Mehta', title: 'Design Lead', headcount: 6,  children: [] },
        { id: '7', name: 'Meera Bose',  title: 'UX Lead',     headcount: 4,  children: [] },
        { id: '8', name: 'Neha Gupta',  title: 'Sales Lead',  headcount: 20, children: [] },
      ],
    },
    {
      id: '9',
      name: 'Sara Rajan',
      title: 'VP',
      headcount: 52,
      children: [],
    },
  ],
};

const LOCATIONS: LocationRow[] = [
  { city: 'Bangalore', count: 112, percent: 59 },
  { city: 'Mumbai',    count: 38,  percent: 20 },
  { city: 'Hyderabad', count: 24,  percent: 13 },
  { city: 'Pune',      count: 16,  percent: 8  },
];

const EMPLOYMENT_DATA: ChartDataPoint[] = [
  { label: 'Full-time', value: 168, color: '#6366f1' },
  { label: 'Contract',  value: 14,  color: '#ec4899' },
  { label: 'Intern',    value: 6,   color: '#f59e0b' },
  { label: 'Part-time', value: 2,   color: '#22c55e' },
];

const EMPLOYMENT_TOTAL = EMPLOYMENT_DATA.reduce((s, d) => s + d.value, 0);

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  '#f59e0b', '#6366f1', '#ec4899', '#22c55e',
  '#06b6d4', '#8b5cf6', '#ef4444', '#10b981',
];

function avatarColor(name: string): string {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Recursive tree node ──────────────────────────────────────────────────────

function OrgTreeNode({ node }: { node: OrgNode }) {
  const hasChildren = node.children.length > 0;

  return (
    <div className={styles.treeNode}>
      {/* Node card */}
      <div className={node.isCeo ? styles.nodeCardCeo : styles.nodeCard}>
        <div
          className={styles.nodeAvatar}
          style={{ background: node.isCeo ? 'rgba(255,255,255,0.2)' : avatarColor(node.name) }}
        >
          <Typography as="span" weight="bold" color="white">{initials(node.name)}</Typography>
        </div>
        <div className={styles.nodeInfo}>
          <Typography as="span" weight="semibold" color={node.isCeo ? 'white' : 'primary'} className={styles.nodeName}>
            {node.name}
          </Typography>
          <Typography variant="body2" as="span" color={node.isCeo ? 'white' : 'secondary'} className={styles.nodeMeta}>
            {node.title} · {node.headcount}
          </Typography>
        </div>
      </div>

      {/* Connector line + children */}
      {hasChildren && (
        <>
          <div className={styles.connectorDown} />
          <div className={styles.childrenRow}>
            {node.children.map(child => (
              <div key={child.id} className={styles.childWrapper}>
                <div className={styles.connectorUp} />
                <OrgTreeNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function OrganisationSection() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <Typography variant="h2" className={styles.pageTitle}>{t('organisation.title')}</Typography>
          <Typography variant="body2" as="p" color="secondary" className={styles.pageSubtitle}>{t('organisation.subtitle')}</Typography>
        </div>
        <div className={styles.pageActions}>
          <Button
            variant="secondary"
            iconLeft={<Icon name="download" size={16} />}
          >
            {t('organisation.export_org_chart')}
          </Button>
          <Button
            variant="primary"
            iconLeft={<Icon name="edit" size={16} />}
          >
            {t('organisation.edit_hierarchy')}
          </Button>
        </div>
      </div>

      {/* Org chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartScroll}>
          <div className={styles.chartContent}>
            <OrgTreeNode node={ORG_TREE} />
          </div>
        </div>
      </div>

      {/* Bottom stats row */}
      <div className={styles.statsRow}>
        {/* Headcount by location */}
        <div className={styles.statsCard}>
          <Typography variant="h3" className={styles.statsTitle}>{t('organisation.headcount_by_location')}</Typography>
          <div className={styles.locationList}>
            {LOCATIONS.map(loc => (
              <div key={loc.city} className={styles.locationRow}>
                <div className={styles.locationLabel}>
                  <Icon name="map-pin" size={14} color="var(--ink-400)" />
                  <Typography as="span" weight="medium" color="primary" className={styles.locationCity}>{loc.city}</Typography>
                </div>
                <div className={styles.locationStats}>
                  <Typography as="span" weight="bold" color="primary" className={styles.locationCount}>{loc.count}</Typography>
                  <Typography variant="body2" as="span" color="secondary" className={styles.locationPercent}>{loc.percent}%</Typography>
                </div>
                <ProgressBar value={loc.percent} max={100} className={styles.locationBar} />
              </div>
            ))}
          </div>
        </div>

        {/* Employment type mix */}
        <div className={styles.statsCard}>
          <Typography variant="h3" className={styles.statsTitle}>{t('organisation.employment_type_mix')}</Typography>
          <div className={styles.employmentLayout}>
            <div className={styles.donutWrapper}>
              <Chart
                type="donut"
                data={EMPLOYMENT_DATA}
                width={200}
                height={200}
                showLegend={false}
              />
              <div className={styles.donutCenter}>
                <Typography as="span" weight="bold" color="primary" className={styles.donutCount}>{EMPLOYMENT_TOTAL}</Typography>
                <Typography variant="body2" as="span" color="secondary" className={styles.donutLabel}>{t('organisation.employees')}</Typography>
              </div>
            </div>

            <div className={styles.employmentLegend}>
              {EMPLOYMENT_DATA.map(item => (
                <div key={item.label} className={styles.legendRow}>
                  <span
                    className={styles.legendDot}
                    style={{ background: item.color }}
                  />
                  <Typography as="span" color="primary" className={styles.legendLabel}>{t(`organisation.${item.label.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')}`)}</Typography>
                  <Typography as="span" weight="semibold" color="primary" className={styles.legendValue}>{item.value}</Typography>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import React from 'react';
import { Icon, Chart, Heading, Divider } from '@/components';

export default function IconsChartsSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '1rem 0' }}>
      <div>
        <Heading level="h4" style={{ marginBottom: '1rem' }}>Icons</Heading>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {(['home','search','check-circle','warning','x-circle','user','bell','settings','edit','trash','download','star','heart','globe','calendar','lock'] as const).map(name => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Icon name={name} size="lg" />
              <span style={{ fontSize: 10, color: '#6b7280' }}>{name}</span>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Icon name="loader" size="lg" spin color="#4F46E5" />
            <span style={{ fontSize: 10, color: '#6b7280' }}>loader (spin)</span>
          </div>
        </div>
      </div>
      <Divider />
      <div>
        <Heading level="h4" style={{ marginBottom: '1.5rem' }}>Charts</Heading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <Chart type="bar" title="Monthly Revenue ($)" showGrid showValues data={[
            { label: 'Jan', value: 4200 }, { label: 'Feb', value: 3800 },
            { label: 'Mar', value: 5100 }, { label: 'Apr', value: 6300 },
            { label: 'May', value: 7200 }, { label: 'Jun', value: 5800 },
          ]} />
          <Chart type="line" title="User Growth" showGrid showValues data={[
            { label: 'Q1', value: 1200 }, { label: 'Q2', value: 1950 },
            { label: 'Q3', value: 2800 }, { label: 'Q4', value: 4100 },
          ]} />
          <Chart type="area" title="Weekly Traffic" showGrid data={[
            { label: 'Mon', value: 840 }, { label: 'Tue', value: 1020 },
            { label: 'Wed', value: 960 }, { label: 'Thu', value: 1180 },
            { label: 'Fri', value: 1350 }, { label: 'Sat', value: 620 },
            { label: 'Sun', value: 490 },
          ]} />
          <Chart type="donut" title="Annual Budget" showValues showLegend data={[
            { label: 'Salaries', value: 420000 }, { label: 'Marketing', value: 95000 },
            { label: 'Infra', value: 62000 },    { label: 'R&D', value: 110000 },
          ]} />
        </div>
      </div>
    </div>
  );
}

'use client';
import React from 'react';
import { Badge, Tag, Avatar, Alert, Spinner, ProgressBar } from '@/components';

export default function DisplaySection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Badge color="primary">New</Badge>
        <Badge color="success">Active</Badge>
        <Badge color="warning">Pending</Badge>
        <Badge color="error">Failed</Badge>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Tag dismissible>React</Tag>
        <Tag dismissible>Next.js</Tag>
        <Tag dismissible>TypeScript</Tag>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Avatar name="John Doe" />
        <Avatar name="Alice Bob" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
        <Alert variant="info" title="Information">This is an informational alert.</Alert>
        <Alert variant="success" title="Success">Your action was completed successfully.</Alert>
      </div>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Spinner size="md" />
        <ProgressBar value={65} style={{ flex: 1, minWidth: '120px' }} />
      </div>
    </div>
  );
}

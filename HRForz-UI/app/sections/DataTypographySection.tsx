'use client';
import React from 'react';
import { Table, Heading, Text, Blockquote, Code, Divider } from '@/components';

export default function DataTypographySection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      <Table
        columns={[
          { id: 'name', header: 'Name', accessor: 'name' },
          { id: 'role', header: 'Role', accessor: 'role' },
          { id: 'status', header: 'Status', accessor: 'status' },
        ]}
        data={[
          { name: 'Alice', role: 'Admin', status: 'Active' },
          { name: 'Bob', role: 'User', status: 'Inactive' },
        ]}
        striped
        hoverable
      />
      <Divider />
      <div>
        <Heading level="h3">Typography Elements</Heading>
        <Text variant="body1">Regular body text for general content.</Text>
        <Text variant="body2">Smaller body text for secondary information.</Text>
        <Blockquote>A blockquote for emphasizing important text.</Blockquote>
        <Text>Use <Code>Code</Code> for inline code snippets.</Text>
      </div>
    </div>
  );
}

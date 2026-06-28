'use client';
import React from 'react';
import {
  Card, CardHeader, CardBody, CardFooter,
  Accordion, Tooltip, Popover, Dropdown,
  Button, Text,
} from '@/components';

export default function LayoutSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <Card style={{ flex: '1 1 280px' }}>
          <CardHeader title="Card Title" subtitle="Card Subtitle" />
          <CardBody>
            <Text>This is a flexible card component built with composable parts.</Text>
          </CardBody>
          <CardFooter>
            <Button variant="primary">Action</Button>
          </CardFooter>
        </Card>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Accordion items={[
            { id: '1', title: 'Accordion Item 1', content: 'Content for item 1' },
            { id: '2', title: 'Accordion Item 2', content: 'Content for item 2' },
          ]} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <Tooltip content="This is a tooltip" position="top">
          <Button variant="ghost">Hover for Tooltip</Button>
        </Tooltip>
        <Popover content={<div style={{ padding: '1rem' }}><Text>Popover content</Text></div>} position="top">
          <Button variant="ghost">Click for Popover</Button>
        </Popover>
        <Dropdown
          trigger={<Button variant="ghost">Options ▾</Button>}
          items={[
            { id: '1', label: 'Option 1' },
            { id: '2', label: 'Option 2' },
            { type: 'divider' },
            { id: '3', label: 'Delete', danger: true },
          ]}
        />
      </div>
    </div>
  );
}

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardBody, CardFooter, CardImage } from './Card';
import { Button } from '../Button/Button';

const meta: Meta<typeof Card> = { title: 'Components/Card', component: Card, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: '400px' }}>
      <CardHeader title="Card Title" subtitle="Card subtitle" />
      <CardBody>
        <p>This is the body content of the card. It can contain any elements.</p>
      </CardBody>
      <CardFooter>
        <Button variant="ghost" size="sm">Cancel</Button>
        <Button size="sm">Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Card style={{ maxWidth: '400px' }}>
      <CardImage src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop" alt="Mountain landscape" height={200} />
      <CardBody>
        <h3 style={{ marginBottom: '8px' }}>Beautiful Mountains</h3>
        <p style={{ color: '#64748B', fontSize: '14px' }}>Explore the majestic peaks and breathtaking views.</p>
      </CardBody>
    </Card>
  ),
};

export const Hoverable: Story = {
  render: () => (
    <Card hoverable style={{ maxWidth: '400px' }}>
      <CardBody><p>Hover over me to see the elevation effect.</p></CardBody>
    </Card>
  ),
};

export const Clickable: Story = {
  render: () => (
    <Card clickable onClick={() => alert('Card clicked!')} style={{ maxWidth: '400px' }}>
      <CardBody><p>Click me — I&apos;m interactive!</p></CardBody>
    </Card>
  ),
};

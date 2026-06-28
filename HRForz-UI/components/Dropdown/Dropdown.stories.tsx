import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Dropdown } from './Dropdown';
import { Button } from '../Button/Button';

const meta: Meta<typeof Dropdown> = { title: 'Components/Dropdown', component: Dropdown, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Dropdown>;

const icon = (d: string) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={d}/></svg>;

export const Default: Story = {
  render: () => (
    <Dropdown trigger={<Button variant="secondary">Options ▾</Button>} items={[
      { id: 'edit', label: 'Edit', icon: icon('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'), shortcut: '⌘E' },
      { id: 'duplicate', label: 'Duplicate', icon: icon('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2') },
      { type: 'divider' },
      { id: 'delete', label: 'Delete', danger: true, shortcut: '⌘⌫' },
    ]} />
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Dropdown trigger={<Button variant="secondary">Actions ▾</Button>} items={[
      { type: 'group', label: 'Edit', items: [
        { id: 'cut', label: 'Cut', shortcut: '⌘X' },
        { id: 'copy', label: 'Copy', shortcut: '⌘C' },
        { id: 'paste', label: 'Paste', shortcut: '⌘V' },
      ]},
      { type: 'divider' },
      { type: 'group', label: 'Danger Zone', items: [
        { id: 'archive', label: 'Archive' },
        { id: 'delete', label: 'Delete', danger: true },
      ]},
    ]} />
  ),
};

export const WithSubmenus: Story = {
  render: () => (
    <Dropdown trigger={<Button variant="secondary">Menu ▾</Button>} items={[
      { id: 'new', label: 'New...', children: [
        { id: 'new-file', label: 'File' },
        { id: 'new-folder', label: 'Folder' },
      ]},
      { id: 'open', label: 'Open' },
      { type: 'divider' },
      { id: 'save', label: 'Save', shortcut: '⌘S' },
    ]} />
  ),
};

export const ClickInteraction: Story = {
  render: () => (
    <Dropdown trigger={<Button>Open</Button>} items={[
      { id: 'a', label: 'Option A' },
      { id: 'b', label: 'Option B' },
    ]} />
  ),
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    await expect(canvas.getByRole('menu')).toBeInTheDocument();
  },
};

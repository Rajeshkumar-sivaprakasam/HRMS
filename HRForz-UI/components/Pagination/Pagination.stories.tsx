import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React, { useState } from 'react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = { title: 'Components/Pagination', component: Pagination, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Pagination>;

const PaginationDemo = (props: Partial<React.ComponentProps<typeof Pagination>>) => {
  const [page, setPage] = useState(1);
  return <Pagination currentPage={page} totalPages={20} onPageChange={setPage} {...props} />;
};

export const Default: Story = { render: () => <PaginationDemo /> };
export const WithItemsPerPage: Story = { render: () => <PaginationDemo showItemsPerPage /> };
export const FewPages: Story = { render: () => <PaginationDemo totalPages={5} /> };

export const ClickInteraction: Story = {
  render: () => <PaginationDemo />,
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const nextBtn = canvas.getByLabelText('Next page');
    await userEvent.click(nextBtn);
    await expect(canvas.getByLabelText('Page 2')).toHaveAttribute('aria-current', 'page');
  },
};

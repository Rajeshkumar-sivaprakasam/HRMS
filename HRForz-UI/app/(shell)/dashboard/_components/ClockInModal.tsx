import React from 'react';
import { Modal, Text, Textarea, Button } from '@/components';

interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
  loading?: boolean;
}

export const ClockInModal: React.FC<ClockInModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [remarks, setRemarks] = React.useState('');

  React.useEffect(() => {
    if (isOpen) setRemarks('');
  }, [isOpen]);

  const handleConfirm = () => {
    if (remarks.trim()) {
      onConfirm(remarks.trim());
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clock In"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
        <Text size="sm" color="secondary">
          Ready to start your session? Please provide your remarks below.
        </Text>
        <Textarea
          label="Remarks"
          placeholder="e.g. Starting my day from home / site visit"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={loading}
            disabled={loading || !remarks.trim()}
          >
            Confirm Clock In
          </Button>
        </div>
      </div>
    </Modal>
  );
};

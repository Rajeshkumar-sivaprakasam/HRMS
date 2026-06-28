'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Text, Button, Icon, Alert, Badge, DataTable, DataTableColumn, RowAction, Spinner } from '@/components';
import { REQUIRED_DOCUMENTS } from '../schemas/onboardingSchema';
import { onboardingApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import styles from './Steps.module.scss';

interface DocumentInfo {
  id: string;
  name: string;
  category: string;
  status: "uploaded" | "pending" | "rejected";
  created_at?: string;
  file_url?: string;
  uploaded_by?: string;
}

interface Step5DocumentsProps {
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onBack: () => void;
  isLoading?: boolean;
  onboardingId?: string | null;
}

export default function Step5Documents({ 
  initialData, 
  onSubmit, 
  onBack, 
  isLoading: propIsLoading,
  onboardingId: propOnboardingId 
}: Step5DocumentsProps) {
  const params = useParams();
  const onboardingId = propOnboardingId || params.id as string;
  
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      if (!onboardingId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const res = await onboardingApi.listDocuments(onboardingId);
        console.log('Documents loaded:', res.response);
        setDocuments(Array.isArray(res.response) ? res.response : res.response?.documents || []);
      } catch (err) {
        console.error('Failed to load documents', err);
        setError('Failed to load document status');
      } finally {
        setIsLoading(false);
      }
    }
    loadDocuments();
  }, [onboardingId]);

  const handleUploadClick = (docId: string) => {
    setUploadingDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocId || !onboardingId) return;

    setIsSaving(true);
    setError(null);
    try {
      console.log('Uploading file for category:', uploadingDocId);
      await onboardingApi.uploadDocument(onboardingId, uploadingDocId, file);
      // Refresh document list
      const res = await onboardingApi.listDocuments(onboardingId);
      setDocuments(Array.isArray(res.response) ? res.response : res.response?.documents || []);
    } catch (err: any) {
      console.error('Upload failed', err);
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsSaving(false);
      setUploadingDocId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getDocStatus = (docId: string) => {
    const doc = documents.find(d => d.category === docId);
    return doc ? doc.status : 'pending';
  };

  const getUploadedInfo = (docId: string) => {
    return documents.find(d => d.category === docId);
  };

  // Prepare table data
  const tableData = useMemo(() => {
    return REQUIRED_DOCUMENTS.map(doc => {
      const info = getUploadedInfo(doc.id);
      const status = info?.status || 'pending';
      return {
        id: doc.id,
        label: doc.label,
        required: doc.required,
        status: status,
        statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
        uploaded_by: info?.uploaded_by || null,
        created_at: info?.created_at || null,
        file_url: info?.file_url,
      };
    });
  }, [documents]);

  // Define columns
  const columns: DataTableColumn<any>[] = [
    {
      id: "label",
      header: "Document",
      accessor: (row) => (
        <div className={styles.docNameCell}>
          <span>
            {row.label}
            {row.required && <span className={styles.required}> *</span>}
          </span>
        </div>
      ),
    },
    {
      id: "statusLabel",
      header: "Status",
      accessor: (row) => {
        if (isSaving && row.id === uploadingDocId) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner size="sm" />
              <Text variant="caption" style={{ fontSize: 11 }}>Uploading...</Text>
            </div>
          );
        }
        const status = row.status;
        const variant = status === "verified" || status === "uploaded" ? "success" : (status === "rejected" ? "error" : "warning");
        return (
          <Badge variant="subtle" color={variant as any}>
            {row.statusLabel}
          </Badge>
        );
      }
    },
    {
      id: "uploaded_by",
      header: "Uploaded By",
      field: "uploaded_by",
    },
    {
      id: "created_at",
      header: "Date",
      field: "created_at",
      cellType: "date",
    },
  ];

  // Define actions
  const rowActions: RowAction<any>[] = [
    {
      id: 'upload',
      label: 'Upload',
      icon: 'upload',
      onClick: (row) => handleUploadClick(row.id),
      onState: (row) => ({ 
        disabled: isSaving,
        label: isSaving && row.id === uploadingDocId ? 'Uploading...' : 'Upload'
      })
    },
    {
      id: 'view',
      label: 'View',
      icon: 'eye',
      onClick: (row) => {
        if (row.file_url) window.open(row.file_url, '_blank');
      },
      onState: (row) => ({ visible: !!row.file_url })
    }
  ];

  const pendingDocsCount = REQUIRED_DOCUMENTS.filter(doc => getDocStatus(doc.id) === 'pending').length;
  const uploadedDocsCount = REQUIRED_DOCUMENTS.filter(doc => getDocStatus(doc.id) === 'uploaded').length;
  const rejectedDocsCount = REQUIRED_DOCUMENTS.filter(doc => getDocStatus(doc.id) === 'rejected').length;

  const handleContinue = () => {
    const allRequiredUploaded = REQUIRED_DOCUMENTS.filter(d => d.required).every(d => getDocStatus(d.id) === 'uploaded');
    if (!allRequiredUploaded) {
      setError('Please upload all required documents before continuing');
      return;
    }
    onSubmit({ documents });
  };

  if (isLoading) return <Card style={{ padding: 48, textAlign: 'center' }}><Text>Loading document status...</Text></Card>;

  return (
    <div className={styles.stepContainer}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <Text weight="semibold" style={{ marginBottom: 8, fontSize: 18 }}>Documents & KYC</Text>
            <Text color="secondary" style={{ fontSize: 13 }}>
              Track uploads, mark verified or request re-uploads. Required documents are starred.
            </Text>
          </div>
          <Badge variant="subtle" color="primary">Step 5 of 6</Badge>
        </div>

        {error && <Alert variant="error" style={{ marginBottom: 20 }}>{error}</Alert>}

        <div className={styles.summaryBadges}>
          <div className={`${styles.summaryBadge} ${styles.success}`}>
            <span>{uploadedDocsCount}</span> Uploaded
          </div>
          <div className={`${styles.summaryBadge} ${styles.warning}`}>
            <span>{pendingDocsCount}</span> Pending
          </div>
          <div className={`${styles.summaryBadge} ${styles.error}`}>
            <span>{rejectedDocsCount}</span> Rejected
          </div>
        </div>

        <div className={styles.docsTableContainer}>
          <DataTable 
            columns={columns}
            data={tableData}
            rowActions={rowActions}
            pageSize={10}
            hoverable={true}
            striped={true}
            emptyMessage="No documents required"
          />
        </div>
      </Card>

      <div className={styles.stepFooter}>
        <Button variant="ghost" onClick={onBack}>← Previous</Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost">Save draft</Button>
          <Button 
            variant="primary" 
            onClick={handleContinue}
            disabled={isSaving || propIsLoading}
            style={{ minWidth: 140 }}
          >
            {propIsLoading ? 'Saving...' : 'Save & continue →'}
          </Button>
        </div>
      </div>
    </div>
  );
}

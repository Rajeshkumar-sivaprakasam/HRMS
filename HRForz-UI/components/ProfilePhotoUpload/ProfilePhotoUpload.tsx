import React, { useRef, useState, useEffect } from 'react';
import { Avatar, Button, Icon, Text } from '../index';
import styles from './ProfilePhotoUpload.module.scss';

export interface ProfilePhotoUploadProps {
  value?: File | string | null;
  onChange?: (file: File | null) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  label?: string;
  disabled?: boolean;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  value,
  onChange,
  onBlur,
  error,
  helperText,
  label = 'Profile photo',
  disabled,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    if (typeof value === 'string') {
      setPreview(value);
    } else if (value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange?.(file);
    }
    onBlur?.();
  };

  const handleRemove = () => {
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onBlur?.();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      {label && <Text weight="semibold" className={styles.label}>{label}</Text>}
      
      <div className={styles.wrapper}>
        <div className={styles.avatarWrapper}>
          <Avatar 
            src={preview || undefined} 
            size="xl" 
            className={styles.avatar}
          />
        </div>

        <div className={styles.actions}>
          <div className={styles.buttonGroup}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleFileChange}
              disabled={disabled}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleUploadClick}
              disabled={disabled}
            >
              <Icon name="upload" size={14} />
              Upload photo
            </Button>
            {value && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleRemove}
                disabled={disabled}
              >
                Remove
              </Button>
            )}
          </div>
          
          {error ? (
            <Text color="danger" variant="caption" className={styles.errorText}>{error}</Text>
          ) : (
            <Text color="secondary" variant="caption" className={styles.hint}>
              {helperText || 'JPG or PNG, max 2MB. Square crops work best.'}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
};

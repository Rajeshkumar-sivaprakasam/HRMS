import React from 'react';
import { Text } from '../Typography/Typography';
import styles from './NameInitials.module.scss';

interface NameInitialsProps {
  firstName: string;
  lastName: string;
  subLabel?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const NameInitials: React.FC<NameInitialsProps> = ({
  firstName,
  lastName,
  subLabel,
  size = 32,
  className,
  style,
}) => {
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} style={style}>
      <div 
        className={styles.initials} 
        style={{ 
          width: size, 
          height: size, 
          fontSize: size * 0.35 
        }}
      >
        {initials}
      </div>
      <div className={styles.content}>
        <Text weight="semibold" className={styles.name}>
          {firstName} {lastName}
        </Text>
        {subLabel && (
          <Text color="secondary" className={styles.subLabel}>
            {subLabel}
          </Text>
        )}
      </div>
    </div>
  );
};

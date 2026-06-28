import React from 'react';
import styles from './Spinner.module.scss';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'success' | 'error';
  className?: string; style?: React.CSSProperties;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'primary', className, style }) => (
  <span className={[styles.spinner, styles[size], styles[color], className].filter(Boolean).join(' ')} style={style}
    data-testid="spinner" role="status" aria-label="Loading">
    <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Loading...</span>
  </span>
);

import React from 'react';
import styles from './Card.module.scss';

export interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, hoverable, clickable, onClick, className, style }) => {
  const classes = [styles.card, hoverable && styles.hoverable, clickable && styles.clickable, className].filter(Boolean).join(' ');
  const Tag = clickable ? 'button' : 'div';
  return (
    <Tag
      className={classes}
      style={{ ...(clickable ? { border: 'none', textAlign: 'left', width: '100%', font: 'inherit' } : {}), ...style }}
      onClick={clickable ? onClick : undefined}
      data-testid="card"
    >
      {children}
    </Tag>
  );
};

export interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, actions, children, className }) => (
  <div className={[styles.header, className].filter(Boolean).join(' ')}>
    {children || (
      <>
        <div>
          {title && <div className={styles.headerTitle}>{title}</div>}
          {subtitle && <div className={styles.headerSubtitle}>{subtitle}</div>}
        </div>
        {actions && <div className={styles.headerActions}>{actions}</div>}
      </>
    )}
  </div>
);

export interface CardBodyProps { children: React.ReactNode; className?: string; }
export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => (
  <div className={[styles.body, className].filter(Boolean).join(' ')}>{children}</div>
);

export interface CardFooterProps { children: React.ReactNode; className?: string; }
export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={[styles.footer, className].filter(Boolean).join(' ')}>{children}</div>
);

export interface CardImageProps { src: string; alt: string; height?: number | string; className?: string; }
export const CardImage: React.FC<CardImageProps> = ({ src, alt, height, className }) => (
  <img className={[styles.image, className].filter(Boolean).join(' ')} src={src} alt={alt} style={{ height }} />
);

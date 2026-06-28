import React from 'react';
import styles from './Typography.module.scss';

// ─── Variant & prop types ─────────────────────────────────────────────────────

export type TypographyVariant =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'body1' | 'body2' | 'caption' | 'overline'
  | 'lead' | 'code' | 'blockquote';

export type TypographyWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 600 | 700;
export type TypographyColor  = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'white';

export interface TypographyProps {
  variant?:   TypographyVariant;
  as?:        keyof React.JSX.IntrinsicElements;
  weight?:    TypographyWeight;
  color?:     TypographyColor;
  gradient?:  boolean;
  truncate?:  boolean;
  clamp?:     number;
  children:   React.ReactNode;
  className?: string;
  style?:     React.CSSProperties;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HEADING_VARIANTS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const TEXT_VARIANTS    = new Set(['body1', 'body2', 'caption', 'overline']);

const DEFAULT_TAG: Record<TypographyVariant, keyof React.JSX.IntrinsicElements> = {
  h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
  body1: 'p', body2: 'p', caption: 'span', overline: 'span',
  lead: 'p', code: 'code', blockquote: 'blockquote',
};

const WEIGHT_MAP: Record<TypographyWeight, number> = {
  regular: 400, medium: 500, semibold: 600, bold: 700, 600: 600, 700: 700,
};

const COLOR_MAP: Record<TypographyColor, string> = {
  primary:   '#1e293b',
  secondary: '#64748b',
  success:   '#22c55e',
  warning:   '#f59e0b',
  danger:    '#ef4444',
  white:     '#ffffff',
};

function resolveClasses(variant: TypographyVariant): string[] {
  if (HEADING_VARIANTS.has(variant)) return [styles.heading, styles[variant]];
  if (TEXT_VARIANTS.has(variant))    return [styles.text,    styles[variant]];
  return [styles[variant]]; // lead, code, blockquote — each has its own top-level class
}

// ─── Typography (single unified component) ───────────────────────────────────

export const Typography: React.FC<TypographyProps> = ({
  variant  = 'body1',
  as,
  weight,
  color,
  gradient,
  truncate,
  clamp,
  children,
  className,
  style,
}) => {
  const Tag       = (as ?? DEFAULT_TAG[variant]) as React.ElementType;
  const baseClasses = resolveClasses(variant);

  return (
    <Tag
      className={[
        ...baseClasses,
        gradient && styles.gradient,
        truncate && styles.truncate,
        clamp    && styles.clamp,
        className,
      ].filter(Boolean).join(' ')}
      style={{
        ...(clamp  ? { WebkitLineClamp: clamp }        : {}),
        ...(weight ? { fontWeight: WEIGHT_MAP[weight] } : {}),
        ...(color  ? { color:      COLOR_MAP[color]   } : {}),
        ...style,
      }}
      data-testid="typography"
    >
      {children}
    </Tag>
  );
};

// ─── Backward-compatible named exports ───────────────────────────────────────
// All existing code that imports Heading, Text, Lead, Code, Blockquote
// continues to work without any changes.

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type TextVariant  = 'body1' | 'body2' | 'caption' | 'overline';

export interface HeadingProps {
  level?:     HeadingLevel;
  gradient?:  boolean;
  weight?:    TypographyWeight;
  color?:     TypographyColor;
  children:   React.ReactNode;
  className?: string;
  style?:     React.CSSProperties;
}

export const Heading: React.FC<HeadingProps> = ({ level = 'h2', ...rest }) => (
  <Typography variant={level} {...rest} />
);

export interface TextProps {
  variant?:   TextVariant;
  as?:        keyof React.JSX.IntrinsicElements;
  truncate?:  boolean;
  clamp?:     number;
  weight?:    TypographyWeight;
  color?:     TypographyColor;
  children:   React.ReactNode;
  className?: string;
  style?:     React.CSSProperties;
}

export const Text: React.FC<TextProps> = ({ variant = 'body1', ...rest }) => (
  <Typography variant={variant} {...rest} />
);

export interface LeadProps      { children: React.ReactNode; className?: string; style?: React.CSSProperties; }
export interface CodeProps      { children: React.ReactNode; className?: string; style?: React.CSSProperties; }
export interface BlockquoteProps{ children: React.ReactNode; className?: string; style?: React.CSSProperties; }

export const Lead:       React.FC<LeadProps>       = (props) => <Typography variant="lead"       {...props} />;
export const Code:       React.FC<CodeProps>       = (props) => <Typography variant="code"       {...props} />;
export const Blockquote: React.FC<BlockquoteProps> = (props) => <Typography variant="blockquote" {...props} />;

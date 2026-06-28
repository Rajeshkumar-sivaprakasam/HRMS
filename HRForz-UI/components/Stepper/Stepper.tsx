import React from 'react';
import styles from './Stepper.module.scss';

export interface Step {
  title: string;
  description?: string;
  status?: 'complete' | 'active' | 'error' | 'pending';
}

export interface StepperProps {
  steps: Step[];
  activeStep?: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  style?: React.CSSProperties;
}

export const Stepper: React.FC<StepperProps> = ({ 
  steps, 
  activeStep = 0, 
  orientation = 'horizontal',
  className,
  style
}) => {
  return (
    <div 
      className={[styles.wrapper, styles[orientation], className].filter(Boolean).join(' ')} 
      style={style}
      data-testid="stepper"
      role="group"
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        let status = step.status;
        if (!status) {
          if (index < activeStep) status = 'complete';
          else if (index === activeStep) status = 'active';
          else status = 'pending';
        }

        const isCompleted = status === 'complete';
        const isActive = status === 'active';
        const isError = status === 'error';

        return (
          <div 
            key={index} 
            className={[
              styles.step, 
              isCompleted && styles.completed,
              isActive && styles.active,
              isError && styles.error
            ].filter(Boolean).join(' ')}
            aria-current={isActive ? 'step' : undefined}
          >
            <div className={styles.indicator}>
              {isCompleted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              ) : isError ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                index + 1
              )}
            </div>
            <div className={styles.content}>
              <div className={styles.title}>{step.title}</div>
              {step.description && <div className={styles.description}>{step.description}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

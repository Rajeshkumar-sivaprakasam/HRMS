'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormRenderer, Heading, Text, Icon, Alert, Button } from '@/components';
import { authApi } from '@/lib/api';
import styles from '../login/login.module.scss';
import Image from 'next/image';

const FORGOT_SCHEMA = [
  {
    name: 'email',
    fieldType: 'FNInput',
    type: 'email',
    placeholder: 'Your email',
    colSpan: 'full',
    validations: { required: true, email: true },
    icon: <Icon name="mail" size={16} />,
  },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (values: any) => {
    setStatus('loading');
    try {
      await authApi.forgotPassword(values.email);
      setStatus('success');
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.loginForm}>
          <div style={{ marginBottom: 32 }}>
            <button 
              onClick={() => router.push('/login')}
              style={{ background: 'none', border: 'none', color: '#6366f1', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 0, fontWeight: 600, fontSize: 14 }}
            >
              <Icon name="arrow-left" size={16} />
              Back to Login
            </button>
          </div>

          <Heading level="h2" className={styles.title}>Forgot Password?</Heading>
          <Text color="secondary" style={{ marginBottom: 32 }}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {status === 'error' && (
            <Alert variant="error" style={{ marginBottom: 24 }}>
              {message}
            </Alert>
          )}

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Icon name="check" size={32} />
              </div>
              <Text style={{ marginBottom: 32, fontWeight: 500 }}>{message}</Text>
              <Button variant="primary" style={{ width: '100%' }} onClick={() => router.push('/login')}>
                Back to Login
              </Button>
            </div>
          ) : (
            <FormRenderer
              schema={FORGOT_SCHEMA as any}
              onSubmit={handleSubmit}
              submitLabel={status === 'loading' ? 'Sending link...' : 'Send Reset Link'}
              columns={1}
            />
          )}
        </div>
      </div>

      <div className={styles.rightPanel}>
        <Image 
          src="/images/login-bg.png" 
          alt="Workspace" 
          fill 
          className={styles.bgImage}
          priority
        />
        <div className={styles.quoteContainer}>
          <p className={styles.quoteText}>
            The secret to <span>success</span> is to find the <span>right people</span> and <span>empower</span> them to do their best work.
          </p>
          <p className={styles.quoteAuthor}>— HR Leadership Insight</p>
        </div>
      </div>
    </div>
  );
}

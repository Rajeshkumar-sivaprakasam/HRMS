'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Input, Checkbox, Button, Alert } from '@/components';
import { authApi } from '@/lib/api';
import styles from './login.module.scss';
import Image from 'next/image';

/**
 * Submit button lives inside <form> so it can read the form's pending
 * state via React 19's useFormStatus — no prop drilling of `loading`.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      fullWidth
      size="lg"
      loading={pending}
      className={styles.loginBtn}
    >
      Log In
    </Button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const savedEmail = localStorage.getItem('hrforz_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // React 19 useActionState: the action returns the error string (or null).
  // Pending state is handled by the form and read via useFormStatus above.
  const [error, formAction] = useActionState<string | null, FormData>(
    async (_prev, _formData) => {
      if (!email || !password) {
        return 'Please enter your email and password.';
      }
      try {
        await authApi.login(email, password);

        if (rememberMe) {
          localStorage.setItem('hrforz_remembered_email', email);
        } else {
          localStorage.removeItem('hrforz_remembered_email');
        }

        router.push('/dashboard');
        return null;
      } catch (err) {
        return err instanceof Error
          ? err.message
          : 'Invalid credentials. Please try again.';
      }
    },
    null,
  );

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.loginForm}>
          <div className={styles.logo}>
            <svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 2L14 10L4 6L10 18L4 34H18L24 26L30 34H44L38 18L44 6L34 10L24 2Z" fill="#4f46e5" />
              <path d="M16 20L24 14L32 20L24 28L16 20Z" fill="white" fillOpacity="0.6" />
            </svg>
          </div>

          <h1 className={styles.title}>Welcome back !</h1>
          <p className={styles.subtitle}>Sign in to manage your workforce, payroll &amp; HR operations.</p>

          {error && (
            <Alert variant="error" style={{ marginBottom: 20 }}>
              {error}
            </Alert>
          )}

          <form action={formAction} className={styles.form}>
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="Enter your mail address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              size="md"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              size="md"
            />

            <div className={styles.rememberRow}>
              <Checkbox
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <a
                href="#"
                className={styles.forgotLink}
                onClick={(e) => { e.preventDefault(); router.push('/forgot-password'); }}
              >
                Forgot your password ?
              </a>
            </div>

            <SubmitButton />
          </form>
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
      </div>
    </div>
  );
}

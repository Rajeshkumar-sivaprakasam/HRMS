import React from 'react';
import styles from './Greeting.module.scss';

interface GreetingProps {
  name: string;
  statusMessage?: string;
}

export const Greeting: React.FC<GreetingProps> = ({ name, statusMessage }) => {
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) greeting = 'Good afternoon';
  if (currentHour >= 17) greeting = 'Good evening';

  return (
    <div className={styles.greetingContainer}>
      <div className={styles.left}>
        <h1 className={styles.title}>
          {greeting}, {name} <span className={styles.emoji}>👋</span>
        </h1>
        {statusMessage && (
          <p className={styles.subtitle}>{statusMessage}</p>
        )}
      </div>
    </div>
  );
};

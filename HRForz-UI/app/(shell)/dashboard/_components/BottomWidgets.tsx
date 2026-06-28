import React from 'react';
import { Card, Icon, Badge, Avatar, Button } from '@/components';
import styles from './BottomWidgets.module.scss';
import { Announcement, WhosOutToday, Holiday, Birthday } from '@/lib/types/dashboard';
import { EmptyState } from './EmptyState';

// --- Announcements ---
export const AnnouncementsList: React.FC<{ items: Announcement[] }> = ({ items }) => (
  <Card className={styles.widgetCard}>
    <div className={styles.header}>
      <h3 className={styles.title}>Announcements</h3>
    </div>
    <div className={styles.list}>
      {items.length === 0 ? (
        <EmptyState title="No announcements" description="Important updates will appear here when they are published." icon="megaphone" height={200} />
      ) : (
        items.map(item => (
          <div key={item.id} className={styles.listItem}>
            <div className={`${styles.iconBox} ${styles[item.type]}`}>
              <Icon name={item.type === 'event' ? 'calendar' : item.type === 'policy' ? 'shield' : 'users'} size={18} />
            </div>
            <div className={styles.content}>
              <div className={styles.meta}>
                <span className={`${styles.typeBadge} ${styles[item.type]}`}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </span>
                {item.is_pinned && (
                  <span className={styles.pinned}>
                    <Icon name="star" size={10} /> Pinned
                  </span>
                )}
              </div>
              <h4 className={styles.itemTitle}>{item.title}</h4>
              <p className={styles.itemSub}>{item.author} · {item.time_ago}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </Card>
);

// --- Who's Out Today ---
export const WhosOutTodayList: React.FC<{ items: WhosOutToday[] }> = ({ items }) => (
  <Card className={styles.widgetCard}>
    <div className={styles.header}>
      <h3 className={styles.title}>Who's out today <Badge variant="subtle" size="sm">{items.length}</Badge></h3>
    </div>
    <div className={styles.list}>
      {items.length === 0 ? (
        <EmptyState title="Everyone is in" description="There are no employees out on leave today." icon="users" height={200} />
      ) : (
        items.map(item => (
          <div key={item.id} className={styles.personItem}>
            <Avatar src={item.avatar} name={item.name} size="md" />
            <div className={styles.personContent}>
              <h4 className={styles.personName}>{item.name}</h4>
              <p className={styles.personRole}>{item.role}</p>
            </div>
            <Badge variant="subtle" size="sm">On leave</Badge>
          </div>
        ))
      )}
    </div>
  </Card>
);

// --- Upcoming Holidays ---
export const UpcomingHolidaysList: React.FC<{ items: Holiday[], onCalendarClick?: () => void }> = ({ items, onCalendarClick }) => (
  <Card className={styles.widgetCard}>
    <div className={styles.header}>
      <h3 className={styles.title}>Upcoming holidays</h3>
      <Button variant="link" className={styles.viewAll} onClick={onCalendarClick}>Calendar <Icon name="chevron-right" size={14} /></Button>
    </div>
    <div className={styles.holidayList}>
      {items.length === 0 ? (
        <EmptyState title="No upcoming holidays" description="There are no holidays scheduled for the next few months." icon="calendar" height={200} />
      ) : (
        items.map(item => (
          <div key={item.id} className={styles.holidayItem}>
            <div className={styles.dateBox}>
              <span className={styles.day}>{item.date}</span>
              <span className={styles.month}>{item.month}</span>
            </div>
            <div className={styles.holidayContent}>
              <h4 className={styles.holidayName}>{item.name}</h4>
              <p className={styles.holidayType}>{item.day} · {item.type}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </Card>
);

// --- Birthdays ---
export const BirthdaysList: React.FC<{ items: Birthday[] }> = ({ items }) => (
  <Card className={styles.widgetCard}>
    <div className={styles.header}>
      <h3 className={styles.title}>Birthdays this week</h3>
    </div>
    <div className={styles.list}>
      {items.length === 0 ? (
        <EmptyState title="No birthdays" description="No team members have birthdays this week." icon="gift" height={200} />
      ) : (
        items.map(item => (
          <div key={item.id} className={styles.personItem}>
            <Avatar src={item.avatar} name={item.name} size="md" />
            <div className={styles.personContent}>
              <h4 className={styles.personName}>{item.name}</h4>
              <p className={styles.personRole}>{item.role}</p>
            </div>
            <div className={styles.birthdayAction}>
              <span className={styles.bdayDate}>{item.date}</span>
              <Button variant="ghost" size="sm">Wish</Button>
            </div>
          </div>
        ))
      )}
    </div>
  </Card>
);

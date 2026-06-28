<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version uses **Next.js 16.2.4 with React 19** — breaking changes exist across routing,
data fetching, and rendering APIs. Read `node_modules/next/dist/docs/` before writing any
routing or layout code. Heed all deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# HRForz Component Library — Master Developer & Agent Guide

> Every rule in this file is **mandatory**. They override all default conventions,
> framework defaults, and model training data. Read the entire file before writing a single line.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Creating Pages & Inner Pages](#3-creating-pages--inner-pages)
4. [Localization — MANDATORY](#4-localization--mandatory)
5. [Colors & Design Tokens — MANDATORY](#5-colors--design-tokens--mandatory)
6. [Component Library Reference](#6-component-library-reference)
7. [SCSS & Styling Rules](#7-scss--styling-rules)
8. [TypeScript Rules](#8-typescript-rules)
9. [API Integration](#9-api-integration)
10. [CRUD Page Patterns](#10-crud-page-patterns)
11. [Form Patterns](#11-form-patterns)
12. [DataTable Patterns](#12-datatable-patterns)
13. [Role-Based Access Control](#13-role-based-access-control)
14. [Loading, Error & Empty States](#14-loading-error--empty-states)
15. [Navigation & Sidebar](#15-navigation--sidebar)
16. [Custom Hooks](#16-custom-hooks)
17. [File & Naming Conventions](#17-file--naming-conventions)
18. [Testing](#18-testing)
19. [Pre-Submit Checklist](#19-pre-submit-checklist)

---

## 1. Project Overview

| Key            | Value                                                          |
|----------------|----------------------------------------------------------------|
| Framework      | Next.js 16.2.4, App Router, React 19                          |
| Language       | TypeScript 5 (strict mode)                                    |
| Styling        | SCSS Modules + CSS Custom Properties — **no Tailwind**        |
| i18n           | `lib/i18n` — **every** user-facing string must use `t()`      |
| Auth           | `localStorage`: `hrforz_token`, `hrforz_role`                 |
| HTTP client    | Axios via `app/core/services/api-service.ts`                  |
| Component lib  | `components/` (40+ components) — always import from `@/components` |
| Testing        | Playwright (E2E) + Vitest (unit) + Storybook (component docs) |
| SCSS tokens    | `styles/variables.scss` mirrored as CSS vars in `globals.css` |

---

## 2. Folder Structure

```
app/
  (shell)/                    ← All authenticated, role-guarded pages
    <feature>/
      page.tsx                ← Thin dynamic wrapper ONLY
      [id]/
        page.tsx              ← Dynamic detail page
        edit/
          page.tsx            ← Edit page
      add-new/
        page.tsx              ← Create page
      _components/            ← Feature-local sub-components (not shared app-wide)
    ShellLayout.tsx           ← Sidebar + Navbar + ToastProvider wrapper
    layout.tsx                ← Applies RoleGuard + ShellLayout to all (shell) routes
  sections/                   ← Heavy client sections (loaded via dynamic import)
  shared/
    auth/
      role.guard.tsx          ← Checks hrforz_token; redirects to /login if missing
    components/               ← Shared page-level presentational components
    constants/
      api-endpoints.ts        ← ALL API endpoint strings — never hard-code URLs
    services/                 ← One typed service file per feature domain
  core/
    services/
      api-service.ts          ← Base Axios client — use this for every HTTP call
      http-client.ts          ← Axios instance (baseURL, interceptors, token inject)
  api/                        ← Next.js route handlers (server-side only)
  login/                      ← Public login page (outside shell)
  forgot-password/            ← Public password recovery page
  globals.css                 ← CSS custom properties — single source of truth for tokens
  layout.tsx                  ← Root layout: html/body + I18nProvider

components/                   ← UI library — 40+ components, DO NOT modify without approval
lib/
  i18n/
    index.tsx                 ← I18nProvider + useTranslation hook
    locales/
      en.json                 ← English strings — single source of truth
styles/
  variables.scss              ← All SCSS design tokens
  mixins.scss                 ← Reusable SCSS mixins
  base.scss                   ← Base/reset styles
  theme.scss                  ← Theme-level overrides
stories/                      ← Storybook story files (*.stories.tsx)
tests/                        ← Playwright E2E tests
```

**Path aliases (tsconfig.json):**
```
@/components  → components/
@/lib         → lib/
@/app         → app/
```

---

## 3. Creating Pages & Inner Pages

### 3.1 Where pages live

All authenticated pages go under `app/(shell)/<feature>/page.tsx`.
RoleGuard + ShellLayout are applied automatically by `app/(shell)/layout.tsx`.

**Standard page hierarchy for a feature:**
```
app/(shell)/employees/
  page.tsx              ← list all employees
  add-new/
    page.tsx            ← create form
  [id]/
    page.tsx            ← view detail
    edit/
      page.tsx          ← edit form
  _components/
    EmployeeCard.tsx
    EmployeeCard.module.scss
    EmployeeFilters.tsx
```

### 3.2 page.tsx — always a thin dynamic wrapper

Every `page.tsx` inside `(shell)` must follow this exact pattern:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components';

const EmployeeListSection = dynamic(
  () => import('../../../sections/EmployeeListSection'),
  { loading: () => <Skeleton height={400} />, ssr: false }
);

export default function Page() {
  return <EmployeeListSection />;
}
```

**Rules for page.tsx:**
- Always start with `'use client'`.
- The file must only contain the dynamic import and default export — nothing else.
- Use `ssr: false` on every dynamic import inside `(shell)`.
- Use `<Skeleton height={N} />` as the loading fallback — match height to expected content.
- Never add data fetching, state, hooks, or business logic to `page.tsx`.

### 3.3 Section file — the real page content

Sections live in `app/sections/` and contain all real logic and UI:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  Typography, Card, CardHeader, CardBody,
  Button, Input, Badge, Spinner, Alert,
  Breadcrumb, Icon,
} from '@/components';
import { employeesApi } from '@/app/shared/services/employees-api';
import type { Employee } from '@/app/shared/types/employee';
import styles from './EmployeeListSection.module.scss';

export default function EmployeeListSection() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    employeesApi.getAll()
      .then(res => setEmployees(res.data))
      .catch(() => setError(t('common.error_loading')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <Alert variant="error">{error}</Alert>;

  return (
    <div className={styles.page}>
      <Breadcrumb items={[
        { label: t('nav.dashboard'), href: '/dashboard' },
        { label: t('nav.employees') },
      ]} />

      <div className={styles.header}>
        <Typography variant="h2">{t('employees.title')}</Typography>
        <Button variant="primary" iconLeft={<Icon name="plus" />} href="/employees/add-new">
          {t('employees.add_new')}
        </Button>
      </div>

      {/* content */}
    </div>
  );
}
```

### 3.4 Feature-local sub-components

Components used only within one feature go in `app/(shell)/<feature>/_components/`:

```tsx
// app/(shell)/employees/_components/EmployeeCard.tsx
'use client';

import { useTranslation } from '@/lib/i18n';
import { Card, CardBody, Avatar, Badge, Typography } from '@/components';
import type { Employee } from '@/app/shared/types/employee';
import styles from './EmployeeCard.module.scss';

interface EmployeeCardProps {
  employee: Employee;
  onClick?: (id: string) => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const { t } = useTranslation();
  return (
    <Card onClick={() => onClick?.(employee.id)} className={styles.card}>
      <CardBody className={styles.body}>
        <Avatar name={employee.name} src={employee.avatar} size="md" />
        <div>
          <Typography as="span" weight="semibold">{employee.name}</Typography>
          <Typography variant="body2" as="span" color="secondary">{employee.department}</Typography>
        </div>
        <Badge variant={employee.status === 'active' ? 'success' : 'neutral'}>
          {t(`status.${employee.status}`)}
        </Badge>
      </CardBody>
    </Card>
  );
}
```

---

## 4. Localization — MANDATORY

Every string visible to users **must** go through the `t()` function.
Hard-coded English strings in JSX are a build-blocking error.

### 4.1 Hook usage

```tsx
import { useTranslation } from '@/lib/i18n';

// In any client component:
const { t, locale, setLocale } = useTranslation();

// Basic key lookup
t('common.save')              // → "Save"
t('employees.title')          // → "Employees Management"

// Keys with interpolation (if supported)
t('common.showing_count', { count: 42 })   // → "Showing 42 results"

// Switch language
setLocale('en');   // switches to English
```

### 4.2 Translation file structure

`lib/i18n/locales/en.json` — complete structure reference:

```json
{
  "common": {
    "save":           "Save",
    "cancel":         "Cancel",
    "delete":         "Delete",
    "edit":           "Edit",
    "view":           "View",
    "add":            "Add",
    "create":         "Create",
    "update":         "Update",
    "search":         "Search...",
    "filter":         "Filter",
    "export":         "Export",
    "export_csv":     "Export as CSV",
    "import":         "Import",
    "loading":        "Loading...",
    "no_data":        "No data available",
    "actions":        "Actions",
    "confirm":        "Are you sure?",
    "confirm_delete": "This action cannot be undone.",
    "yes":            "Yes",
    "no":             "No",
    "back":           "Back",
    "next":           "Next",
    "previous":       "Previous",
    "submit":         "Submit",
    "reset":          "Reset",
    "apply":          "Apply",
    "clear":          "Clear",
    "close":          "Close",
    "rows_per_page":  "Rows per page",
    "showing":        "Showing",
    "of":             "of",
    "results":        "results",
    "saved":          "Saved successfully",
    "deleted":        "Deleted successfully",
    "error_loading":  "Failed to load data. Please try again.",
    "error_saving":   "Failed to save. Please try again.",
    "error_deleting": "Failed to delete. Please try again."
  },
  "nav": {
    "dashboard":      "Overview",
    "employees":      "Employees",
    "attendance":     "Attendance",
    "leave":          "Leave",
    "my_finance":     "My Finance",
    "helpdesk":       "Helpdesk",
    "notifications":  "Notifications",
    "settings":       "Settings",
    "sign_out":       "Sign Out"
  },
  "status": {
    "active":         "Active",
    "inactive":       "Inactive",
    "pending":        "Pending",
    "approved":       "Approved",
    "rejected":       "Rejected",
    "open":           "Open",
    "closed":         "Closed",
    "in_progress":    "In Progress"
  },
  "employees": {
    "title":          "Employees Management",
    "add_new":        "Add Employee",
    "columns": {
      "employee":     "EMPLOYEE",
      "id":           "EMPLOYEE ID",
      "department":   "DEPARTMENT",
      "location":     "LOCATION",
      "status":       "STATUS"
    }
  },
  "your_feature": {
    "title":          "Feature Title",
    "subtitle":       "Feature subtitle description"
  }
}
```


### 4.3 Rules

| BAD | GOOD |
|-----|------|
| `<Button>Save</Button>` | `<Button>{t('common.save')}</Button>` |
| `placeholder="Search..."` | `placeholder={t('common.search')}` |
| `title="Are you sure?"` | `title={t('common.confirm')}` |
| `toast({ message: 'Saved!' })` | `toast({ message: t('common.saved') })` |

- Add to `en.json` before using any new key.
- Group keys under the feature name: `employees.*`, `leave.*`, `helpdesk.*`.
- Reuse `common.*` and `status.*` whenever possible — do not duplicate.
- Never concatenate translated strings: BAD → `t('show') + count + t('results')`.

---

## 5. Colors & Design Tokens — MANDATORY

Never write raw hex values, hard-coded pixel values, or inline color strings anywhere.
Use tokens exclusively.

### 5.1 CSS Custom Properties (`app/globals.css`)

```css
/* ── Brand Blue ramp ─────────────────────────────── */
var(--brand-50)   /* #eef4ff  — lightest tint          */
var(--brand-100)  /* #dce9ff                            */
var(--brand-200)  /* #bad2ff                            */
var(--brand-300)  /* #84abff                            */
var(--brand-400)  /* #567bff                            */
var(--brand-500)  /* #2f6df5  — primary brand           */
var(--brand-600)  /* #1f5fe0                            */
var(--brand-700)  /* #1a4ec0                            */
var(--brand-800)  /* #1a3e99                            */
var(--brand-900)  /* #122f73  — darkest shade           */

/* ── Ink / Neutral ───────────────────────────────── */
var(--ink-50)     /* #f6f8fb  — near white              */
var(--ink-100)    /* #edf0f5                            */
var(--ink-200)    /* #d8dde8                            */
var(--ink-300)    /* #b8bfcc                            */
var(--ink-400)    /* #8c95a6                            */
var(--ink-500)    /* #636d7e  — secondary text          */
var(--ink-600)    /* #464f60                            */
var(--ink-700)    /* #343c4a                            */
var(--ink-800)    /* #1e2532  — primary text            */
var(--ink-900)    /* #0f172a  — headings                */

/* ── Surfaces ────────────────────────────────────── */
var(--bg)         /* #f4f6fa  — page background         */
var(--surface)    /* #ffffff  — card / panel surface    */

/* ── Semantic Status ─────────────────────────────── */
var(--green-500)  /* success text / icon                */
var(--green-600)  /* success dark                       */
var(--amber-500)  /* warning text / icon                */
var(--amber-600)  /* warning dark                       */
var(--red-500)    /* error text / icon                  */
var(--red-600)    /* error dark                         */
var(--violet-500) /* informational accent               */
var(--teal-500)   /* secondary accent                   */
var(--pink-500)   /* tertiary accent                    */

/* ── Shape ───────────────────────────────────────── */
var(--r-xs)   /* 6px  */
var(--r-sm)   /* 8px  */
var(--r-md)   /* 10px */
var(--r-lg)   /* 12px */
var(--r-xl)   /* 16px */
var(--r-2xl)  /* 22px */

/* ── Elevation ───────────────────────────────────── */
var(--shadow-xs)  /* tight border shadow                */
var(--shadow-sm)  /* card resting shadow                */
var(--shadow-md)  /* elevated card / dropdown           */
var(--shadow-lg)  /* modal / drawer                     */

/* ── Typography ──────────────────────────────────── */
var(--font-sans)  /* 'Inter', 'SF Pro Text', system-ui  */
```

### 5.2 SCSS Tokens (`styles/variables.scss`)

Use a **relative path** to `styles/variables` aliased as `v`. All token references must be prefixed with `v.`. The `includePaths` in `next.config.ts` only applies to `@import`, not `@use`.

```scss
// ── Colors ─────────────────────────────────────────
$color-primary:        #2f6df5;
$color-primary-hover:  #1f5fe0;
$color-primary-active: #1a4ec0;
$color-success:        #16a34a;
$color-error:          #ef4444;
$color-warning:        #f59e0b;
$color-info:           #6366f1;

// ── Typography scale ────────────────────────────────
$font-size-xs:   12px;
$font-size-sm:   13px;
$font-size-base: 14px;
$font-size-md:   15px;
$font-size-lg:   16px;
$font-size-xl:   18px;
$font-size-2xl:  20px;
$font-size-3xl:  24px;
$font-size-4xl:  48px;

$font-weight-normal:   400;
$font-weight-medium:   500;
$font-weight-semibold: 600;
$font-weight-bold:     700;

$line-height-tight:  1.2;
$line-height-normal: 1.5;
$line-height-loose:  1.8;

// ── Spacing scale ────────────────────────────────────
$space-0:   0;
$space-1:   4px;
$space-2:   8px;
$space-3:   12px;
$space-4:   16px;
$space-5:   20px;
$space-6:   24px;
$space-7:   28px;
$space-8:   32px;
$space-10:  40px;
$space-12:  48px;
$space-16:  64px;

// ── Shape ────────────────────────────────────────────
$radius-xs:   6px;
$radius-sm:   8px;
$radius-md:   10px;
$radius-lg:   12px;
$radius-xl:   16px;
$radius-2xl:  22px;
$radius-full: 9999px;

// ── Elevation ────────────────────────────────────────
$shadow-xs:  0 1px 2px rgba(0,0,0,.05);
$shadow-sm:  0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
$shadow-md:  0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.06);
$shadow-lg:  0 10px 15px rgba(0,0,0,.1), 0 4px 6px rgba(0,0,0,.05);
$shadow-xl:  0 20px 25px rgba(0,0,0,.1), 0 10px 10px rgba(0,0,0,.04);

// ── Motion ───────────────────────────────────────────
$transition-fast: 150ms ease;
$transition-base: 200ms ease;
$transition-slow: 300ms ease;

// ── Z-index ──────────────────────────────────────────
$z-base:     0;
$z-raised:   10;
$z-sticky:   100;
$z-dropdown: 1000;
$z-modal:    1050;
$z-toast:    1080;
$z-tooltip:  1090;
```

### 5.3 Token usage rules

```scss
// MyComponent.module.scss  (e.g. lives at components/Foo/Foo.module.scss)
@use '../../styles/variables' as v;   // relative path — adjust depth to match your file location
@use '../../styles/mixins'    as m;   // optional

.card {
  background:    var(--surface);          // ← CSS var for surface/color
  color:         var(--ink-800);          // ← CSS var for text
  border:        1px solid var(--ink-100);
  padding:       v.$space-4;             // ← SCSS token — always prefix with v.
  border-radius: v.$radius-md;           // ← SCSS token
  box-shadow:    v.$shadow-sm;           // ← SCSS token
  transition:    background v.$transition-base;
}

.title {
  font-size:   v.$font-size-lg;
  font-weight: v.$font-weight-semibold;
  color:       var(--ink-900);
}

.badge-success { color: var(--green-500); }
.badge-error   { color: var(--red-500);   }
.badge-warning { color: var(--amber-500); }
```

**Relative path by file location:**

| File location | `@use` path |
|---|---|
| `components/Foo/Foo.module.scss` | `@use '../../styles/variables' as v` |
| `app/sections/*.module.scss` | `@use '../../styles/variables' as v` |
| `app/(shell)/<feat>/_components/*.module.scss` | `@use '../../../../styles/variables' as v` |

| BAD | GOOD |
|-----|------|
| `color: #2f6df5` | `color: $color-primary` |
| `padding: 16px` | `padding: $space-4` |
| `border-radius: 8px` | `border-radius: $radius-sm` |
| `style={{ color: '#333' }}` | `className={styles.text}` |
| `style={{ padding: 16 }}` | `className={styles.container}` |

Dark mode is automatic — `globals.css` uses `@media (prefers-color-scheme: dark)`.
Never add dark selectors manually in component modules.

---

## 6. Component Library Reference

Always import from `@/components`. Never re-implement an existing component.

### 6.1 Full import map

```tsx
import {
  // ── Layout & Containers ─────────────────────────
  Card, CardHeader, CardBody, CardFooter, CardImage,
  Drawer,
  Accordion,
  Divider,

  // ── Typography ──────────────────────────────────
  Typography,    // single unified component — use variant prop for all text

  // ── Form Controls ───────────────────────────────
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Toggle,
  Autocomplete,
  SegmentedControl,

  // ── Feedback & Status ───────────────────────────
  Alert,
  Badge,
  Tag,
  Spinner,
  Skeleton,
  ProgressBar,
  Modal,
  ConfirmDialog,
  Stepper,
  Toast,

  // ── Navigation ──────────────────────────────────
  Tabs,
  Breadcrumb,
  Navbar,
  Sidebar,
  Pagination,

  // ── Data Display ────────────────────────────────
  Table,
  DataTable,
  Timeline,
  Chart,

  // ── Overlay ─────────────────────────────────────
  Tooltip,
  Popover,
  Dropdown,

  // ── People ──────────────────────────────────────
  Avatar,
  AvatarGroup,
  NameInitials,

  // ── Advanced / Composed ─────────────────────────
  Icon,
  ICON_NAMES,
  FinanceCard,
  FormRenderer,
  DynamicPage,
} from '@/components';
```

### 6.2 Button

```tsx
// Variants
<Button variant="primary">{t('common.save')}</Button>
<Button variant="secondary">{t('common.cancel')}</Button>
<Button variant="ghost">{t('common.view')}</Button>
<Button variant="danger">{t('common.delete')}</Button>
<Button variant="link">{t('common.back')}</Button>

// Sizes
<Button size="sm" />   // compact rows, toolbars
<Button size="md" />   // default
<Button size="lg" />   // hero / primary CTA

// States
<Button loading={isSubmitting}>{t('common.save')}</Button>
<Button disabled={!isValid}>{t('common.submit')}</Button>

// With icons
<Button iconLeft={<Icon name="plus" />}>{t('employees.add_new')}</Button>
<Button iconRight={<Icon name="arrow-right" />}>{t('common.next')}</Button>

// Full width (e.g., mobile forms)
<Button fullWidth variant="primary">{t('common.submit')}</Button>

// As link
<Button variant="primary" href="/employees/add-new">{t('employees.add_new')}</Button>
```

### 6.3 Typography

Use the single `Typography` component for **every** label, heading, paragraph, and inline text.
Never use raw `<h1>`–`<h6>`, `<p>`, or `<span>` for user-visible text.

```tsx
import { Typography } from '@/components';

// ── Headings (variant = h1–h6) ───────────────────────────────────
<Typography variant="h1">{t('page.title')}</Typography>
<Typography variant="h2">{t('section.overview')}</Typography>
<Typography variant="h3">{t('card.details')}</Typography>
<Typography variant="h4">{t('widget.title')}</Typography>

// ── Body text ────────────────────────────────────────────────────
<Typography variant="body1">{t('description.long')}</Typography>
<Typography variant="body2">{employee.email}</Typography>

// ── Small / meta text ────────────────────────────────────────────
<Typography variant="caption" color="secondary">{t('common.showing')}</Typography>
<Typography variant="overline">{t('section.label')}</Typography>

// ── Intro paragraph ──────────────────────────────────────────────
<Typography variant="lead">{t('page.description')}</Typography>

// ── Code & blockquote ────────────────────────────────────────────
<Typography variant="code">{`npm install`}</Typography>
<Typography variant="blockquote">{t('quote.text')}</Typography>

// ── Weight & color overrides ─────────────────────────────────────
<Typography variant="body2" weight="semibold" color="primary">{employee.name}</Typography>
<Typography variant="body2" color="secondary">{employee.department}</Typography>

// ── Render as a different HTML element (default is inferred from variant) ──
<Typography variant="body2" as="span" weight="medium">{label}</Typography>
<Typography variant="caption" as="span" color="secondary">{t('common.showing')}</Typography>

// ── Gradient heading ─────────────────────────────────────────────
<Typography variant="h2" gradient>{t('hero.title')}</Typography>

// ── Truncation ───────────────────────────────────────────────────
<Typography variant="body1" truncate>{longText}</Typography>
<Typography variant="body1" clamp={2}>{longText}</Typography>
```

**Variant → default HTML tag:**

| Variant | Tag | Use for |
|---------|-----|---------|
| `h1`–`h6` | `h1`–`h6` | Page, section, card titles |
| `body1` | `p` | Standard paragraphs |
| `body2` | `p` | Secondary / smaller paragraphs |
| `caption` | `span` | Meta info, timestamps, counts |
| `overline` | `span` | Section labels, category tags |
| `lead` | `p` | Intro / subtitle paragraphs |
| `code` | `code` | Inline code snippets |
| `blockquote` | `blockquote` | Quoted text |

**Color values:** `'primary'` · `'secondary'` · `'success'` · `'warning'` · `'danger'` · `'white'`

**Weight values:** `'regular'` · `'medium'` · `'semibold'` · `'bold'`

### 6.4 Input, Textarea, Select

```tsx
// Text input
<Input
  label={t('field.full_name')}
  placeholder={t('field.full_name_placeholder')}
  value={formData.name}
  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
  error={errors.name}
  required
/>

// Textarea
<Textarea
  label={t('field.description')}
  value={formData.description}
  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
  rows={4}
  error={errors.description}
/>

// Select (static options)
<Select
  label={t('field.department')}
  options={[
    { label: t('dept.engineering'), value: 'engineering' },
    { label: t('dept.hr'),          value: 'hr' },
    { label: t('dept.finance'),     value: 'finance' },
  ]}
  value={formData.department}
  onChange={val => setFormData(p => ({ ...p, department: val }))}
  error={errors.department}
/>

// Autocomplete (searchable select)
<Autocomplete
  label={t('field.manager')}
  options={managerOptions}
  value={formData.managerId}
  onChange={val => setFormData(p => ({ ...p, managerId: val }))}
  placeholder={t('common.search')}
/>
```

### 6.5 Checkbox, Radio, Toggle

```tsx
// Single checkbox
<Checkbox
  label={t('field.agree_terms')}
  checked={formData.agreedTerms}
  onChange={checked => setFormData(p => ({ ...p, agreedTerms: checked }))}
/>

// Checkbox group
<CheckboxGroup
  label={t('field.permissions')}
  options={permissionOptions}
  value={formData.permissions}
  onChange={vals => setFormData(p => ({ ...p, permissions: vals }))}
/>

// Radio group
<RadioGroup
  label={t('field.employment_type')}
  options={[
    { label: t('employment.full_time'), value: 'full_time' },
    { label: t('employment.part_time'), value: 'part_time' },
    { label: t('employment.contract'),  value: 'contract'  },
  ]}
  value={formData.employmentType}
  onChange={val => setFormData(p => ({ ...p, employmentType: val }))}
/>

// Toggle (on/off switch)
<Toggle
  label={t('field.is_active')}
  checked={formData.isActive}
  onChange={val => setFormData(p => ({ ...p, isActive: val }))}
/>
```

### 6.6 Card

```tsx
// Full card
<Card>
  <CardHeader>
    <Typography variant="h3">{t('section.personal_info')}</Typography>
    <Typography variant="body2" color="secondary">{t('section.personal_info_desc')}</Typography>
  </CardHeader>
  <CardBody>
    {/* form fields or data */}
  </CardBody>
  <CardFooter>
    <Button variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
    <Button variant="primary"   onClick={onSave}   loading={isSaving}>
      {t('common.save')}
    </Button>
  </CardFooter>
</Card>

// Simple card (no header/footer)
<Card>
  <CardBody>
    <Typography variant="body1">{content}</Typography>
  </CardBody>
</Card>
```

### 6.7 Badge & Tag

```tsx
// Badge — for status indicators
<Badge variant="success">{t('status.active')}</Badge>
<Badge variant="error"  >{t('status.rejected')}</Badge>
<Badge variant="warning">{t('status.pending')}</Badge>
<Badge variant="neutral">{t('status.inactive')}</Badge>
<Badge variant="info"   >{t('status.in_progress')}</Badge>

// Dynamic status → badge variant mapping
const STATUS_VARIANT = {
  active:      'success',
  approved:    'success',
  inactive:    'neutral',
  rejected:    'error',
  pending:     'warning',
  in_progress: 'info',
} as const;

<Badge variant={STATUS_VARIANT[employee.status]}>
  {t(`status.${employee.status}`)}
</Badge>

// Tag — removable label
<Tag onRemove={() => removeFilter('department')}>
  {t('dept.engineering')}
</Tag>
```

### 6.8 Modal & ConfirmDialog

```tsx
// Modal
const [modalOpen, setModalOpen] = useState(false);

<Button onClick={() => setModalOpen(true)}>{t('common.view')}</Button>

<Modal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  title={t('employee.details_title')}
  size="lg"                          // 'sm' | 'md' | 'lg' | 'xl'
>
  <EmployeeDetailContent employee={selected} />
</Modal>

// ConfirmDialog — for destructive actions
const [confirmOpen, setConfirmOpen] = useState(false);

<Button variant="danger" onClick={() => setConfirmOpen(true)}>
  {t('common.delete')}
</Button>

<ConfirmDialog
  open={confirmOpen}
  title={t('common.confirm')}
  description={t('common.confirm_delete')}
  confirmLabel={t('common.delete')}
  cancelLabel={t('common.cancel')}
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
/>
```

### 6.9 Toast notifications

`ToastProvider` is already mounted in `ShellLayout` — just call the hook.

```tsx
import { useToast } from '@/components';

const { toast } = useToast();

// Success
toast({ variant: 'success', message: t('common.saved') });

// Error
toast({ variant: 'error',   message: t('common.error_saving') });

// Warning
toast({ variant: 'warning', message: t('leave.quota_exceeded') });

// Info
toast({ variant: 'info',    message: t('notifications.new_message') });

// Custom duration (ms)
toast({ variant: 'success', message: t('common.saved'), duration: 5000 });
```

### 6.10 Alert

```tsx
// Inline alerts (inside page content)
<Alert variant="error"  >{t('common.error_loading')}</Alert>
<Alert variant="warning">{t('leave.quota_warning')}</Alert>
<Alert variant="success">{t('common.saved')}</Alert>
<Alert variant="info"   >{t('onboarding.step_hint')}</Alert>

// With title
<Alert variant="warning" title={t('alert.attention')}>
  {t('leave.quota_nearly_exceeded')}
</Alert>
```

### 6.11 Skeleton & Spinner

```tsx
// Spinner — for full section or async actions
if (loading) return <Spinner />;
<Button loading={isSaving}>{t('common.save')}</Button>

// Skeleton — for page-level or list-level loading placeholders
// Single block
<Skeleton height={200} />

// Multiple rows (table placeholder)
{Array.from({ length: 5 }).map((_, i) => (
  <Skeleton key={i} height={48} style={{ marginBottom: 8 }} />
))}

// Inline text placeholder
<Skeleton width={120} height={16} />
```

### 6.12 Tabs

```tsx
const [activeTab, setActiveTab] = useState('personal');

<Tabs
  value={activeTab}
  onChange={setActiveTab}
  items={[
    { value: 'personal',    label: t('tab.personal_info')  },
    { value: 'employment',  label: t('tab.employment')     },
    { value: 'payroll',     label: t('tab.payroll')        },
    { value: 'documents',   label: t('tab.documents')      },
  ]}
/>

{activeTab === 'personal'   && <PersonalInfoTab   />}
{activeTab === 'employment' && <EmploymentTab     />}
{activeTab === 'payroll'    && <PayrollTab        />}
{activeTab === 'documents'  && <DocumentsTab      />}
```

### 6.13 Breadcrumb

```tsx
// Always include breadcrumbs on detail and nested pages
<Breadcrumb items={[
  { label: t('nav.dashboard'),  href: '/dashboard'        },
  { label: t('nav.employees'),  href: '/employees'        },
  { label: employee.name                                  },  // last item — no href
]} />
```

### 6.14 Pagination

```tsx
<Pagination
  currentPage={page}
  totalPages={Math.ceil(total / pageSize)}
  pageSize={pageSize}
  pageSizeOptions={[10, 25, 50]}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  totalItems={total}
  labels={{
    rowsPerPage: t('common.rows_per_page'),
    showing:     t('common.showing'),
    of:          t('common.of'),
    results:     t('common.results'),
  }}
/>
```

### 6.15 Icon

```tsx
import { Icon, ICON_NAMES } from '@/components';

// Check ICON_NAMES for every valid name — never guess
<Icon name="users"          size={20} />
<Icon name="clock"          size={16} color="var(--ink-500)" />
<Icon name="arrow-right"    size={14} />
<Icon name="plus"           size={18} />
<Icon name="trash"          size={16} color="var(--red-500)" />
<Icon name="check"          size={16} color="var(--green-500)" />
<Icon name="chevron-down"   size={12} />
```

### 6.16 Avatar & AvatarGroup

```tsx
// Single
<Avatar name="Rajesh Kumar" src={employee.avatarUrl} size="md" />
// size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Group (overlapping)
<AvatarGroup max={4}>
  {teamMembers.map(m => (
    <Avatar key={m.id} name={m.name} src={m.avatar} />
  ))}
</AvatarGroup>
```

### 6.17 Drawer

```tsx
const [drawerOpen, setDrawerOpen] = useState(false);

<Button onClick={() => setDrawerOpen(true)}>{t('filter.open')}</Button>

<Drawer
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  title={t('filter.title')}
  placement="right"                  // 'left' | 'right'
  size="md"                          // 'sm' | 'md' | 'lg'
>
  <FilterForm onApply={handleApply} onClear={handleClear} />
</Drawer>
```

### 6.18 Tooltip & Popover

```tsx
// Tooltip — text hint on hover
<Tooltip content={t('tooltip.export_csv')}>
  <Button variant="ghost" iconLeft={<Icon name="download" />} />
</Tooltip>

// Popover — rich content on click
<Popover
  trigger={<Button variant="ghost">{t('filter.title')}</Button>}
  content={<FilterPanel />}
  placement="bottom-start"
/>
```

### 6.19 ProgressBar & Stepper

```tsx
// ProgressBar — file upload, quota display
<ProgressBar value={65} max={100} label={t('leave.used_days')} showLabel />

// Stepper — multi-step form progress indicator
<Stepper
  steps={[
    { label: t('step.personal'),   status: 'complete' },
    { label: t('step.employment'), status: 'active'   },
    { label: t('step.documents'),  status: 'pending'  },
    { label: t('step.review'),     status: 'pending'  },
  ]}
  currentStep={currentStep}
/>
```

---

## 7. SCSS & Styling Rules

### 7.1 Every component needs a SCSS module

```scss
// ComponentName.module.scss
@use '../../styles/variables' as v;   // relative path + v. prefix — ALWAYS first line

.container {
  background:    var(--surface);
  padding:       v.$space-6;
  border-radius: v.$radius-lg;
  box-shadow:    v.$shadow-sm;
}

.header {
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  margin-bottom:   v.$space-4;
  gap:             v.$space-3;
}

.title {
  font-size:   v.$font-size-lg;
  font-weight: v.$font-weight-semibold;
  color:       var(--ink-900);
}
```

### 7.2 Responsive breakpoints

```scss
// Tablet (≤ 768px)
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}

// Mobile (≤ 480px)
@media (max-width: 480px) {
  .header { flex-direction: column; align-items: flex-start; }
}
```

### 7.3 Layout utilities (write in module, not inline)

```scss
// Common layout patterns
.pageContainer {
  padding:    v.$space-6;
  max-width:  1280px;
}

.flexRow {
  display:     flex;
  align-items: center;
  gap:         v.$space-3;
}

.grid2 { display: grid; grid-template-columns: 1fr 1fr;       gap: v.$space-4; }
.grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: v.$space-4; }
.grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: v.$space-4; }
```

### 7.4 Hard rules

1. `@use '../../styles/variables' as v;` (relative path) is the first line of every `.module.scss` file. Always prefix tokens with `v.`.
2. Never use `style={{}}` for anything that can be a CSS class.
3. Never import from `styles/` directly — only `@use 'variables'` and `@use 'mixins'`.
4. Never write `!important`.
5. Never use hardcoded colors, sizes, or z-index values — always tokens.
6. Do not write dark mode media queries in component modules.

---

## 8. TypeScript Rules

### 8.1 Props must always be typed

```tsx
// Define interface above the component, exported if used outside the file
export interface EmployeeCardProps {
  employee:   Employee;
  selected?:  boolean;
  onSelect?:  (id: string) => void;
  onDelete?:  (id: string) => void;
  className?: string;
}

export function EmployeeCard({ employee, selected, onSelect, onDelete }: EmployeeCardProps) {
  // ...
}
```

### 8.2 Domain types live in `app/shared/types/`

```ts
// app/shared/types/employee.ts
export interface Employee {
  id:           string;
  name:         string;
  email:        string;
  department:   string;
  location:     string;
  status:       'active' | 'inactive';
  role:         'employee' | 'hr_admin' | 'manager';
  avatarUrl?:   string;
  joinedAt:     string;  // ISO date string
}

export interface CreateEmployeeDto {
  name:         string;
  email:        string;
  department:   string;
  location:     string;
  employmentType: 'full_time' | 'part_time' | 'contract';
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {}
```

### 8.3 Rules

| Rule | Detail |
|------|--------|
| No `any` | Use `unknown` + type narrowing, or define a proper type |
| No implicit `any` | Enable `strict: true` in `tsconfig.json` |
| Exports | Named exports for components; default export only for `page.tsx` |
| Co-location | Keep types in the same file until used in 3+ files, then move to `types/` |
| API responses | Always type the expected shape — never access `.data` without a type |
| Union literals | Use string union literals for status, roles, variants — never `string` |

---

## 9. API Integration

### 9.1 HTTP client

`app/core/services/http-client.ts` — Axios instance with:
- `baseURL` from `process.env.NEXT_PUBLIC_API_URL`
- Request interceptor: injects `Authorization: Bearer <hrforz_token>`
- Response interceptor: redirects to `/login` on 401

Never create a new Axios instance. Always use `apiService` from `api-service.ts`.

### 9.2 Service file pattern

One file per feature domain:

```ts
// app/shared/services/employees-api.ts
import { apiService } from '@/app/core/services/api-service';
import { API_ENDPOINTS } from '@/app/shared/constants/api-endpoints';
import type { Employee, CreateEmployeeDto, UpdateEmployeeDto } from '@/app/shared/types/employee';

export const employeesApi = {
  getAll:   (params?: Record<string, unknown>) =>
              apiService.get<Employee[]>(API_ENDPOINTS.EMPLOYEES.LIST, { params }),

  getById:  (id: string) =>
              apiService.get<Employee>(API_ENDPOINTS.EMPLOYEES.DETAIL(id)),

  create:   (data: CreateEmployeeDto) =>
              apiService.post<Employee>(API_ENDPOINTS.EMPLOYEES.CREATE, data),

  update:   (id: string, data: UpdateEmployeeDto) =>
              apiService.put<Employee>(API_ENDPOINTS.EMPLOYEES.UPDATE(id), data),

  delete:   (id: string) =>
              apiService.delete(API_ENDPOINTS.EMPLOYEES.DELETE(id)),

  export:   (format: 'csv' | 'xlsx') =>
              apiService.get(API_ENDPOINTS.EMPLOYEES.EXPORT, { params: { format }, responseType: 'blob' }),
};
```

### 9.3 Endpoint constants

All URL strings go in `app/shared/constants/api-endpoints.ts`:

```ts
export const API_ENDPOINTS = {
  EMPLOYEES: {
    LIST:    '/api/employees',
    DETAIL:  (id: string) => `/api/employees/${id}`,
    CREATE:  '/api/employees',
    UPDATE:  (id: string) => `/api/employees/${id}`,
    DELETE:  (id: string) => `/api/employees/${id}`,
    EXPORT:  '/api/employees/export',
  },
  LEAVE: {
    LIST:    '/api/leave',
    APPLY:   '/api/leave/apply',
    APPROVE: (id: string) => `/api/leave/${id}/approve`,
    REJECT:  (id: string) => `/api/leave/${id}/reject`,
  },
  // Add new feature endpoints here
} as const;
```

---

## 10. CRUD Page Patterns

### 10.1 List page with filters + table + pagination

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  Typography, Button, Input, Select, Badge, Spinner, Alert,
  ConfirmDialog, Icon, Pagination, Breadcrumb, useToast,
} from '@/components';
import { employeesApi } from '@/app/shared/services/employees-api';
import { STATUS_VARIANT } from '@/app/shared/constants/status';
import type { Employee } from '@/app/shared/types/employee';
import styles from './EmployeeListSection.module.scss';

export default function EmployeeListSection() {
  const { t }          = useTranslation();
  const { toast }      = useToast();

  const [employees,   setEmployees]   = useState<Employee[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('');
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(25);
  const [total,       setTotal]       = useState(0);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    employeesApi.getAll({ search, status: statusFilter, page, pageSize })
      .then(res => { setEmployees(res.data.items); setTotal(res.data.total); })
      .catch(() => setError(t('common.error_loading')))
      .finally(() => setLoading(false));
  }, [search, statusFilter, page, pageSize, t]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await employeesApi.delete(deleteId);
      toast({ variant: 'success', message: t('common.deleted') });
      setDeleteId(null);
      load();
    } catch {
      toast({ variant: 'error', message: t('common.error_deleting') });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Breadcrumb items={[
        { label: t('nav.dashboard'), href: '/dashboard' },
        { label: t('nav.employees') },
      ]} />

      <div className={styles.pageHeader}>
        <Typography variant="h2">{t('employees.title')}</Typography>
        <Button variant="primary" iconLeft={<Icon name="plus" />} href="/employees/add-new">
          {t('employees.add_new')}
        </Button>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          iconLeft={<Icon name="search" size={16} />}
        />
        <Select
          placeholder={t('filter.status')}
          options={[
            { label: t('status.active'),   value: 'active'   },
            { label: t('status.inactive'), value: 'inactive' },
          ]}
          value={statusFilter}
          onChange={val => { setStatusFilter(val); setPage(1); }}
          clearable
        />
        <Button variant="ghost" onClick={load} iconLeft={<Icon name="refresh" size={16} />}>
          {t('common.reset')}
        </Button>
      </div>

      {loading && <Spinner />}
      {error   && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('employees.columns.employee')}</th>
                <th>{t('employees.columns.department')}</th>
                <th>{t('employees.columns.location')}</th>
                <th>{t('employees.columns.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>{t('common.no_data')}</td></tr>
              )}
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.department}</td>
                  <td>{emp.location}</td>
                  <td>
                    <Badge variant={STATUS_VARIANT[emp.status]}>
                      {t(`status.${emp.status}`)}
                    </Badge>
                  </td>
                  <td className={styles.actions}>
                    <Button variant="ghost" size="sm" href={`/employees/${emp.id}`}>
                      {t('common.view')}
                    </Button>
                    <Button variant="ghost" size="sm" href={`/employees/${emp.id}/edit`}>
                      {t('common.edit')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(emp.id)}>
                      <Icon name="trash" size={16} color="var(--red-500)" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / pageSize)}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={p => { setPageSize(p); setPage(1); }}
            labels={{
              rowsPerPage: t('common.rows_per_page'),
              showing:     t('common.showing'),
              of:          t('common.of'),
              results:     t('common.results'),
            }}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t('common.confirm')}
        description={t('common.confirm_delete')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
```

### 10.2 Create / Edit form page

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import {
  Typography, Card, CardHeader, CardBody, CardFooter,
  Button, Input, Select, Toggle, Breadcrumb, Alert, useToast,
} from '@/components';
import { employeesApi } from '@/app/shared/services/employees-api';
import type { CreateEmployeeDto } from '@/app/shared/types/employee';
import styles from './EmployeeFormSection.module.scss';

const INITIAL: CreateEmployeeDto = {
  name:           '',
  email:          '',
  department:     '',
  location:       '',
  employmentType: 'full_time',
};

export default function EmployeeFormSection() {
  const { t }     = useTranslation();
  const { toast } = useToast();
  const router    = useRouter();

  const [formData, setFormData] = useState<CreateEmployeeDto>(INITIAL);
  const [errors,   setErrors]   = useState<Partial<Record<keyof CreateEmployeeDto, string>>>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = <K extends keyof CreateEmployeeDto>(key: K, val: CreateEmployeeDto[K]) =>
    setFormData(p => ({ ...p, [key]: val }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!formData.name.trim())       e.name       = t('validation.required');
    if (!formData.email.trim())      e.email      = t('validation.required');
    if (!formData.department.trim()) e.department = t('validation.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      await employeesApi.create(formData);
      toast({ variant: 'success', message: t('common.saved') });
      router.push('/employees');
    } catch {
      setApiError(t('common.error_saving'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <Breadcrumb items={[
        { label: t('nav.dashboard'),  href: '/dashboard' },
        { label: t('nav.employees'),  href: '/employees' },
        { label: t('employees.add_new') },
      ]} />

      <Typography variant="h2">{t('employees.add_new')}</Typography>

      {apiError && <Alert variant="error">{apiError}</Alert>}

      <Card>
        <CardHeader>
          <Typography variant="h3">{t('section.personal_info')}</Typography>
        </CardHeader>
        <CardBody className={styles.grid2}>
          <Input  label={t('field.full_name')}  value={formData.name}       onChange={e => set('name', e.target.value)}       error={errors.name}       required />
          <Input  label={t('field.email')}       value={formData.email}      onChange={e => set('email', e.target.value)}      error={errors.email}      required />
          <Select label={t('field.department')}  value={formData.department} onChange={val => set('department', val)}          error={errors.department} options={DEPT_OPTIONS} required />
          <Input  label={t('field.location')}    value={formData.location}   onChange={e => set('location', e.target.value)}   />
          <Select label={t('field.employment_type')} value={formData.employmentType} onChange={val => set('employmentType', val)} options={EMPLOYMENT_OPTIONS} />
        </CardBody>
        <CardFooter>
          <Button variant="secondary" href="/employees">{t('common.cancel')}</Button>
          <Button variant="primary"   onClick={handleSubmit} loading={saving}>
            {t('common.save')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### 10.3 Detail view page

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams }           from 'next/navigation';
import { useTranslation }      from '@/lib/i18n';
import {
  Typography, Card, CardHeader, CardBody, Badge,
  Avatar, Button, Skeleton, Alert, Breadcrumb, Tabs, Icon,
} from '@/components';
import { employeesApi }  from '@/app/shared/services/employees-api';
import { STATUS_VARIANT } from '@/app/shared/constants/status';
import type { Employee }  from '@/app/shared/types/employee';
import styles from './EmployeeDetailSection.module.scss';

export default function EmployeeDetailSection() {
  const { t }           = useTranslation();
  const { id }          = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    employeesApi.getById(id)
      .then(res => setEmployee(res.data))
      .catch(() => setError(t('common.error_loading')))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) return <Skeleton height={400} />;
  if (error || !employee) return <Alert variant="error">{error ?? t('common.error_loading')}</Alert>;

  return (
    <div className={styles.page}>
      <Breadcrumb items={[
        { label: t('nav.dashboard'), href: '/dashboard'        },
        { label: t('nav.employees'), href: '/employees'        },
        { label: employee.name                                  },
      ]} />

      <div className={styles.pageHeader}>
        <div className={styles.identity}>
          <Avatar name={employee.name} src={employee.avatarUrl} size="xl" />
          <div>
            <Typography variant="h2">{employee.name}</Typography>
            <Badge variant={STATUS_VARIANT[employee.status]}>
              {t(`status.${employee.status}`)}
            </Badge>
          </div>
        </div>
        <Button variant="secondary" href={`/employees/${id}/edit`} iconLeft={<Icon name="edit" />}>
          {t('common.edit')}
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: 'overview',   label: t('tab.overview')    },
          { value: 'attendance', label: t('tab.attendance')  },
          { value: 'leave',      label: t('tab.leave')       },
          { value: 'documents',  label: t('tab.documents')   },
        ]}
      />

      {activeTab === 'overview' && (
        <Card>
          <CardHeader><Typography variant="h3">{t('section.personal_info')}</Typography></CardHeader>
          <CardBody className={styles.detailGrid}>
            <div><span>{t('field.email')}</span><span>{employee.email}</span></div>
            <div><span>{t('field.department')}</span><span>{employee.department}</span></div>
            <div><span>{t('field.location')}</span><span>{employee.location}</span></div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
```

---

## 11. Form Patterns

### 11.1 Multi-step form (custom hook pattern)

```tsx
// app/shared/hooks/useMultiStepForm.ts
import { useState } from 'react';

interface UseMultiStepFormOptions<T> {
  steps:        number;
  initialData:  T;
}

export function useMultiStepForm<T>({ steps, initialData }: UseMultiStepFormOptions<T>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData,    setFormData]    = useState<T>(initialData);
  const [errors,      setErrors]      = useState<Partial<Record<string, string>>>({});
  const [isLoading,   setIsLoading]   = useState(false);

  const updateStepData = (patch: Partial<T>) =>
    setFormData(p => ({ ...p, ...patch }));

  const nextStep = () => setCurrentStep(s => Math.min(s + 1, steps - 1));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 0));
  const goToStep = (n: number) => setCurrentStep(n);

  const getProgressPercentage = () =>
    Math.round(((currentStep + 1) / steps) * 100);

  return {
    currentStep, formData, errors, isLoading,
    updateStepData, nextStep, prevStep, goToStep,
    getProgressPercentage, setErrors, setIsLoading,
  };
}
```

Usage:

```tsx
const { currentStep, formData, nextStep, prevStep, updateStepData, getProgressPercentage } =
  useMultiStepForm({ steps: 4, initialData: INITIAL_EMPLOYEE_DATA });

<ProgressBar value={getProgressPercentage()} max={100} />

<Stepper
  steps={STEP_LABELS.map((label, i) => ({
    label,
    status: i < currentStep ? 'complete' : i === currentStep ? 'active' : 'pending',
  }))}
  currentStep={currentStep}
/>

{currentStep === 0 && <Step1Personal  data={formData} onChange={updateStepData} />}
{currentStep === 1 && <Step2Employment data={formData} onChange={updateStepData} />}
{currentStep === 2 && <Step3Documents  data={formData} onChange={updateStepData} />}
{currentStep === 3 && <Step4Review     data={formData} />}

<div className={styles.stepActions}>
  {currentStep > 0 && (
    <Button variant="secondary" onClick={prevStep}>{t('common.previous')}</Button>
  )}
  {currentStep < 3 ? (
    <Button variant="primary" onClick={nextStep}>{t('common.next')}</Button>
  ) : (
    <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
      {t('common.submit')}
    </Button>
  )}
</div>
```

### 11.2 FormRenderer (JSON-driven forms)

```tsx
import { FormRenderer } from '@/components';

const FORM_SCHEMA = [
  { type: 'input',  name: 'name',       label: 'Full Name',   required: true  },
  { type: 'input',  name: 'email',      label: 'Email',       required: true  },
  { type: 'select', name: 'department', label: 'Department',  options: DEPTS  },
  { type: 'toggle', name: 'isActive',   label: 'Active'                       },
];

<FormRenderer
  schema={FORM_SCHEMA}
  value={formData}
  onChange={setFormData}
  onSubmit={handleSubmit}
  submitLabel={t('common.save')}
/>
```

---

## 12. DataTable Patterns

```tsx
import { DataTable } from '@/components';

const columns = [
  {
    key:    'employee',
    header: t('employees.columns.employee'),
    render: (row: Employee) => (
      <div className={styles.employeeCell}>
        <Avatar name={row.name} size="sm" />
        <div>
          <Typography as="span" weight="medium">{row.name}</Typography>
          <Typography variant="caption" as="span" color="secondary">{row.email}</Typography>
        </div>
      </div>
    ),
  },
  {
    key:    'department',
    header: t('employees.columns.department'),
    sortable: true,
  },
  {
    key:    'status',
    header: t('employees.columns.status'),
    render: (row: Employee) => (
      <Badge variant={STATUS_VARIANT[row.status]}>
        {t(`status.${row.status}`)}
      </Badge>
    ),
  },
  {
    key:    'actions',
    header: t('common.actions'),
    render: (row: Employee) => (
      <div className={styles.actions}>
        <Button variant="ghost" size="sm" href={`/employees/${row.id}`}>
          {t('common.view')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
          <Icon name="trash" size={16} color="var(--red-500)" />
        </Button>
      </div>
    ),
  },
];

<DataTable
  columns={columns}
  data={employees}
  loading={loading}
  pagination={{
    currentPage:  page,
    pageSize:     pageSize,
    totalItems:   total,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  }}
  search={{
    value:    search,
    onChange: setSearch,
    placeholder: t('common.search'),
  }}
  emptyText={t('common.no_data')}
/>
```

---

## 13. Role-Based Access Control

### 13.1 Reading the current role

```tsx
'use client';
import { useEffect, useState } from 'react';

export default function FeatureSection() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem('hrforz_role'));
  }, []);

  // Render nothing until role is resolved (avoids flash)
  if (role === null) return null;

  if (role === 'hr_admin') return <AdminView />;
  return <EmployeeView />;
}
```

### 13.2 Hiding individual actions by role

```tsx
const role = typeof window !== 'undefined'
  ? localStorage.getItem('hrforz_role')
  : null;

const isAdmin = role === 'hr_admin';

// Hide delete button from non-admins
{isAdmin && (
  <Button variant="danger" onClick={() => setDeleteId(emp.id)}>
    {t('common.delete')}
  </Button>
)}
```

### 13.3 Do not add route-level guards

`app/(shell)/layout.tsx` already applies `RoleGuard` to every route inside `(shell)`.
Never duplicate this logic in page or section files.

---

## 14. Loading, Error & Empty States

Every async section must handle all three states:

```tsx
// ── Loading ─────────────────────────────────────────
if (loading) return <Spinner />;

// For list content — skeleton rows are better than a spinner
if (loading) return (
  <div className={styles.skeletonList}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} height={56} />
    ))}
  </div>
);

// ── Error ────────────────────────────────────────────
if (error) return <Alert variant="error">{error}</Alert>;

// With retry button
if (error) return (
  <Alert variant="error">
    {error}
    <Button variant="ghost" size="sm" onClick={load}>{t('common.retry')}</Button>
  </Alert>
);

// ── Empty ────────────────────────────────────────────
{employees.length === 0 && (
  <div className={styles.emptyState}>
    <Icon name="inbox" size={48} color="var(--ink-300)" />
    <Typography color="secondary">{t('common.no_data')}</Typography>
    <Button variant="primary" href="/employees/add-new">
      {t('employees.add_new')}
    </Button>
  </div>
)}
```

---

## 15. Navigation & Sidebar

### 15.1 Adding a new route

Edit `app/(shell)/ShellLayout.tsx`:

```tsx
const NAV_SECTIONS = [
  {
    label: 'WORKSPACE',
    items: [
      { id: 'dashboard',  label: t('nav.dashboard'),  icon: <Icon name="home"     />, href: '/dashboard'  },
      { id: 'employees',  label: t('nav.employees'),  icon: <Icon name="users"    />, href: '/employees'  },
      { id: 'attendance', label: t('nav.attendance'), icon: <Icon name="clock"    />, href: '/attendance' },
      { id: 'leave',      label: t('nav.leave'),      icon: <Icon name="calendar" />, href: '/leave'      },
      { id: 'my-finance', label: t('nav.my_finance'), icon: <Icon name="wallet"   />, href: '/my-finance' },
      { id: 'helpdesk',   label: t('nav.helpdesk'),   icon: <Icon name="ticket"   />, href: '/helpdesk'   },
      // Add new item here:
      { id: 'new-feature', label: t('nav.new_feature'), icon: <Icon name="icon-name" />, href: '/new-feature' },
    ],
  },
];
```

Rules:
- Label must be a `t()` call.
- Icon must use `<Icon name="..." />` — check `ICON_NAMES` for valid names.
- Add `nav.new_feature` to `en.json`.

---

## 16. Custom Hooks

### 16.1 useTableEngine

Built-in hook for DataTable with server-side pagination, sorting, and search:

```tsx
import { useTableEngine } from '@/components';

const {
  data, loading, error,
  page, pageSize, search, sort,
  setPage, setPageSize, setSearch, setSort,
  reload,
} = useTableEngine({
  fetcher: (params) => employeesApi.getAll(params),
  defaultPageSize: 25,
});
```

### 16.2 useFormEngine

Built-in hook for forms with validation and submission:

```tsx
import { useFormEngine } from '@/components';

const {
  values, errors, touched, isSubmitting,
  setValue, setValues, handleSubmit, reset,
} = useFormEngine({
  initialValues: INITIAL_EMPLOYEE,
  validate: (vals) => {
    const e: Record<string, string> = {};
    if (!vals.name)  e.name  = t('validation.required');
    if (!vals.email) e.email = t('validation.required');
    return e;
  },
  onSubmit: async (vals) => {
    await employeesApi.create(vals);
    toast({ variant: 'success', message: t('common.saved') });
    router.push('/employees');
  },
});
```

---

## 17. File & Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Page files | `page.tsx` | `app/(shell)/leave/page.tsx` |
| Section files | `PascalCase + Section` | `LeaveListSection.tsx` |
| Feature-local components | `_components/PascalCase` | `_components/LeaveCard.tsx` |
| SCSS modules | Match component name | `LeaveCard.module.scss` |
| API service files | `kebab-case-api.ts` | `leave-api.ts` |
| Shared hooks | `use + PascalCase` | `useMultiStepForm.ts` |
| Type/interface files | `kebab-case.ts` | `leave.ts` (exports `LeaveRequest`) |
| Storybook stories | `ComponentName.stories.tsx` | `Button.stories.tsx` |
| E2E tests | `kebab-case.spec.ts` | `employees-list.spec.ts` |
| Constants | `SCREAMING_SNAKE` for values | `STATUS_VARIANT`, `API_ENDPOINTS` |
| React components | `PascalCase` | `EmployeeCard`, `LeaveFormSection` |
| Hooks | `camelCase` prefixed with `use` | `useTableEngine`, `useMultiStepForm` |
| Event handlers | `handle + PascalCase` | `handleDelete`, `handleSubmit` |
| Boolean props/vars | `is/has/can + PascalCase` | `isLoading`, `hasError`, `canDelete` |

---

## 18. Testing

### 18.1 Playwright E2E tests

```ts
// tests/employees.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Set auth token + role for all tests in this file
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('hrforz_token', 'test-token');
    localStorage.setItem('hrforz_role',  'hr_admin');
  });
  await page.goto('/employees');
});

test('shows employee list', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  await expect(page.getByPlaceholder('Search...')).toBeVisible();
});

test('navigates to add-new page', async ({ page }) => {
  await page.getByRole('button', { name: /add employee/i }).click();
  await expect(page).toHaveURL('/employees/add-new');
});

test('deletes employee with confirm dialog', async ({ page }) => {
  await page.getByRole('button', { name: /delete/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: /confirm/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
```

Run: `npm run test:e2e`
Debug: `npm run test:e2e:ui`

### 18.2 Vitest unit tests

```ts
// components/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button>Save</Button>);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('calls onClick', () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('shows spinner when loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('is disabled when disabled prop set', () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

Run: `npm run test` (via vitest)

### 18.3 Storybook stories

```tsx
// components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title:     'Components/Button',
  component: Button,
  tags:      ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary','secondary','ghost','danger','link'] },
    size:    { control: 'select', options: ['sm','md','lg'] },
    loading: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary:   Story = { args: { variant: 'primary',   children: 'Save'   } };
export const Secondary: Story = { args: { variant: 'secondary', children: 'Cancel' } };
export const Danger:    Story = { args: { variant: 'danger',    children: 'Delete' } };
export const Loading:   Story = { args: { variant: 'primary',   loading: true, children: 'Saving...' } };
```

Run: `npm run storybook`

---

## 19. Pre-Submit Checklist

Complete every item before opening a pull request or marking a task done.

### Structure
- [ ] Page lives at `app/(shell)/<feature>/page.tsx`
- [ ] `page.tsx` contains only `'use client'`, `dynamic` import, and default export
- [ ] `ssr: false` and `<Skeleton>` fallback on every `dynamic` import
- [ ] Feature-local components are in `_components/`, not in `sections/` or `components/`

### Localization
- [ ] Every user-visible string uses `t('namespace.key')` — zero hard-coded strings
- [ ] All new keys added to `en.json`
- [ ] `common.*` and `status.*` keys reused where applicable

### Design Tokens
- [ ] Zero raw hex color values in SCSS or inline styles
- [ ] Zero raw `px` spacing values — all use `$space-*` tokens
- [ ] Zero raw `border-radius` pixel values — all use `$radius-*` tokens
- [ ] No inline `style={{ color, background, padding, margin }}` for static values

### Components
- [ ] All UI components imported from `@/components` — nothing re-implemented
- [ ] `<Spinner />` or `<Skeleton>` shown during every async load
- [ ] `<Alert variant="error">` shown on every fetch/submit failure
- [ ] Empty state shown when list has zero items
- [ ] Destructive actions gated behind `<ConfirmDialog>`
- [ ] Toast shown after every successful create/update/delete

### SCSS
- [ ] Every component has a `.module.scss` file
- [ ] First line of every module is `@use 'variables' as *;`
- [ ] No `!important` anywhere
- [ ] No global SCSS imported into component modules

### TypeScript
- [ ] No `any` — use `unknown` or a typed interface
- [ ] All component props have an explicit `interface` or `type`
- [ ] Named exports for all components; default export only for `page.tsx`

### API
- [ ] All HTTP calls use `app/core/services/api-service.ts`
- [ ] All endpoint strings registered in `api-endpoints.ts`
- [ ] Each feature has its own service file in `app/shared/services/`

### Navigation
- [ ] New routes added to `ShellLayout.tsx` with `t()` label and `ICON_NAMES` icon

### Quality Gates
- [ ] `npm run type-check` → 0 errors
- [ ] `npm run lint` → 0 errors or warnings
- [ ] Storybook story added for any new shared component
- [ ] E2E test covers the golden path of any new page

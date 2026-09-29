/**
 * Canonical option sets used by onboarding + workspace settings.
 * Kept in one place so labels and slugs stay consistent across the app.
 */

export const INDUSTRIES = [
    { value: 'saas', label: 'SaaS / Product' },
    { value: 'ecommerce', label: 'E-commerce / Retail' },
    { value: 'marketing', label: 'Marketing / Agency' },
    { value: 'media', label: 'Media / Publishing' },
    { value: 'fintech', label: 'Financial services' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'nonprofit', label: 'Non-profit' },
    { value: 'consulting', label: 'Consulting / Services' },
    { value: 'realestate', label: 'Real estate' },
    { value: 'travel', label: 'Travel / Hospitality' },
    { value: 'other', label: 'Other' },
] as const

export const COMPANY_SIZES = [
    { value: 'solo', label: 'Just me' },
    { value: '2-10', label: '2–10 people' },
    { value: '11-50', label: '11–50 people' },
    { value: '51-200', label: '51–200 people' },
    { value: '201-1000', label: '201–1,000 people' },
    { value: '1000+', label: '1,000+ people' },
] as const

export const USE_CASES = [
    { value: 'transactional', label: 'Transactional', description: 'Receipts, notifications, password resets' },
    { value: 'marketing', label: 'Marketing campaigns', description: 'Newsletters, announcements, promos' },
    { value: 'product', label: 'Product updates', description: 'Feature launches, release notes' },
    { value: 'onboarding', label: 'User onboarding', description: 'Welcome sequences, activation nudges' },
    { value: 'internal', label: 'Internal comms', description: 'Team updates, digests' },
    { value: 'sales', label: 'Sales outreach', description: 'Cold intro, follow-ups, sequences' },
    { value: 'automations', label: 'Automated flows', description: 'Triggered emails on event' },
] as const

export const JOB_TITLES_SUGGESTIONS = [
    'Founder',
    'CEO',
    'CTO',
    'Product Manager',
    'Marketing Manager',
    'Growth Lead',
    'Designer',
    'Engineer',
    'Operations',
    'Sales',
] as const

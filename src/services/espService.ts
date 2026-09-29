import { api, getWorkspaceId } from './api'

// ── Types (kept in sync with backend esp.schema.ts) ──────────────────────────

export type EspProvider = 'resend' | 'brevo' | 'sendgrid' | 'ses'

export type EspCredentialsInput =
    | { provider: 'resend'; apiKey: string }
    | { provider: 'brevo'; apiKey: string }
    | { provider: 'sendgrid'; apiKey: string }
    | { provider: 'ses'; accessKeyId: string; secretAccessKey: string; region: string }

export interface EspConnection {
    _id: string
    workspaceId: string
    provider: EspProvider
    label: string
    fromEmail: string | null
    fromName: string | null
    /** Provider-shaped map of `field -> masked value` (last 4 chars visible). */
    credentialsMasked: Record<string, string>
    isActive: boolean
    verifiedAt: string | null
    lastError: string | null
    createdAt: string
    updatedAt: string
}

export interface EspVerifyResult {
    ok: boolean
    message?: string
}

// ── Static provider metadata mirrored from backend (adapters/base.ts) ────────
// Drives the Connect dialog form + "add provider" grid. Keeping it here rather
// than fetching from an endpoint means the UI is instant and works offline.

export interface ProviderMeta {
    id: EspProvider
    name: string
    description: string
    docsUrl: string
    credentialFields: Array<{
        key: string
        label: string
        placeholder: string
        secret?: boolean
        required?: boolean
    }>
    available: boolean
}

export const PROVIDER_META: Record<EspProvider, ProviderMeta> = {
    resend: {
        id: 'resend',
        name: 'Resend',
        description: 'Modern, developer-friendly. Free tier: 100 emails/day.',
        docsUrl: 'https://resend.com/api-keys',
        credentialFields: [
            { key: 'apiKey', label: 'API key', placeholder: 're_...', secret: true, required: true },
        ],
        available: true,
    },
    brevo: {
        id: 'brevo',
        name: 'Brevo',
        description: 'Formerly Sendinblue. Generous free tier: 300 emails/day.',
        docsUrl: 'https://app.brevo.com/settings/keys/api',
        credentialFields: [
            { key: 'apiKey', label: 'API key', placeholder: 'xkeysib-...', secret: true, required: true },
        ],
        available: true,
    },
    sendgrid: {
        id: 'sendgrid',
        name: 'SendGrid',
        description: 'Twilio-owned. Robust at scale, ubiquitous in enterprise.',
        docsUrl: 'https://app.sendgrid.com/settings/api_keys',
        credentialFields: [
            { key: 'apiKey', label: 'API key', placeholder: 'SG....', secret: true, required: true },
        ],
        available: true,
    },
    ses: {
        id: 'ses',
        name: 'Amazon SES',
        description: 'Cheapest at scale. Requires SES-in-production status.',
        docsUrl: 'https://console.aws.amazon.com/ses/',
        credentialFields: [
            { key: 'accessKeyId', label: 'Access key ID', placeholder: 'AKIA...', required: true },
            { key: 'secretAccessKey', label: 'Secret access key', placeholder: '••••', secret: true, required: true },
            { key: 'region', label: 'Region', placeholder: 'us-east-1', required: true },
        ],
        available: false,
    },
}

// ── Endpoints ────────────────────────────────────────────────────────────────

function espPath(suffix: string = ''): string {
    const wsId = getWorkspaceId()
    if (!wsId) throw new Error('No workspace selected')
    return `/workspaces/${wsId}/esp${suffix}`
}

export function listEspConnections() {
    return api.get<{ success: boolean; data: EspConnection[] }>(espPath())
}

export function createEspConnection(input: {
    label: string
    fromEmail?: string
    fromName?: string
    credentials: EspCredentialsInput
    activate?: boolean
}) {
    return api.post<{ success: boolean; data: EspConnection }>(espPath(), input)
}

export function updateEspConnection(
    id: string,
    input: {
        label?: string
        fromEmail?: string | null
        fromName?: string | null
        credentials?: EspCredentialsInput
        isActive?: boolean
    },
) {
    return api.patch<{ success: boolean; data: EspConnection }>(espPath(`/${id}`), input)
}

export function deleteEspConnection(id: string) {
    return api.delete<{ success: boolean }>(espPath(`/${id}`))
}

export function activateEspConnection(id: string) {
    return api.post<{ success: boolean; data: EspConnection }>(espPath(`/${id}/activate`))
}

export function verifyEspConnection(id: string) {
    return api.post<{ success: boolean; data: EspVerifyResult }>(espPath(`/${id}/verify`))
}

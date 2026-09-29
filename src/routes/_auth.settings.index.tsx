import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * /settings → always redirect to /settings/profile so the settings shell
 * has something to render.
 */
export const Route = createFileRoute('/_auth/settings/')({
  beforeLoad: () => {
    throw redirect({ to: '/settings/profile' })
  },
})

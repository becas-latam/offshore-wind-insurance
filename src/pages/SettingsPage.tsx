import { Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>
      <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Settings className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">Coming soon</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile management, API keys, and preferences.
        </p>
      </div>
    </div>
  )
}

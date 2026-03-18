import { Database } from 'lucide-react'

export function CorpusPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Corpus Management</h1>
          <p className="text-sm text-muted-foreground">Upload and manage transcript files</p>
        </div>
      </div>
      <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Database className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">Coming soon</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload transcripts, monitor processing, and browse indexed content.
        </p>
      </div>
    </div>
  )
}

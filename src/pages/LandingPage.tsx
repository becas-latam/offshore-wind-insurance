import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Anchor,
  MessageSquare,
  FileSearch,
  PenTool,
  BookOpen,
  Shield,
  ArrowRight,
} from 'lucide-react'

const modules = [
  {
    title: 'Expert Q&A',
    description: 'Ask questions about offshore wind insurance and get expert-level answers backed by hundreds of hours of practitioner conversations.',
    icon: MessageSquare,
  },
  {
    title: 'Contract Analysis',
    description: 'Upload insurance contracts and get AI-powered clause analysis, risk identification, and regulatory compliance checks.',
    icon: FileSearch,
  },
  {
    title: 'Clause Drafting',
    description: 'Generate insurance clauses based on best practices from the corpus and German legal requirements.',
    icon: PenTool,
  },
  {
    title: 'Book Writing',
    description: 'Extract knowledge from the corpus to write a practitioner-focused publication on offshore wind insurance.',
    icon: BookOpen,
  },
]

export function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Offshore Wind Insurance Intelligence
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your offshore wind insurance{' '}
              <span className="text-primary">knowledge engine</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              A professional workspace powered by hundreds of hours of expert conversations.
              Query, analyze, draft, and write — all backed by deep domain knowledge
              in offshore wind insurance.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Get started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Four powerful modules
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need for offshore wind insurance work, in one place.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {modules.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Domain coverage */}
      <section className="border-t bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Deep domain expertise
            </h2>
            <p className="mt-3 text-muted-foreground">
              Covering the full spectrum of offshore wind insurance.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-3 font-semibold">Insurance Lines</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>CAR — Construction All Risks</li>
                <li>OAR — Operational All Risks</li>
                <li>H&M — Hull & Machinery</li>
                <li>P&I — Protection & Indemnity</li>
                <li>WECI — Weather Extension Cover</li>
                <li>Environmental Liability</li>
                <li>Cyber / SCADA</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">Legal Frameworks</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>VVG — Insurance Contract Act</li>
                <li>BGB / HGB — Civil & Commercial Code</li>
                <li>WindSeeG — Offshore Wind Energy Act</li>
                <li>EU Solvency II</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">Engineering Domain</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Offshore wind infrastructure lifecycle</li>
                <li>Monopile foundations & installation</li>
                <li>Construction phase risks</li>
                <li>Operational phase management</li>
                <li>Decommissioning</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Anchor className="h-4 w-4" />
            WindRisk
          </div>
          <p className="text-sm text-muted-foreground">
            Offshore Wind Insurance Intelligence
          </p>
        </div>
      </footer>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
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
    description: 'Ask questions and get expert answers from the knowledge base.',
    icon: MessageSquare,
    path: '/qa',
    status: 'Live',
  },
  {
    title: 'Risk Analyzer',
    description: 'Analyze contract liability and identify risk exposure for service contracts.',
    icon: Shield,
    path: '/risk-analyzer',
    status: 'Live',
  },
  {
    title: 'Contract Analysis',
    description: 'Upload and analyze insurance contracts with AI.',
    icon: FileSearch,
    path: '/contracts',
    status: 'Coming soon',
  },
  {
    title: 'Clause Drafting',
    description: 'Generate insurance clauses from best practices.',
    icon: PenTool,
    path: '/clauses',
    status: 'Coming soon',
  },
  {
    title: 'Book Writing',
    description: 'Write your offshore wind insurance publication.',
    icon: BookOpen,
    path: '/book',
    status: 'Coming soon',
  },
]

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to WindRisk. Choose a module to get started.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {modules.map(({ title, description, icon: Icon, path, status }) => (
          <Link key={path} to={path} className="no-underline">
            <Card className="group h-full transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge
                    variant={status === 'Live' ? 'default' : 'secondary'}
                    className={`text-xs ${status === 'Live' ? 'bg-green-100 text-green-800 border border-green-200' : ''}`}
                  >
                    {status}
                  </Badge>
                </div>
                <CardTitle className="mt-3 flex items-center gap-2">
                  {title}
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import {
  Plus,
  Building2,
  Wind,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Loader2,
  X,
} from 'lucide-react'
import { getClients, type Client } from '@/services/clientStore'
import {
  getWindFarms,
  createWindFarm,
  deleteWindFarm,
  type WindFarm,
} from '@/services/windfarmStore'

export function ClientDetailPage() {
  const { user } = useAuth()
  const { clientId } = useParams<{ clientId: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [windfarms, setWindfarms] = useState<WindFarm[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    if (!user || !clientId) return
    Promise.all([
      getClients(user.uid).then(list => {
        const c = list.find(c => c.id === clientId)
        setClient(c ?? null)
      }),
      getWindFarms(user.uid, clientId).then(setWindfarms),
    ]).then(() => setLoading(false))
  }, [user, clientId])

  async function handleCreate() {
    if (!user || !clientId || !newName.trim()) return
    await createWindFarm(user.uid, clientId, newName.trim())
    setNewName('')
    setShowNew(false)
    setWindfarms(await getWindFarms(user.uid, clientId))
  }

  async function handleDelete(id: string) {
    if (!user || !clientId) return
    await deleteWindFarm(user.uid, clientId, id)
    setWindfarms(await getWindFarms(user.uid, clientId))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/clients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 no-underline">
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            {client?.name ?? 'Client'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage wind farm projects for this client.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Wind Farm
        </Button>
      </div>

      {showNew && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Wind farm name (or anonymous, e.g. Offshore Wind Farm 1)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
              <Button variant="ghost" onClick={() => { setShowNew(false); setNewName('') }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {windfarms.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Wind className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No wind farms yet. Add one to start setting up the project.</p>
            <Button onClick={() => setShowNew(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Wind Farm
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {windfarms.map(wf => (
            <Card key={wf.id} className="group transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Link
                    to={`/clients/${clientId}/windfarms/${wf.id}`}
                    className="no-underline flex-1"
                  >
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wind className="h-5 w-5 text-primary" />
                      {wf.name}
                      <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      {wf.phase ? (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {wf.phase}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Not started</Badge>
                      )}
                      {wf.phase && (
                        <span className="text-xs">Step {(wf.step ?? 0) + 1}</span>
                      )}
                    </CardDescription>
                  </Link>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(wf.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import {
  Plus,
  Building2,
  ArrowRight,
  Trash2,
  Loader2,
  PenLine,
  Check,
  X,
} from 'lucide-react'
import {
  getClients,
  createClient,
  deleteClient,
  updateClient,
  type Client,
} from '@/services/clientStore'

export function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    if (!user) return
    getClients(user.uid).then(list => {
      setClients(list)
      setLoading(false)
    })
  }, [user])

  async function handleCreate() {
    if (!user || !newName.trim()) return
    await createClient(user.uid, newName.trim())
    setNewName('')
    setShowNew(false)
    const list = await getClients(user.uid)
    setClients(list)
  }

  async function handleDelete(id: string) {
    if (!user) return
    await deleteClient(user.uid, id)
    const list = await getClients(user.uid)
    setClients(list)
  }

  async function handleRename(id: string) {
    if (!user || !editName.trim()) return
    await updateClient(user.uid, id, { name: editName.trim() })
    setEditingId(null)
    const list = await getClients(user.uid)
    setClients(list)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Clients
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your clients and their offshore wind farm projects.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Client
        </Button>
      </div>

      {showNew && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Client name (or leave anonymous, e.g. Client 1)"
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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No clients yet. Create one to get started.</p>
            <Button onClick={() => setShowNew(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clients.map(client => (
            <Card key={client.id} className="group transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  {editingId === client.id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(client.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                        className="h-7 text-sm"
                      />
                      <Button size="icon-xs" variant="ghost" onClick={() => handleRename(client.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon-xs" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Link to={`/clients/${client.id}`} className="no-underline flex-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Building2 className="h-5 w-5 text-primary" />
                          {client.name}
                          <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                        </CardTitle>
                      </Link>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => { setEditingId(client.id); setEditName(client.name) }}
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

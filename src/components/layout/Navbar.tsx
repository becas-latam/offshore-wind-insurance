import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Anchor,
  LayoutDashboard,
  MessageSquare,
  FileSearch,
  PenTool,
  BookOpen,
  Database,
  Shield,
  Settings,
  LogOut,
  User,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/qa', label: 'Q&A', icon: MessageSquare },
  { path: '/risk-analyzer', label: 'Risk', icon: Shield },
  { path: '/contracts', label: 'Contracts', icon: FileSearch },
  { path: '/clauses', label: 'Clauses', icon: PenTool },
  { path: '/book', label: 'Book', icon: BookOpen },
  { path: '/corpus', label: 'Corpus', icon: Database },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <nav className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-primary no-underline">
          <Anchor className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">WindRisk</span>
        </Link>

        {user && (
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={location.pathname === path ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-1.5"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent">
                <User className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-sm text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

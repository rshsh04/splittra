'use client'
import { 
  Users, 
  Home, 
  MessageSquare, 
  Shield,
  LogOut,
  X,
  Crown,
  BarChart3,
  Settings,
  DollarSign
} from 'lucide-react'

interface AdminSidebarProps {
  user: any
  activeView: 'overview' | 'support' | 'users' | 'households' | 'expenses' | 'analytics'
  setActiveView: (view: 'overview' | 'support' | 'users' | 'households' | 'expenses' | 'analytics') => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  onSignOut: () => void
}

export default function AdminSidebar({
  user,
  activeView,
  setActiveView,
  sidebarOpen,
  setSidebarOpen,
  onSignOut
}: AdminSidebarProps) {
  const menuItems = [
    {
      id: 'overview' as const,
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Overview & Analytics'
    },
    {
      id: 'support' as const,
      label: 'Support',
      icon: MessageSquare,
      description: 'Support Messages'
    },
    {
      id: 'users' as const,
      label: 'Users',
      icon: Users,
      description: 'User Management'
    },
    {
      id: 'households' as const,
      label: 'Households',
      icon: Home,
      description: 'Household Management'
    },
    {
      id: 'expenses' as const,
      label: 'Expenses',
      icon: DollarSign,
      description: 'Expense Management'
    },
    {
      id: 'analytics' as const,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Advanced Analytics'
    }
  ]

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-sm border-r border-slate-200 transform transition-transform duration-200 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-slate-600 to-slate-800 w-10 h-10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Admin Panel</h2>
                <p className="text-xs text-slate-500">Splittra Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {user.name || 'Admin User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                    Admin
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <div>
                      <p className={`font-medium ${isActive ? 'text-white' : 'text-slate-800'}`}>
                        {item.label}
                      </p>
                      <p className={`text-xs ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors">
                <Settings className="w-5 h-5 text-slate-500" />
                <span className="font-medium">Settings</span>
              </button>
              <button 
                onClick={onSignOut}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
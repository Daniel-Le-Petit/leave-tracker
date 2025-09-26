'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart3, 
  Clock, 
  Package, 
  Calendar, 
  Settings, 
  Mail,
  Download,
  Upload,
  X,
  Menu,
  FileCheck,
  TrendingUp
} from 'lucide-react'

interface SidebarProps {
  onExport?: () => void
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onEmail?: () => void
}

export default function Sidebar({ onExport, onImport, onEmail }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: BarChart3,
      current: pathname === '/'
    },
    {
      name: 'Calendrier',
      href: '/calendar',
      icon: Calendar,
      current: pathname === '/calendar'
    },
    {
      name: 'Historique',
      href: '/history',
      icon: Clock,
      current: pathname === '/history'
    },
    {
      name: 'Validation Paie',
      href: '/payroll',
      icon: FileCheck,
      current: pathname === '/payroll'
    },
    {
      name: 'Comparaison',
      href: '/comparison',
      icon: TrendingUp,
      current: pathname === '/comparison'
    },
    {
      name: 'Reliquats',
      href: '/carryover',
      icon: Package,
      current: pathname === '/carryover'
    },
    {
      name: 'Vacation Report',
      href: '/vacation-report',
      icon: Mail,
      current: pathname === '/vacation-report'
    },
    {
      name: 'Paramètres',
      href: '/settings',
      icon: Settings,
      current: pathname === '/settings'
    }
  ]

  const actionItems = [
    {
      name: 'Exporter',
      icon: Download,
      onClick: onExport,
      color: 'text-green-600 hover:text-green-700'
    },
    {
      name: 'Importer',
      icon: Upload,
      onClick: () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement
          if (target.files && onImport) {
            onImport({ target } as React.ChangeEvent<HTMLInputElement>)
          }
        }
        input.click()
      },
      color: 'text-blue-600 hover:text-blue-700'
    }
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
          title="Ouvrir le menu"
        >
          <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 right-0 w-64 bg-green-100 dark:bg-green-900/30 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">Leave-Tracker Dashboard</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent navigationItems={navigationItems} actionItems={actionItems} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-green-100 dark:bg-green-900/30 border-r border-green-300 dark:border-green-600">
          <SidebarContent navigationItems={navigationItems} actionItems={actionItems} />
        </div>
      </div>
    </>
  )
}

interface SidebarContentProps {
  navigationItems: any[]
  actionItems: any[]
}

function SidebarContent({ navigationItems, actionItems }: SidebarContentProps) {
  return (
    <div className="flex flex-col flex-grow overflow-y-auto">
      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  item.current
                    ? 'bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-green-200 dark:hover:bg-green-700/70 hover:text-green-900 dark:hover:text-green-100'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${item.current ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Actions */}
      <div className="px-4 py-4 border-t border-green-300 dark:border-green-600">
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Actions
          </h3>
          {actionItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${item.color}`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

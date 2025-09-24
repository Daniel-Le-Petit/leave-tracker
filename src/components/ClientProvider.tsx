'use client'

import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { AppSettings } from '../types'
import { leaveStorage } from '../utils/storage'

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await leaveStorage.getSettings()
        if (savedSettings) {
          setSettings(savedSettings)
        } else {
          // Paramètres par défaut
          const defaultSettings: AppSettings = {
            firstDayOfWeek: 'monday',
            country: 'FR',
            publicHolidays: [],
            quotas: [
              { type: 'cp', yearlyQuota: 25 },
              { type: 'rtt', yearlyQuota: 10 },
              { type: 'sick', yearlyQuota: 0 }
            ],
            darkMode: false,
            notifications: true,
          }
          setSettings(defaultSettings)
          await leaveStorage.saveSettings(defaultSettings)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
        // Paramètres de fallback
        setSettings({
          firstDayOfWeek: 'monday',
          country: 'FR',
          publicHolidays: [],
          quotas: [
            { type: 'cp', yearlyQuota: 25 },
            { type: 'rtt', yearlyQuota: 10 },
            { type: 'sick', yearlyQuota: 0 }
          ],
          darkMode: false,
          notifications: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Appliquer le thème sombre si activé
  useEffect(() => {
    if (settings?.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings?.darkMode])

  // Mettre à jour les meta tags dynamiquement
  useEffect(() => {
    if (settings) {
      // Mettre à jour theme-color
      const themeColorMeta = document.querySelector('meta[name="theme-color"]')
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', settings.darkMode ? '#1f2937' : '#ffffff')
      }

      // Mettre à jour apple-mobile-web-app-status-bar-style
      const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
      if (statusBarMeta) {
        statusBarMeta.setAttribute('content', settings.darkMode ? 'black-translucent' : 'default')
      }

      // Mettre à jour apple-mobile-web-app-capable
      const appCapableMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]')
      if (appCapableMeta) {
        appCapableMeta.setAttribute('content', 'yes')
      }
    }
  }, [settings])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: settings?.darkMode ? '#374151' : '#ffffff',
            color: settings?.darkMode ? '#f9fafb' : '#111827',
            border: `1px solid ${settings?.darkMode ? '#4b5563' : '#e5e7eb'}`,
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  )
}

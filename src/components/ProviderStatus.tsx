'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Zap, Clock, Globe } from 'lucide-react'
import FreeTranscriptionService from '../services/freeTranscriptionService'

interface ProviderStatusProps {
  className?: string
}

export default function ProviderStatus({ className = '' }: ProviderStatusProps) {
  const [providers, setProviders] = useState<any[]>([])
  const [currentProvider, setCurrentProvider] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const transcriptionService = FreeTranscriptionService.getInstance()

  useEffect(() => {
    updateProvidersStatus()
  }, [])

  const updateProvidersStatus = () => {
    const status = transcriptionService.getProvidersStatus()
    const current = transcriptionService.getCurrentProvider()
    setProviders(status)
    setCurrentProvider(current)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    transcriptionService.resetQuotas()
    updateProvidersStatus()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleProviderChange = (providerId: string) => {
    if (transcriptionService.setProvider(providerId)) {
      setCurrentProvider(providerId)
    }
  }

  const getProviderIcon = (provider: any) => {
    if (!provider.isAvailable) {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
    if (provider.remainingQuota === 0) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getProviderBadge = (provider: any) => {
    if (provider.name.includes('Whisper')) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Gratuit</span>
    }
    if (provider.name.includes('Google')) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">60min/mois</span>
    }
    if (provider.name.includes('Azure')) {
      return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">5h/mois</span>
    }
    if (provider.name.includes('Local')) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Local</span>
    }
    return null
  }

  const formatQuota = (quota: number, provider: any) => {
    if (quota === Infinity) return 'Illimité'
    if (provider.name.includes('Whisper')) {
      return `${Math.floor(quota / 1000)}k tokens`
    }
    if (provider.name.includes('Google') || provider.name.includes('Azure')) {
      const minutes = Math.floor(quota / 60)
      const seconds = quota % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    return quota.toString()
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Providers de Transcription
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              currentProvider === provider.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => handleProviderChange(provider.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getProviderIcon(provider)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {provider.name}
                    </span>
                    {getProviderBadge(provider)}
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatQuota(provider.remainingQuota, provider)}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <Zap className="w-3 h-3" />
                      <span>Priorité {provider.priority}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {currentProvider === provider.id && (
                <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-medium">Actif</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-1">Stratégie de Fallback</p>
            <p>
              Si un provider n'est pas disponible, l'application bascule automatiquement 
              vers le suivant. Le provider local (Web Speech API) est toujours disponible 
              comme dernier recours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

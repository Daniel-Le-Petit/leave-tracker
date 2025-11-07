'use client'

import { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { LeaveEntry } from '../../types'
import { leaveStorage } from '../../utils/storage'
import MainLayout from '../../components/MainLayout'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { formatWorkingDays } from '../../utils/leaveUtils'

export default function VacationReportPage() {
  const [leaves, setLeaves] = useState<LeaveEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedTypes, setSelectedTypes] = useState<('rtt' | 'cp' | 'cet')[]>(['rtt', 'cp', 'cet'])
  const [dateFilter, setDateFilter] = useState<'all' | 'last_week' | 'current_month'>('all')
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([])
  const [emailAddress, setEmailAddress] = useState('dlepetit.maa@gmail.com')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadLeaves()
  }, [])

  const loadLeaves = async () => {
    try {
      setIsLoading(true)
      const storedLeaves = await leaveStorage.getLeaves()
      setLeaves(storedLeaves || [])
    } catch (error) {
      console.error('Erreur lors du chargement des congés:', error)
      toast.error('Erreur lors du chargement des congés')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrer les congés selon les critères (seulement les prévisions)
  const filteredLeaves = useMemo(() => {
    let filtered = leaves.filter(leave => 
      new Date(leave.startDate).getFullYear() === currentYear &&
      leave.isForecast && // Seulement les prévisions
      selectedTypes.includes(leave.type as 'rtt' | 'cp' | 'cet')
    )

    // Appliquer le filtre de période
    const now = new Date()
    if (dateFilter === 'last_week') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(leave => new Date(leave.startDate) >= lastWeek)
    } else if (dateFilter === 'current_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      filtered = filtered.filter(leave => {
        const leaveDate = new Date(leave.startDate)
        return leaveDate >= startOfMonth && leaveDate <= endOfMonth
      })
    }

    // Trier par date de début (du plus proche au plus éloigné)
    filtered.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime()
      const dateB = new Date(b.startDate).getTime()
      return dateA - dateB
    })

    return filtered
  }, [leaves, currentYear, selectedTypes, dateFilter])

  const selectedLeaveEntries = useMemo(() => {
    return filteredLeaves.filter(leave => selectedLeaves.includes(leave.id))
  }, [filteredLeaves, selectedLeaves])

  const toggleTypeFilter = (type: 'rtt' | 'cp' | 'cet') => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleLeaveSelection = (leaveId: string) => {
    setSelectedLeaves(prev => 
      prev.includes(leaveId)
        ? prev.filter(id => id !== leaveId)
        : [...prev, leaveId]
    )
  }

  const selectAllVisible = () => {
    setSelectedLeaves(filteredLeaves.map(leave => leave.id))
  }

  const clearSelection = () => {
    setSelectedLeaves([])
  }

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'rtt': return '🔄'
      case 'cp': return '🏖️'
      case 'cet': return '🏥'
      default: return '📅'
    }
  }

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'rtt': return 'RTT'
      case 'cp': return 'CP'
      case 'cet': return 'CET'
      default: return type.toUpperCase()
    }
  }

  const handleSendEmail = async () => {
    if (selectedLeaves.length === 0) {
      toast.error('Veuillez sélectionner au moins un congé')
      return
    }

    setIsSubmitting(true)
    try {
      // Simulation d'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Marquer les congés sélectionnés comme réels
      const updatedLeaves = leaves.map(leave => 
        selectedLeaves.includes(leave.id) 
          ? { ...leave, isForecast: false }
          : leave
      )
      
      await leaveStorage.saveLeaves(updatedLeaves)
      setLeaves(updatedLeaves)
      setSelectedLeaves([])
      
      toast.success('Rapport envoyé avec succès ! Les congés ont été passés en réel.')
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
      toast.error('Erreur lors de l\'envoi du rapport')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(leaves, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `conges-${currentYear}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      toast.success('Données exportées avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      toast.error('Erreur lors de l\'export des données')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedLeaves = JSON.parse(text)
      
      if (Array.isArray(importedLeaves)) {
        await leaveStorage.saveLeaves(importedLeaves)
        setLeaves(importedLeaves)
        toast.success('Données importées avec succès')
      } else {
        toast.error('Format de fichier invalide')
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      toast.error('Erreur lors de l\'import des données')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner h-12 w-12"></div>
      </div>
    )
  }

  return (
    <MainLayout
      onExport={handleExport}
      onImport={handleImport}
    >
      {/* Header avec titre et bouton d'envoi */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white bg-blue-100 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
          Rapport de Congés
        </h1>
        <button
          onClick={handleSendEmail}
          disabled={selectedLeaves.length === 0 || isSubmitting}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Envoi...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Envoyer le rapport
            </>
          )}
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtres</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Type de congés */}
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Type de congés</div>
            <div className="flex flex-wrap gap-2">
              {(['rtt', 'cp', 'cet'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`flex items-center px-3 py-2 rounded-full border transition-all ${
                    selectedTypes.includes(type)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-2 text-lg">{getLeaveTypeIcon(type)}</span>
                  <span className="text-sm">{getLeaveTypeLabel(type)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Période */}
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Période</div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'last_week', label: 'Dernière semaine', icon: '🔄' },
                { key: 'current_month', label: 'Mois en cours', icon: '🏖️' },
                { key: 'all', label: 'Toutes les dates', icon: '🔄' }
              ].map(period => (
                <button
                  key={period.key}
                  onClick={() => setDateFilter(period.key as any)}
                  className={`flex items-center px-3 py-2 rounded-full border transition-all ${
                    dateFilter === period.key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-2 text-lg">{period.icon}</span>
                  <span className="text-sm">{period.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Commentaire */}
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Les congés en prévision seront passés en réel après l'envoi.
          </p>
        </div>
      </div>

      {/* Contenu principal en deux colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche - Congés disponibles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white bg-green-100 dark:bg-green-900/20 px-3 py-1 rounded">
                Congés disponibles
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllVisible}
                  className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={clearSelection}
                  className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Effacer
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLeaves.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Aucun congé en prévision trouvé
                </div>
              ) : (
                filteredLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    onClick={() => toggleLeaveSelection(leave.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedLeaves.includes(leave.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getLeaveTypeIcon(leave.type)}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {format(new Date(leave.startDate), 'dd MMM yyyy', { locale: fr })} - {format(new Date(leave.endDate), 'dd MMM yyyy', { locale: fr })}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {leave.workingDays} jour{leave.workingDays > 1 ? 's' : ''} de {getLeaveTypeLabel(leave.type)}
                        </div>
                      </div>
                      {selectedLeaves.includes(leave.id) && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite - Aperçu de l'email */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white bg-purple-100 dark:bg-purple-900/20 px-3 py-1 rounded">
              Aperçu de l'email
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="text-sm text-gray-600 dark:text-gray-400">À:</label>
                <input
                  id="email-address"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Adresse email du destinataire"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Objet:</div>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  Rapport de congés {currentYear}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Message:</div>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  <div className="whitespace-pre-line">
                    Hi Carlo,<br/><br/>
                    Please find my vacation report below:<br/><br/>
                    {selectedLeaveEntries.length > 0 ? (
                      <>
                        {['rtt', 'cp', 'cet'].map((type, index) => {
                          const typeLeaves = selectedLeaveEntries.filter(leave => leave.type === type)
                          if (typeLeaves.length === 0) return null
                          
                          // Calculer le total des jours pour ce type
                          const totalDays = typeLeaves.reduce((sum, leave) => sum + leave.workingDays, 0)
                          
                          return (
                            <div key={type}>
                              {formatWorkingDays(totalDays, 'en')} of {getLeaveTypeLabel(type)}<br/>
                              {typeLeaves.map(leave => {
                                const startDate = new Date(leave.startDate);
                                const endDate = new Date(leave.endDate);
                                
                                // Si c'est une période d'un seul jour (ou demi-journée)
                                if (startDate.toDateString() === endDate.toDateString()) {
                                  const formattedDate = format(startDate, 'dd MMM yyyy', { locale: enUS });
                                  return (
                                    <div key={leave.id}>
                                      • {formattedDate}<br/>
                                    </div>
                                  );
                                } else {
                                  // Si c'est une période multi-jours, afficher la période
                                  const formattedStartDate = format(startDate, 'dd MMM yyyy', { locale: enUS });
                                  const formattedEndDate = format(endDate, 'dd MMM yyyy', { locale: enUS });
                                  return (
                                    <div key={leave.id}>
                                      • from {formattedStartDate} to {formattedEndDate}<br/>
                                    </div>
                                  );
                                }
                              })}
                              {index < ['rtt', 'cp', 'cet'].filter(t => selectedLeaveEntries.some(leave => leave.type === t)).length - 1 && <><br/></>}
                            </div>
                          )
                        })}
                      </>
                    ) : (
                      'No leave selected'
                    )}
                    <br/><br/>
                    Regards,<br/>
                    Daniel
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé en bas */}
      {selectedLeaves.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white bg-orange-100 dark:bg-orange-900/20 px-3 py-1 rounded mb-4">
            Résumé
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {['rtt', 'cp', 'cet'].map(type => {
              const count = selectedLeaveEntries.filter(leave => leave.type === type).length
              return (
                <div key={type} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{getLeaveTypeLabel(type)}</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </MainLayout>
  )
}
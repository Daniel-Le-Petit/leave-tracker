'use client'

import { Calendar, Download, Moon, Save, Sun, Upload, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AppSettings, LeaveEntry, PublicHoliday } from '../../types'
import { leaveStorage } from '../../utils/storage'
import MainLayout from '../../components/MainLayout'
import EmailReportModal from '../../components/EmailReportModal'
import { calculateWorkingDays, getDefaultWorkSchedule, getWorkScheduleFromSettings } from '../../utils/leaveUtils'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [leaves, setLeaves] = useState<LeaveEntry[]>([])
  const [holidays, setHolidays] = useState<PublicHoliday[]>([])
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  useEffect(() => {
    loadSettings()
    loadData()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await leaveStorage.getSettings()
      if (savedSettings) {
        // Ensure new settings fields are present
        setSettings({
          ...savedSettings,
          workSchedule: getWorkScheduleFromSettings(savedSettings),
        })
      } else {
        // Paramètres par défaut
        const defaultSettings: AppSettings = {
          firstDayOfWeek: 'monday',
          country: 'FR',
          publicHolidays: [],
          workSchedule: getDefaultWorkSchedule(),
          quotas: [
            { type: 'cp', yearlyQuota: 25 },
                          { type: 'rtt', yearlyQuota: 10 },
              { type: 'sick', yearlyQuota: 0 }
          ],
          darkMode: false,
          notifications: true,
        }
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error)
      toast.error('Erreur lors du chargement des paramètres')
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const [leavesData, holidaysData] = await Promise.all([
        leaveStorage.getLeaves(),
        leaveStorage.getHolidays()
      ])
      setLeaves(leavesData || [])
      setHolidays(holidaysData || [])
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  // Fonction pour corriger les jours ouvrés des congés existants
  const correctWorkingDays = async () => {
    try {
      const ws = getWorkScheduleFromSettings(settings)
      const correctedLeaves = leaves.map(leave => {
        const holidaysArray = Array.isArray(holidays) ? holidays : [];
        const workingDays = calculateWorkingDays(leave.startDate, leave.endDate, holidaysArray, false, undefined, ws);

        return {
          ...leave,
          workingDays: workingDays
        };
      });

      setLeaves(correctedLeaves);
      await leaveStorage.saveLeaves(correctedLeaves);
      await loadData();
      
      toast.success('Jours ouvrés corrigés avec succès !');
    } catch (error) {
      console.error('Erreur lors de la correction des jours ouvrés:', error);
      toast.error('Erreur lors de la correction des jours ouvrés');
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      await leaveStorage.saveSettings(settings)
      toast.success('Paramètres sauvegardés avec succès')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      await leaveStorage.exportDataWithUserChoice()
      toast.success('Export réussi - Choisissez où sauvegarder le fichier')
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      toast.error('Erreur lors de l\'export')
    }
  }

  const handleImport = async () => {
    try {
      await leaveStorage.importDataWithFileSelection()
      toast.success('Données importées avec succès')
      // Recharger les paramètres
      const savedSettings = await leaveStorage.getSettings()
      if (savedSettings) {
        setSettings(savedSettings)
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      if (error instanceof Error && error.message === 'Import annulé') {
        toast('Import annulé')
      } else {
        toast.error('Erreur lors de l\'import')
      }
    }
  }

  const updateQuota = (type: string, value: number, field: 'yearlyQuota' | 'carryover' = 'yearlyQuota') => {
    if (!settings) return

    setSettings({
      ...settings,
      quotas: settings.quotas.map(quota =>
        quota.type === type ? { ...quota, [field]: value } : quota
      )
    })
  }

  const toggleDarkMode = () => {
    if (!settings) return

    const newDarkMode = !settings.darkMode
    setSettings({ ...settings, darkMode: newDarkMode })
    
    // Appliquer immédiatement le thème
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleNotifications = () => {
    if (!settings) return
    setSettings({ ...settings, notifications: !settings.notifications })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner h-12 w-12"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Erreur lors du chargement des paramètres</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout
      onExport={handleExport}
      onImport={handleImport}
      onEmail={() => setIsEmailModalOpen(true)}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-400">Configurez vos préférences et quotas de congés</p>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div className="max-w-4xl">
        <div className="space-y-8">
          {/* Quotas de congés */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                📊 Quotas de congés annuels
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Définissez vos quotas pour chaque type de congé
              </p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quota RTT */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    RTT
                  </label>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    (Applicable au 1er Jan)
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.quotas.find(q => q.type === 'rtt')?.yearlyQuota || 23}
                      onChange={(e) => updateQuota('rtt', parseInt(e.target.value) || 0)}
                      className="input w-20"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">jours</span>
                  </div>
                </div>

                {/* Quota CP */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CP
                  </label>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    (Applicable au 31 Mai)
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.quotas.find(q => q.type === 'cp')?.yearlyQuota || 27}
                      onChange={(e) => updateQuota('cp', parseInt(e.target.value) || 0)}
                      className="input w-20"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">jours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Préférences générales */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🔧 Préférences générales
              </h2>
            </div>
            <div className="card-body space-y-6">
              {/* Premier jour de la semaine */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Premier jour de la semaine
                </label>
                <select
                  value={settings.firstDayOfWeek}
                  onChange={(e) => setSettings({ ...settings, firstDayOfWeek: e.target.value as 'monday' | 'sunday' })}
                  className="select"
                >
                  <option value="monday">Lundi</option>
                  <option value="sunday">Dimanche</option>
                </select>
              </div>

              {/* Planning de travail (jours OFF) */}
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Planning de travail (jours OFF)
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Définissez les jours OFF par défaut. Exemple RP: Lundi + Mardi OFF à partir du 01/04/2026.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Applicable à partir du
                    </label>
                    <input
                      type="date"
                      value={getWorkScheduleFromSettings(settings).effectiveFrom}
                      onChange={(e) => {
                        const ws = getWorkScheduleFromSettings(settings)
                        setSettings({
                          ...settings,
                          workSchedule: { ...ws, effectiveFrom: e.target.value }
                        })
                      }}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jours OFF par défaut
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 1, label: 'Lundi' },
                        { value: 2, label: 'Mardi' },
                        { value: 3, label: 'Mercredi' },
                        { value: 4, label: 'Jeudi' },
                        { value: 5, label: 'Vendredi' },
                        { value: 6, label: 'Samedi' },
                        { value: 0, label: 'Dimanche' },
                      ] as const).map(day => {
                        const ws = getWorkScheduleFromSettings(settings)
                        const checked = ws.defaultOffWeekdays.includes(day.value)
                        return (
                          <label key={day.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                // RP = 2 jours OFF par semaine : on garde au maximum 2 jours sélectionnés
                                let next = e.target.checked
                                  ? Array.from(new Set([...ws.defaultOffWeekdays, day.value]))
                                  : ws.defaultOffWeekdays.filter(d => d !== day.value)

                                if (e.target.checked && next.length > 2) {
                                  // retirer les plus anciens pour ne garder que 2 (incluant le nouveau)
                                  next = [...next.slice(next.length - 2)]
                                }

                                setSettings({
                                  ...settings,
                                  workSchedule: { ...ws, defaultOffWeekdays: next }
                                })
                              }}
                              className="rounded border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                            />
                            <span>{day.label}</span>
                          </label>
                        )
                      })}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Par défaut RP : Lundi et Mardi OFF. Vous pouvez choisir d&apos;autres jours. Forcer un jour précis en OFF/ON depuis le calendrier.
                    </p>
                    {(() => {
                      const ws = getWorkScheduleFromSettings(settings)
                      const overrideCount = Object.keys(ws.dateOverrides || {}).length
                      return (
                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSettings({
                                ...settings,
                                workSchedule: { ...ws, defaultOffWeekdays: [1, 2] }
                              })
                            }}
                            className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            Réinitialiser OFF = Lundi + Mardi
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSettings({
                                ...settings,
                                workSchedule: { ...ws, dateOverrides: {} }
                              })
                            }}
                            className="text-xs px-2 py-1 rounded bg-orange-200 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 hover:bg-orange-300 dark:hover:bg-orange-900/50"
                            title="Supprime toutes les exceptions jour-par-jour (OFF/ON définis depuis le calendrier)"
                          >
                            Effacer exceptions ({overrideCount})
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSettings({
                                ...settings,
                                workSchedule: { ...ws, defaultOffWeekdays: [1, 2], dateOverrides: {} }
                              })
                            }}
                            className="text-xs px-2 py-1 rounded bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-200 hover:bg-red-300 dark:hover:bg-red-900/50"
                            title="Remet le planning RP propre : OFF = Lundi/Mardi et aucune exception"
                          >
                            Reset complet planning RP
                          </button>

                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            Pensez à cliquer sur <strong>Sauvegarder</strong>.
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Pays */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pays
                </label>
                <select
                  value={settings.country}
                  onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                  className="select"
                >
                  <option value="FR">France</option>
                  <option value="BE">Belgique</option>
                  <option value="CH">Suisse</option>
                  <option value="CA">Canada</option>
                  <option value="US">États-Unis</option>
                </select>
              </div>

              {/* Mode sombre */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mode sombre
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Activer le thème sombre pour l'interface
                  </p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    settings.darkMode ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                  {settings.darkMode ? (
                    <Moon className="absolute right-1 h-3 w-3 text-white" />
                  ) : (
                    <Sun className="absolute left-1 h-3 w-3 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notifications
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Recevoir des notifications pour les rappels
                  </p>
                </div>
                <button
                  onClick={toggleNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    settings.notifications ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Jours fériés */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🎉 Jours fériés
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Les jours fériés sont automatiquement détectés selon votre pays
              </p>
            </div>
            <div className="card-body">
              {settings.country === 'FR' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Jours fériés fixes */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        📅 Jours fériés fixes
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm font-medium">1er janvier</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Jour de l'An</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm font-medium">1er mai</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fête du Travail</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm font-medium">8 mai</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Victoire 1945</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm font-medium">14 juillet</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fête Nationale</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm font-medium">15 août</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Assomption</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm font-medium">1er novembre</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Toussaint</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm font-medium">11 novembre</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Armistice</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm font-medium">25 décembre</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Noël</span>
                        </div>
                      </div>
                    </div>

                    {/* Jours fériés mobiles */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        🐣 Jours fériés mobiles 2025 (2 jours)
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                          <span className="text-sm font-medium">21 avril 2025</span>
                          <span className="text-sm text-green-700 dark:text-green-300">Lundi de Pâques</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                          <span className="text-sm font-medium">29 mai 2025</span>
                          <span className="text-sm text-green-700 dark:text-green-300">Ascension</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 <strong>Note :</strong> Ces jours fériés sont automatiquement pris en compte dans le calcul des jours ouvrés pour vos congés.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Les jours fériés pour {settings.country} sont automatiquement configurés
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Cette fonctionnalité sera bientôt disponible pour les autres pays
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions de maintenance */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🔧 Maintenance
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={correctWorkingDays}
                  className="flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  title="Recalculer les jours ouvrés de tous les congés (exclure WE et jours fériés)"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Corriger les jours ouvrés
                </button>
                <button
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer tous les congés ?')) {
                      leaveStorage.clearLeaves()
                      toast.success('Congés supprimés')
                      loadData()
                    }
                  }}
                  className="btn-warning w-full"
                >
                  Supprimer tous les congés
                </button>
                <button
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.')) {
                      leaveStorage.clearAllData()
                      toast.success('Données réinitialisées')
                      loadSettings()
                      loadData()
                    }
                  }}
                  className="btn-danger w-full"
                >
                  Réinitialiser toutes les données
                </button>
              </div>
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                  🔧 Correction des jours ouvrés
                </h4>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Cette fonction recalcule automatiquement les jours ouvrés de tous vos congés en excluant les week-ends et les jours fériés. 
                  Utile après un import de données ou une modification des jours fériés.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'envoi d'email */}
      <EmailReportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        leaves={leaves}
        currentYear={new Date().getFullYear()}
      />
    </MainLayout>
  )
}

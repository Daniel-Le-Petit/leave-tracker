'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { LeaveEntry, AppSettings, PublicHoliday, CarryoverLeave } from '../../types'
import { leaveStorage } from '../../utils/storage'
import LeaveCalendar from '../../components/LeaveCalendar'
import MainLayout from '../../components/MainLayout'
import EmailReportModal from '../../components/EmailReportModal'
import {
  getWorkScheduleFromSettings,
  getMonthlyCPRTTSummaryForCalendar,
  CP_RELIQUAT_FIN_DEC_2025,
  RTT_RELIQUAT_FIN_DEC_2025,
  sumCarryoverDaysForYear
} from '../../utils/leaveUtils'

export default function CalendarPage() {
  const [leaves, setLeaves] = useState<LeaveEntry[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [holidays, setHolidays] = useState<PublicHoliday[]>([])
  const [carryovers, setCarryovers] = useState<CarryoverLeave[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  const formatDaysFR = (value: number) => {
    const hasDecimal = value % 1 !== 0
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: hasDecimal ? 1 : 0,
      maximumFractionDigits: 1
    })
  }

  const workSchedule = useMemo(() => getWorkScheduleFromSettings(settings), [settings])
  const quotasWithFallback = useMemo(
    () =>
      settings?.quotas?.length
        ? settings.quotas
        : [
            { type: 'rtt' as const, yearlyQuota: 23 },
            { type: 'cp' as const, yearlyQuota: 27 },
            { type: 'cet' as const, yearlyQuota: 5 }
          ],
    [settings?.quotas]
  )
  const monthlySummary = useMemo(
    () =>
      getMonthlyCPRTTSummaryForCalendar(leaves, currentYear, workSchedule, quotasWithFallback, carryovers),
    [leaves, currentYear, workSchedule, quotasWithFallback, carryovers]
  )

  // Pour le récap 2026 : afficher aussi les CP sur la période 01/06/2025 → 31/05/2026 (mois juin–déc. 2025)
  const monthlySummaryPrevPeriod = useMemo(() => {
    if (currentYear !== 2026) return null
    return getMonthlyCPRTTSummaryForCalendar(leaves, 2025, workSchedule, quotasWithFallback, carryovers)
  }, [currentYear, leaves, workSchedule, quotasWithFallback, carryovers])

  // Reliquats pris en compte dans les calculs (aligné sur leaveUtils pour 2026)
  const carryoverForRecap = useMemo(() => {
    const prev = currentYear - 1
    if (currentYear === 2026) {
      const cp2025 = sumCarryoverDaysForYear(carryovers, 'cp', 2025)
      const rtt2025 = sumCarryoverDaysForYear(carryovers, 'rtt', 2025)
      const cet2025 = sumCarryoverDaysForYear(carryovers, 'cet', 2025)
      const cet2026 = sumCarryoverDaysForYear(carryovers, 'cet', 2026)
      return {
        cp: cp2025 > 0 ? cp2025 : CP_RELIQUAT_FIN_DEC_2025,
        rtt: rtt2025 > 0 ? rtt2025 : RTT_RELIQUAT_FIN_DEC_2025,
        cet: cet2025 + cet2026
      }
    }
    const forYear = (type: 'cp' | 'rtt' | 'cet') =>
      carryovers
        .filter((c) => c.type === type && (Number(c.year) === prev || Number(c.year) === currentYear))
        .reduce((s, c) => s + (Number(c.days) || 0), 0)
    return { cp: forYear('cp'), rtt: forYear('rtt'), cet: forYear('cet') }
  }, [carryovers, currentYear])

  // Reliquats strictement de l'année précédente (année d'origine N-1)
  const carryoverPrevYear = useMemo(() => {
    const prev = currentYear - 1
    const cpPrev = sumCarryoverDaysForYear(carryovers, 'cp', prev)
    const rttPrev = sumCarryoverDaysForYear(carryovers, 'rtt', prev)
    const cetPrev = sumCarryoverDaysForYear(carryovers, 'cet', prev)
    // 2026 : afficher reliquats fin déc. 2025 = 49,5 CP et 0,5 RTT si pas de saisie année 2025
    if (currentYear === 2026 && prev === 2025) {
      return {
        cp: cpPrev > 0 ? cpPrev : CP_RELIQUAT_FIN_DEC_2025,
        rtt: rttPrev > 0 ? rttPrev : RTT_RELIQUAT_FIN_DEC_2025,
        cet: cetPrev,
        year: prev
      }
    }
    return { cp: cpPrev, rtt: rttPrev, cet: cetPrev, year: prev }
  }, [carryovers, currentYear])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      console.log('Début du chargement des données...')
      
      let leavesData: LeaveEntry[] = []
      let settingsData: AppSettings | null = null
      let holidaysData: PublicHoliday[] = []
      let carryoversData: CarryoverLeave[] = []

      try {
        leavesData = await leaveStorage.getLeaves()
      } catch (error) {
        console.log('Erreur lors du chargement des congés:', error)
        leavesData = []
      }

      // Migration (one-shot) : supprimer le CP erroné du 02/01/2026 s'il existe
      // Évite des écritures répétées à chaque refresh.
      try {
        const migrationKey = 'lt_migration_remove_cp_2026_01_02_v1'
        if (typeof window !== 'undefined' && !localStorage.getItem(migrationKey)) {
          const target = '2026-01-02'
          const badLeaves = leavesData.filter(
            (l) => l.type === 'cp' && l.startDate === target && l.endDate === target
          )
          if (badLeaves.length > 0) {
            for (const bad of badLeaves) {
              await leaveStorage.deleteLeave(bad.id)
            }
            leavesData = leavesData.filter(
              (l) => !(l.type === 'cp' && l.startDate === target && l.endDate === target)
            )
            toast.success('CP du 02/01/2026 supprimé')
          }
          localStorage.setItem(migrationKey, new Date().toISOString())
        }
      } catch (e) {
        console.log('Migration CP 02/01/2026: échec (non bloquant):', e)
      }

      try {
        settingsData = await leaveStorage.getSettings()
      } catch (error) {
        console.log('Erreur lors du chargement des paramètres:', error)
        settingsData = null
      }

      try {
        holidaysData = await leaveStorage.getHolidays()
      } catch (error) {
        console.log('Erreur lors du chargement des jours fériés:', error)
        holidaysData = []
      }

      try {
        carryoversData = await leaveStorage.getCarryoverLeaves()
      } catch (carryoverError) {
        console.log('Table carryover non trouvée, utilisation d\'un tableau vide:', carryoverError)
        carryoversData = []
      }

      setLeaves(leavesData)
      setSettings(settingsData ? { ...settingsData, workSchedule: getWorkScheduleFromSettings(settingsData) } : settingsData)
      setHolidays(holidaysData)
      setCarryovers(carryoversData)

      setIsLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      setIsLoading(false)
    }
  }

  const handleLeaveUpdate = async (updatedLeave: LeaveEntry) => {
    try {
      await leaveStorage.updateLeave(updatedLeave)
      setLeaves(prev => prev.map(leave => leave.id === updatedLeave.id ? updatedLeave : leave))
      toast.success('Congé mis à jour avec succès')
    } catch (error) {
      console.error('Erreur lors de la mise à jour du congé:', error)
      toast.error('Erreur lors de la mise à jour du congé')
    }
  }

  const handleExport = () => {
    // Charger les données de feuille de paie depuis localStorage
    let payrollData = {}
    try {
      const savedPayrollData = localStorage.getItem('payrollDataByMonth')
      if (savedPayrollData) {
        payrollData = JSON.parse(savedPayrollData)
      }
    } catch (error) {
      console.log('Erreur lors du chargement des données de feuille de paie:', error)
    }

    const data = {
      leaves,
      settings,
      holidays,
      carryovers,
      payrollData,
      exportDate: new Date().toISOString(),
      version: '1.1'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leave-tracker-backup-${currentYear}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Données exportées avec succès')
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (data.leaves) await leaveStorage.saveLeaves(data.leaves)
      if (data.settings) await leaveStorage.saveSettings(data.settings)
      if (data.holidays) await leaveStorage.saveHolidays(data.holidays)
      if (data.carryovers) await leaveStorage.saveCarryoverLeaves(data.carryovers)
      
      // Importer les données de feuille de paie
      if (data.payrollData) {
        localStorage.setItem('payrollDataByMonth', JSON.stringify(data.payrollData))
      }
      
      toast.success('Données importées avec succès')
      await loadData()
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
      onEmail={() => setIsEmailModalOpen(true)}
    >
      <div className="space-y-8">
        {/* Calendrier des congés */}
        <LeaveCalendar
          leaves={leaves}
          currentYear={currentYear}
          holidays={holidays}
          settings={settings}
          onSettingsUpdate={async (nextSettings) => {
            try {
              await leaveStorage.saveSettings(nextSettings)
              setSettings(nextSettings)
              toast.success('Planning sauvegardé')
            } catch (error) {
              console.error('Erreur lors de la sauvegarde des paramètres:', error)
              toast.error('Erreur lors de la sauvegarde du planning')
            }
          }}
          onLeaveAdd={async (leave) => {
            try {
              await leaveStorage.addLeave(leave)
              setLeaves(prev => [...prev, leave])
              toast.success('Congé ajouté avec succès')
            } catch (error) {
              console.error('Erreur lors de l\'ajout du congé:', error)
              toast.error('Erreur lors de l\'ajout du congé')
            }
          }}
          onLeaveUpdate={handleLeaveUpdate}
          onLeaveDelete={async (id) => {
            try {
              await leaveStorage.deleteLeave(id)
              setLeaves(prev => prev.filter(leave => leave.id !== id))
              toast.success('Congé supprimé avec succès')
            } catch (error) {
              console.error('Erreur lors de la suppression du congé:', error)
              toast.error('Erreur lors de la suppression du congé')
            }
          }}
          onYearChange={(year) => setCurrentYear(year)}
        />

        {/* Récap CP / RTT par mois */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Récapitulatif CP et RTT {currentYear}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentYear === 2026 ? (
                <>Pris par mois (aligné sur le calendrier). 2026 : 2 RTT/mois (1 en décembre, 24/12 exclu) ; CP +27 au 31/05.</>
              ) : (
                <>Pris par mois (aligné sur le calendrier). Restant = quota annuel + reliquat {currentYear - 1} − pris.</>
              )}
            </p>
            {(carryoverForRecap.cp > 0 || carryoverForRecap.rtt > 0 || carryoverForRecap.cet > 0) && (
              <p className="text-sm text-green-700 dark:text-green-400 font-medium mt-1">
                Reliquats inclus : {carryoverForRecap.cp > 0 && `${carryoverForRecap.cp} CP`}
                {carryoverForRecap.cp > 0 && (carryoverForRecap.rtt > 0 || carryoverForRecap.cet > 0) && ' ; '}
                {carryoverForRecap.rtt > 0 && `${carryoverForRecap.rtt} RTT`}
                {carryoverForRecap.rtt > 0 && carryoverForRecap.cet > 0 && ' ; '}
                {carryoverForRecap.cet > 0 && `${carryoverForRecap.cet} CET`}
              </p>
            )}
          </div>
          <div className="card-body overflow-x-auto">
            {monthlySummary ? (
              <table className="w-full text-sm border-collapse border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                      Mois
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold text-white bg-red-500">
                      RTT pris
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold text-white bg-blue-800">
                      CP pris
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                      RTT restant
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                      CP restant
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 dark:bg-gray-800/40">
                    <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 font-semibold text-gray-900 dark:text-white">
                      Reliquat {carryoverPrevYear.year}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold text-gray-900 dark:text-white">
                      {formatDaysFR(carryoverPrevYear.rtt)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold text-gray-900 dark:text-white">
                      {formatDaysFR(carryoverPrevYear.cp)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                      —
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                      —
                    </td>
                  </tr>

                  {currentYear === 2026 && monthlySummaryPrevPeriod && (
                    <>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <td
                          colSpan={5}
                          className="border border-gray-200 dark:border-gray-700 px-3 py-2 font-semibold text-gray-900 dark:text-white"
                        >
                          CP – période 01/06/2025 → 31/05/2026 (juin à décembre 2025)
                        </td>
                      </tr>
                      {monthlySummaryPrevPeriod.slice(5, 12).map((row) => (
                        <tr key={`prev-${row.month}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 font-medium text-gray-900 dark:text-white">
                            {row.monthName} 2025
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                            —
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">
                            {formatDaysFR(row.cpPris)}
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                            —
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center text-green-700 dark:text-green-400 font-medium">
                            {formatDaysFR(row.cpRemaining)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <td
                          colSpan={5}
                          className="border border-gray-200 dark:border-gray-700 px-3 py-2 font-semibold text-gray-900 dark:text-white"
                        >
                          Année civile 2026
                        </td>
                      </tr>
                    </>
                  )}

                  {monthlySummary.map((row) => (
                    <tr key={row.month} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 font-medium text-gray-900 dark:text-white">
                        {row.monthName}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">
                        {formatDaysFR(row.rttPris)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">
                        {formatDaysFR(row.cpPris)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center text-green-700 dark:text-green-400 font-medium">
                        {formatDaysFR(row.rttRemaining)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center text-green-700 dark:text-green-400 font-medium">
                        {formatDaysFR(row.cpRemaining)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure d&apos;abord les quotas de CP / RTT dans les paramètres pour voir le récapitulatif.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'envoi d'email */}
      <EmailReportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        leaves={leaves}
        currentYear={currentYear}
      />
    </MainLayout>
  )
}
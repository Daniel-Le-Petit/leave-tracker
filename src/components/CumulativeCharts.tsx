'use client'

import { LeaveEntry, CarryoverLeave, AppSettings } from '../types'

interface CumulativeChartsProps {
  leaves: LeaveEntry[]
  carryovers: CarryoverLeave[]
  currentYear: number
  settings: AppSettings | null
}

export default function CumulativeCharts({ leaves, carryovers, currentYear, settings }: CumulativeChartsProps) {
  // Filtrer les congés de l'année courante
  const yearLeaves = leaves.filter(leave => 
    new Date(leave.startDate).getFullYear() === currentYear
  )

  // Récupérer les quotas depuis les paramètres
  const rttQuota = settings?.quotas?.find(q => q.type === 'rtt')?.yearlyQuota || 23
  const cpQuota = settings?.quotas?.find(q => q.type === 'cp')?.yearlyQuota || 25
  const cetQuota = settings?.quotas?.find(q => q.type === 'cet')?.yearlyQuota || 5

  // Récupérer les reliquats de l'année précédente
  const rttCarryover = carryovers.find(c => c.type === 'rtt' && c.year === currentYear - 1)?.days || 0
  const cpCarryover = carryovers.find(c => c.type === 'cp' && c.year === currentYear - 1)?.days || 0
  const cetCarryover = carryovers.find(c => c.type === 'cet' && c.year === currentYear - 1)?.days || 0

  // Calculer les totaux disponibles
  const totalRTT = rttQuota + rttCarryover
  const totalCP = cpQuota + cpCarryover
  const totalCET = cetQuota + cetCarryover
  const totalCPCET = totalCP + totalCET

  // Préparer les données pour les graphiques mensuels
  const prepareMonthlyData = () => {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]

    const monthlyData = []
    let cumulativeRTT = 0
    let cumulativeCP = 0
    let cumulativeCET = 0

    for (let month = 1; month <= 12; month++) {
      // Calculer les congés pris ce mois
      const monthLeaves = yearLeaves.filter(leave => {
        const leaveDate = new Date(leave.startDate)
        return leaveDate.getMonth() === month - 1
      })

      const rttTaken = monthLeaves
        .filter(leave => leave.type === 'rtt')
        .reduce((sum, leave) => sum + leave.workingDays, 0)
      
      const cpTaken = monthLeaves
        .filter(leave => leave.type === 'cp')
        .reduce((sum, leave) => sum + leave.workingDays, 0)
      
      const cetTaken = monthLeaves
        .filter(leave => leave.type === 'cet')
        .reduce((sum, leave) => sum + leave.workingDays, 0)

      cumulativeRTT += rttTaken
      cumulativeCP += cpTaken
      cumulativeCET += cetTaken

      // Calculer les congés restants
      const rttRemaining = Math.max(0, totalRTT - cumulativeRTT)
      const cpRemaining = Math.max(0, totalCP - cumulativeCP)
      const cetRemaining = Math.max(0, totalCET - cumulativeCET)
      const cpcetRemaining = Math.max(0, totalCPCET - cumulativeCP - cumulativeCET)

      monthlyData.push({
        month: month,
        monthName: monthNames[month - 1],
        rtt: {
          pris: cumulativeRTT,
          restants: rttRemaining,
          prisCeMois: rttTaken
        },
        cp: {
          pris: cumulativeCP,
          restants: cpRemaining,
          prisCeMois: cpTaken
        },
        cet: {
          pris: cumulativeCET,
          restants: cetRemaining,
          prisCeMois: cetTaken
        },
        cpcet: {
          pris: cumulativeCP + cumulativeCET,
          restants: cpcetRemaining,
          prisCeMois: cpTaken + cetTaken
        }
      })
    }

    return monthlyData
  }

  const monthlyData = prepareMonthlyData()

  return (
    <div className="space-y-8">
      {/* Grille des graphiques mensuels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {monthlyData.map((monthData) => (
          <div key={monthData.month} className="card">
            <div className="card-header p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                {monthData.monthName}
              </h3>
              {/* Totaux du mois */}
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  <span className="font-semibold">+ :</span> RTT {monthData.rtt.prisCeMois} - CP {monthData.cp.prisCeMois} - CET {monthData.cet.prisCeMois}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  <span className="font-semibold">+= :</span> RTT {monthData.rtt.pris} - CP {monthData.cp.pris} - CET {monthData.cet.pris}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  <span className="font-semibold">= :</span> RTT {monthData.rtt.restants} - CP {monthData.cp.restants} - CET {monthData.cet.restants}
                </div>
              </div>
            </div>
            <div className="card-body p-4">
              {/* RTT */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  RTT
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Pris:</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {monthData.rtt.pris}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Restants:</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {monthData.rtt.restants}
                  </span>
                </div>
              </div>

              {/* CP */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  CP
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Pris:</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {monthData.cp.pris}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Restants:</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {monthData.cp.restants}
                  </span>
                </div>
              </div>

              {/* CET */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  CET
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Pris:</span>
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {monthData.cet.pris}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Restants:</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {monthData.cet.restants}
                  </span>
                </div>
              </div>

              {/* CP + CET cumulés */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  CP + CET
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Pris:</span>
                  <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {monthData.cpcet.pris}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Restants:</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {monthData.cpcet.restants}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">
          🎨 Légende des couleurs
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">RTT - Pris</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">CP - Pris</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">CET - Pris</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">CP+CET - Pris</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Restants</span>
          </div>
        </div>
      </div>
    </div>
  )
}
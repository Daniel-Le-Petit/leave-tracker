'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, CheckCircle, AlertTriangle, XCircle, Plus, Trash2, Edit3, Download, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { PayrollData, LeaveEntry } from '../types'
import type { PayrollValidation } from '../types/payroll'

interface PayrollValidationProps {
  leaves: LeaveEntry[];
  currentYear: number;
  onDataUpdate?: () => void;
  onYearChange?: (year: number) => void;
}

export default function PayrollValidation({ leaves, currentYear, onDataUpdate, onYearChange }: PayrollValidationProps) {
  const [payrollData, setPayrollData] = useState<PayrollData[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentMonth = new Date().getMonth() + 1
    return currentMonth === 1 ? 12 : currentMonth - 1
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingData, setEditingData] = useState<PayrollData | null>(null)
  const [formData, setFormData] = useState<Partial<PayrollData>>({})
  const [rttInputValue, setRttInputValue] = useState<string>('')

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const goToPreviousMonth = () => {
    setSelectedMonth(prev => prev === 1 ? 12 : prev - 1)
  }

  const goToNextMonth = () => {
    setSelectedMonth(prev => prev === 12 ? 1 : prev + 1)
  }

  const goToCurrentMonth = () => {
    const currentMonth = new Date().getMonth() + 1
    setSelectedMonth(currentMonth === 1 ? 12 : currentMonth - 1)
  }

  const setCurrentYear = (year: number) => {
    if (onYearChange) {
      onYearChange(year)
    }
  }


  // Charger les données de feuille de paie
  useEffect(() => {
    loadPayrollData()
  }, [currentYear])

  const loadPayrollData = async () => {
    try {
      // Charger depuis payrollDataByMonth (format utilisé par la page payroll)
      const stored = localStorage.getItem('payrollDataByMonth')
      if (stored) {
        const payrollDataByMonth = JSON.parse(stored) as Record<string, Partial<PayrollData>>
        // Convertir l'objet en tableau de PayrollData pour l'année courante
        const payrollDataArray: PayrollData[] = Object.entries(payrollDataByMonth)
          .filter(([key]) => key.startsWith(`${currentYear}-`))
          .map(([key, data]) => {
            // Extraire le mois de la clé (format: "2025-10")
            const month = parseInt(key.split('-')[1])
            return {
              id: key,
              month,
              year: currentYear,
              cpReliquat: data.cpReliquat ?? 0,
              rttPrisDansMois: data.rttPrisDansMois ?? 0,
              soldeCet: data.soldeCet ?? 0,
              cpPrisMoisPrecedent: data.cpPrisMoisPrecedent || [],
              cetPrisMoisPrecedent: data.cetPrisMoisPrecedent || [],
              joursFeries: data.joursFeries || [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as PayrollData
          })
        setPayrollData(payrollDataArray)
      } else {
        // Fallback: essayer l'ancien format pour compatibilité
        const oldStored = localStorage.getItem(`payroll-data-${currentYear}`)
        if (oldStored) {
          setPayrollData(JSON.parse(oldStored))
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de feuille de paie:', error)
    }
  }

  const savePayrollData = async (data: PayrollData[]) => {
    try {
      // Charger les données existantes de payrollDataByMonth
      const existingDataStr = localStorage.getItem('payrollDataByMonth')
      const existingData = existingDataStr ? JSON.parse(existingDataStr) as Record<string, Partial<PayrollData>> : {}
      
      // Convertir le tableau en format payrollDataByMonth
      const payrollDataByMonth: Record<string, Partial<PayrollData>> = { ...existingData }
      
      data.forEach(item => {
        const key = `${item.year}-${item.month.toString().padStart(2, '0')}`
        payrollDataByMonth[key] = {
          month: item.month,
          year: item.year,
          cpReliquat: item.cpReliquat,
          rttPrisDansMois: item.rttPrisDansMois,
          soldeCet: item.soldeCet,
          cpPrisMoisPrecedent: item.cpPrisMoisPrecedent,
          cetPrisMoisPrecedent: item.cetPrisMoisPrecedent,
          joursFeries: item.joursFeries
        }
      })
      
      // Sauvegarder dans le format payrollDataByMonth
      localStorage.setItem('payrollDataByMonth', JSON.stringify(payrollDataByMonth))
      setPayrollData(data)
      onDataUpdate?.()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  // Calculer les données attendues basées sur les congés saisis
  const calculateExpectedData = (month: number, year: number) => {
    const monthLeaves = leaves.filter(leave => {
      const leaveDate = new Date(leave.startDate)
      return leaveDate.getMonth() + 1 === month && leaveDate.getFullYear() === year
    })

    const previousMonth = month === 1 ? 12 : month - 1
    const previousYear = month === 1 ? year - 1 : year
    const previousMonthLeaves = leaves.filter(leave => {
      const leaveDate = new Date(leave.startDate)
      return leaveDate.getMonth() + 1 === previousMonth && leaveDate.getFullYear() === previousYear
    })

    // Calculs RTT - RTT pris dans le mois sélectionné (pas le mois précédent)
    // Quand on valide Décembre, on veut les RTT pris EN Décembre
    const rttLeaves = monthLeaves.filter(leave => leave.type === 'rtt')
    const rttPrisDansMois = rttLeaves.reduce((sum, leave) => sum + leave.workingDays, 0)

    // Calculs CP - CP pris dans le mois précédent
    const cpLeaves = previousMonthLeaves.filter(leave => leave.type === 'cp')
    const cpPrisMoisPrecedentCount = cpLeaves.reduce((sum, leave) => sum + leave.workingDays, 0)

    // Calculs CET - CET pris dans le mois précédent
    const cetLeaves = previousMonthLeaves.filter(leave => leave.type === 'cet')
    const cetPrisDansMois = cetLeaves.reduce((sum, leave) => sum + leave.workingDays, 0)

    // Calcul du reliquat CP attendu (reliquat à la FIN du mois précédent = début du mois en cours)
    // Le reliquat CP dans la feuille de paie correspond au reliquat à la FIN du mois précédent
    // Utiliser la même logique que le calendrier, mais pour le MOIS PRÉCÉDENT
    // Note: previousMonth et previousYear sont déjà déclarés plus haut
    
    // Calculer les CP/CET pris depuis le début de l'année jusqu'à la fin du mois précédent (excluant le mois en cours)
    // Convertir previousMonth de base 1 (1-12) vers base 0 (0-11) pour la comparaison avec getMonth()
    const previousMonthZeroBased = previousMonth - 1 // Convertir de base 1 à base 0
    let cumulativeCP = 0
    
    // Parcourir tous les mois jusqu'au mois précédent inclus
    for (let m = 0; m <= previousMonthZeroBased; m++) {
      const checkYear = previousYear
      
      // Filtrer les congés qui sont dans ce mois
      const monthLeaves = leaves.filter(leave => {
        const leaveDate = new Date(leave.startDate)
        return leaveDate.getMonth() === m && leaveDate.getFullYear() === checkYear
      })
      
      // Ajouter les workingDays des CP et CET de ce mois
      cumulativeCP += monthLeaves
        .filter(leave => leave.type === 'cp' || leave.type === 'cet')
        .reduce((sum, leave) => sum + (leave.workingDays || 0), 0)
    }
    
    // Calculer le reliquat CP selon la même logique que le calendrier (utiliser les mêmes valeurs)
    // Utiliser previousMonthZeroBased pour la comparaison car le calendrier utilise la base 0
    let cpReliquatAttendu = 0
    
    if (previousYear === 2025) {
      const cpReliquat2024 = 43.5
      const cpQuota2025 = 27 // Ajouté au 31/05
      
      // CP : reliquat seulement jusqu'en avril, puis + quota au 31/05
      // previousMonthZeroBased est en base 0 (0=janvier, 3=avril), donc < 4 signifie jusqu'en avril inclus
      if (previousMonthZeroBased < 4) { // Janvier à Avril (0-3)
        cpReliquatAttendu = Math.max(0, cpReliquat2024 - cumulativeCP)
      } else { // Mai et après (4+)
        cpReliquatAttendu = Math.max(0, cpReliquat2024 + cpQuota2025 - cumulativeCP)
      }
    } else if (previousYear === 2026) {
      const cpReliquat2025 = 48.5 // CP restant de 2025 (43.5 + 27 - 22 pris)
      const cpQuota2026 = 27 // Ajouté au 31/05
      
      if (previousMonthZeroBased < 4) { // Janvier à Avril (0-3)
        cpReliquatAttendu = Math.max(0, cpReliquat2025 - cumulativeCP)
      } else { // Mai et après (4+)
        cpReliquatAttendu = Math.max(0, cpReliquat2025 + cpQuota2026 - cumulativeCP)
      }
    } else {
      // Années futures (par défaut)
      cpReliquatAttendu = Math.max(0, 27 - cumulativeCP)
    }

    return {
      rttPrisDansMois,
      rttLeavesDates: rttLeaves.map(leave => ({
        startDate: leave.startDate,
        endDate: leave.endDate,
        workingDays: leave.workingDays
      })),
      cpPrisMoisPrecedent: cpPrisMoisPrecedentCount,
      cpPrisMoisPrecedentDates: cpLeaves.map(leave => ({
        startDate: leave.startDate,
        endDate: leave.endDate,
        workingDays: leave.workingDays
      })),
      cetPrisDansMois,
      cpReliquatAttendu
    }
  }

  // Valider les données
  const validatePayrollData = (data: PayrollData): PayrollValidation => {
    const expected = calculateExpectedData(data.month, data.year)
    
    // Validation CP mois précédent - Comparer les dates
    const cpPrisValidation = {
      saisies: data.cpPrisMoisPrecedent,
      calculees: expected.cpPrisMoisPrecedent,
      manquantes: expected.cpPrisMoisPrecedentDates.filter(expectedLeave => 
        !data.cpPrisMoisPrecedent.some(saisieDate => {
          const saisieDateObj = new Date(saisieDate)
          const expectedStart = new Date(expectedLeave.startDate)
          const expectedEnd = new Date(expectedLeave.endDate)
          return saisieDateObj >= expectedStart && saisieDateObj <= expectedEnd
        })
      ).map(leave => leave.startDate),
      enTrop: data.cpPrisMoisPrecedent.filter(saisieDate => 
        !expected.cpPrisMoisPrecedentDates.some(expectedLeave => {
          const saisieDateObj = new Date(saisieDate)
          const expectedStart = new Date(expectedLeave.startDate)
          const expectedEnd = new Date(expectedLeave.endDate)
          return saisieDateObj >= expectedStart && saisieDateObj <= expectedEnd
        })
      ),
      status: (Math.abs(expected.cpPrisMoisPrecedent - data.cpPrisMoisPrecedent.length) <= 0.5 ? 'valid' : 
              Math.abs(expected.cpPrisMoisPrecedent - data.cpPrisMoisPrecedent.length) <= 1 ? 'warning' : 'error') as 'valid' | 'warning' | 'error'
    }

    // Validation Reliquat CP
    const cpReliquatValidation = {
      saisie: data.cpReliquat,
      calculee: expected.cpReliquatAttendu,
      difference: (data.cpReliquat ?? 0) - (expected.cpReliquatAttendu ?? 0),
      status: (Math.abs((data.cpReliquat ?? 0) - (expected.cpReliquatAttendu ?? 0)) <= 0.5 ? 'valid' : 
              Math.abs((data.cpReliquat ?? 0) - (expected.cpReliquatAttendu ?? 0)) <= 1 ? 'warning' : 'error') as 'valid' | 'warning' | 'error'
    }

    // Validation RTT
    const rttValidation = {
      saisie: data.rttPrisDansMois,
      calculee: expected.rttPrisDansMois,
      difference: (data.rttPrisDansMois ?? 0) - (expected.rttPrisDansMois ?? 0),
      status: (Math.abs((data.rttPrisDansMois ?? 0) - (expected.rttPrisDansMois ?? 0)) <= 0.5 ? 'valid' : 
              Math.abs((data.rttPrisDansMois ?? 0) - (expected.rttPrisDansMois ?? 0)) <= 1 ? 'warning' : 'error') as 'valid' | 'warning' | 'error',
      rttLeavesDates: expected.rttLeavesDates
    }

    // Calcul du score global
    const validations = [rttValidation, cpPrisValidation, cpReliquatValidation]
    const validCount = validations.filter(v => v.status === 'valid').length
    const scoreGlobal = Math.round((validCount / validations.length) * 100)
    
    const statusGlobal = scoreGlobal >= 90 ? 'valid' : scoreGlobal >= 70 ? 'warning' : 'error'

    return {
      month: data.month,
      year: data.year,
      cpReliquat: cpReliquatValidation,
      rttPrisDansMois: rttValidation,
      soldeCet: { 
        saisie: data.soldeCet, 
        calculee: expected.cetPrisDansMois, 
        difference: (data.soldeCet ?? 0) - (expected.cetPrisDansMois ?? 0), 
        status: Math.abs((data.soldeCet ?? 0) - (expected.cetPrisDansMois ?? 0)) <= 0.5 ? 'valid' : 
                Math.abs((data.soldeCet ?? 0) - (expected.cetPrisDansMois ?? 0)) <= 1 ? 'warning' : 'error'
      },
      cpPrisMoisPrecedent: cpPrisValidation,
      joursFeries: { saisies: data.joursFeries, calculees: [], manquantes: [], enTrop: [], status: 'valid' },
      scoreGlobal,
      statusGlobal
    }
  }

  const validations = useMemo(() => {
    return payrollData
      .filter(data => data.month === selectedMonth)
      .map(validatePayrollData)
  }, [payrollData, leaves, selectedMonth])

  const openModal = (data?: PayrollData) => {
    if (data) {
      setEditingData(data)
      setFormData(data)
      setRttInputValue(data.rttPrisDansMois !== undefined ? String(data.rttPrisDansMois) : '')
    } else {
      // Calculer les valeurs suggérées basées sur les congés existants
      const expected = calculateExpectedData(selectedMonth, currentYear)
      
      setEditingData(null)
      setFormData({
        month: selectedMonth,
        year: currentYear,
        cpReliquat: expected.cpReliquatAttendu, // Reliquat CP calculé
        rttPrisDansMois: expected.rttPrisDansMois, // RTT pris du mois sélectionné
        soldeCet: expected.cetPrisDansMois, // Solde CET du mois précédent
        cpPrisMoisPrecedent: [], // CP pris du mois précédent (dates)
        joursFeries: [] // Jours fériés du mois précédent
      })
      setRttInputValue(expected.rttPrisDansMois !== undefined ? String(expected.rttPrisDansMois) : '')
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingData(null)
    setFormData({})
    setRttInputValue('')
  }

  // Normaliser les dates au format YYYY-MM-DD
  const normalizeDate = (dateStr: string): string => {
    // Gérer différents formats de dates
    if (dateStr.includes('/')) {
      // Format DD/MM/YYYY
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const [day, month, year] = parts
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    } else if (dateStr.includes('-') && dateStr.split('-')[0].length <= 2) {
      // Format DD-MM-YYYY
      const parts = dateStr.split('-')
      if (parts.length === 3 && parts[0].length <= 2) {
        const [day, month, year] = parts
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }
    // Format déjà en YYYY-MM-DD ou autre format non reconnu
    return dateStr
  }

  const handleSave = () => {
    if (!formData.month || !formData.year) {
      toast.error('Veuillez sélectionner un mois et une année')
      return
    }

    // Normaliser les dates et filtrer les lignes vides
    const normalizedCpPris = (formData.cpPrisMoisPrecedent || [])
      .filter(line => line.trim()) // Filtrer les lignes vides
      .map(normalizeDate)
    const normalizedJoursFeries = (formData.joursFeries || [])
      .filter(line => line.trim()) // Filtrer les lignes vides
      .map(normalizeDate)

    const newData: PayrollData = {
      id: editingData?.id || Date.now().toString(),
      month: formData.month!,
      year: formData.year!,
      cpReliquat: formData.cpReliquat ?? 0,
      rttPrisDansMois: formData.rttPrisDansMois ?? 0,
      soldeCet: formData.soldeCet ?? 0,
      cpPrisMoisPrecedent: normalizedCpPris,
      cetPrisMoisPrecedent: [],
      joursFeries: normalizedJoursFeries,
      createdAt: editingData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedData = editingData 
      ? payrollData.map(d => d.id === editingData.id ? newData : d)
      : [...payrollData, newData]

    savePayrollData(updatedData)
    closeModal()
    toast.success(editingData ? 'Données mises à jour' : 'Données ajoutées')
  }

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ces données de feuille de paie ?')) {
      const updatedData = payrollData.filter(d => d.id !== id)
      savePayrollData(updatedData)
      toast.success('Données supprimées')
    }
  }

  const handleExport = () => {
    const data = {
      payrollData,
      currentYear,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-validation-data-${currentYear}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Données de validation exportées avec succès')
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (data.payrollData && Array.isArray(data.payrollData)) {
        await savePayrollData(data.payrollData)
        toast.success('Données de validation importées avec succès')
      } else {
        toast.error('Format de fichier invalide')
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      toast.error('Erreur lors de l\'import des données')
    }
  }

  const handleAutoCorrect = (data: PayrollData) => {
    const expected = calculateExpectedData(data.month, data.year)
    
    const correctedData: PayrollData = {
      ...data,
      cpReliquat: expected.cpReliquatAttendu,
      rttPrisDansMois: expected.rttPrisDansMois,
      soldeCet: expected.cetPrisDansMois,
      updatedAt: new Date().toISOString()
    }

    const updatedData = payrollData.map(d => d.id === data.id ? correctedData : d)
    savePayrollData(updatedData)
    toast.success('Données corrigées automatiquement')
  }

  const handleValidateAll = () => {
    const expected = calculateExpectedData(selectedMonth, currentYear)
    
    // Créer ou mettre à jour les données pour le mois sélectionné
    const existingData = payrollData.find(d => d.month === selectedMonth && d.year === currentYear)
    
    if (existingData) {
      // Mettre à jour les données existantes
      const updatedData = payrollData.map(d => 
        d.id === existingData.id 
          ? {
              ...d,
              cpReliquat: expected.cpReliquatAttendu,
              rttPrisDansMois: expected.rttPrisDansMois,
              soldeCet: expected.cetPrisDansMois,
              updatedAt: new Date().toISOString()
            }
          : d
      )
      savePayrollData(updatedData)
      toast.success('Données validées et mises à jour automatiquement')
    } else {
      // Créer de nouvelles données
      const newData: PayrollData = {
        id: Date.now().toString(),
        month: selectedMonth,
        year: currentYear,
        cpReliquat: expected.cpReliquatAttendu,
        rttPrisDansMois: expected.rttPrisDansMois,
        soldeCet: expected.cetPrisDansMois,
        cpPrisMoisPrecedent: [],
        cetPrisMoisPrecedent: [],
        joursFeries: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const updatedData = [...payrollData, newData]
      savePayrollData(updatedData)
      toast.success('Nouvelles données créées automatiquement')
    }
  }

  const getStatusIcon = (status: 'valid' | 'warning' | 'error') => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: 'valid' | 'warning' | 'error') => {
    switch (status) {
      case 'valid': return 'bg-green-50 border-green-200 text-green-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  return (
    <div className="card bg-green-50 dark:bg-green-900/10">

      <div className="card-header">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Validation Feuilles de Paie
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Vérifiez que les données de votre feuille de paie correspondent à ce qui a été saisi dans Leave Tracker
              </p>
              
              {/* Boutons d'action rapides */}
              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={() => openModal()}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  title="Ajouter des données de feuille de paie"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter</span>
                </button>
                
                <button
                  onClick={handleValidateAll}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  title="Validation automatique"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Auto</span>
                </button>
                
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-payroll"
                />
                <label
                  htmlFor="import-payroll"
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-md cursor-pointer transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span>Import</span>
                </label>
                
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Export</span>
                </button>
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentYear(currentYear - 1)}
                    className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Année précédente"
                  >
                    ←
                  </button>
                  <span className="px-3 py-1 text-sm font-medium bg-green-600 text-white rounded">{currentYear}</span>
                  <button
                    onClick={() => setCurrentYear(currentYear + 1)}
                    className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Année suivante"
                  >
                    →
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousMonth}
                    className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Mois précédent"
                  >
                    ←
                  </button>
                  <span className="px-3 py-1 text-sm font-medium bg-blue-500 text-white rounded">{monthNames[selectedMonth - 1]}</span>
                  <button
                    onClick={goToNextMonth}
                    className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Mois suivant"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Boutons d'action principaux - TOUJOURS VISIBLES */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Actions Disponibles
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vous pouvez créer, modifier ou valider automatiquement vos données de feuille de paie
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => openModal()}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg min-w-[200px]"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">
                {validations.length === 0 ? 'Ajouter des données' : 'Ajouter une autre feuille'}
              </span>
            </button>
            
            <button
              onClick={handleValidateAll}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg min-w-[200px]"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">
                Validation Automatique
              </span>
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Conseil: Utilisez "Validation Automatique" pour créer des données basées sur vos congés enregistrés
            </p>
          </div>
        </div>

        {/* Section d'information sur les calculs automatiques */}
        {(() => {
          const expected = calculateExpectedData(selectedMonth, currentYear)
          return (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">i</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                    Données calculées automatiquement pour {monthNames[selectedMonth - 1]} {currentYear}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-green-700 dark:text-green-300">
                    <div>
                      <strong>Reliquat CP calculé:</strong> {expected.cpReliquatAttendu} jours
                    </div>
                    <div>
                      <strong>RTT pris ({monthNames[selectedMonth - 1]}):</strong> {expected.rttPrisDansMois} jours
                    </div>
                    <div>
                      <strong>CET pris ({monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]}):</strong> {expected.cetPrisDansMois} jours
                    </div>
                    <div>
                      <strong>CP pris ({monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]}):</strong> {expected.cpPrisMoisPrecedent} jours
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-green-100 dark:bg-green-800/30 rounded text-xs">
                    <strong>Logique:</strong> RTT de {monthNames[selectedMonth - 1]}, autres données du mois précédent ({monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]})
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {validations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Aucune donnée de feuille de paie saisie pour {monthNames[selectedMonth - 1]} {currentYear}
            </p>
            <p className="text-sm text-gray-400">
              Utilisez "Validation Automatique" pour créer des données basées sur vos congés enregistrés
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {validations.map((validation, index) => {
              const data = payrollData.filter(d => d.month === selectedMonth)[index]
              return (
                <div key={data.id} className={`border rounded-lg p-4 ${getStatusColor(validation.statusGlobal)}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(validation.statusGlobal)}
                      <div>
                        <h3 className="font-semibold">
                          {monthNames[data.month - 1]} {data.year}
                        </h3>
                        <p className="text-sm opacity-75">
                          Score de validation: {validation.scoreGlobal}%
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal()}
                        className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                        title="Ajouter une feuille de paie"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(data)}
                        className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {validation.statusGlobal !== 'valid' && (
                        <button
                          onClick={() => handleAutoCorrect(data)}
                          className="p-2 text-gray-600 hover:text-yellow-600 transition-colors"
                          title="Corriger automatiquement"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(data.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Titre Vérifications */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 mt-6">
                    Vérifications
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Reliquat CP */}
                    <div className={`rounded p-3 border-2 ${validation.cpReliquat.status === 'valid' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Reliquat CP</span>
                        {getStatusIcon(validation.cpReliquat.status)}
                      </div>
                      <div className="text-sm">
                        <div className="mb-1">
                          <span>Feuille de paie: </span>
                          <span className="font-medium">{validation.cpReliquat.saisie !== undefined && validation.cpReliquat.saisie !== null ? validation.cpReliquat.saisie : 'Non saisie'}</span>
                          <span> | </span>
                          <span>Saisi: </span>
                          <span className="font-medium">{validation.cpReliquat.calculee !== undefined && validation.cpReliquat.calculee !== null ? validation.cpReliquat.calculee : 'Non calculée'}</span>
                        </div>
                      </div>
                    </div>

                    {/* RTT Pris dans le mois sélectionné */}
                    <div className={`rounded p-3 border-2 ${validation.rttPrisDansMois.status === 'valid' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">RTT de {monthNames[selectedMonth - 1]} {currentYear}</span>
                        {getStatusIcon(validation.rttPrisDansMois.status)}
                      </div>
                      <div className="text-sm">
                        <div className="mb-1">
                          <span>Feuille de paie: </span>
                          <span className="font-medium">{validation.rttPrisDansMois.saisie !== undefined && validation.rttPrisDansMois.saisie !== null ? validation.rttPrisDansMois.saisie : 'Non saisie'}</span>
                          <span> | </span>
                          <span>Application: </span>
                          <span className="font-medium">{validation.rttPrisDansMois.calculee !== undefined && validation.rttPrisDansMois.calculee !== null ? validation.rttPrisDansMois.calculee : 'Non calculée'}</span>
                        </div>
                      </div>
                    </div>

                    {/* CP Pris mois précédent */}
                    <div className={`rounded p-3 border-2 ${validation.cpPrisMoisPrecedent.status === 'valid' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">CP {monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]} {selectedMonth === 1 ? currentYear - 1 : currentYear}</span>
                        {getStatusIcon(validation.cpPrisMoisPrecedent.status)}
                      </div>
                      <div className="text-sm">
                        <div className="mb-1">
                          <span>Feuille de paie: </span>
                          <span className="font-medium">{validation.cpPrisMoisPrecedent.saisies.length} dates</span>
                          <span> | </span>
                          <span>Application: </span>
                          <span className="font-medium">{validation.cpPrisMoisPrecedent.calculees} dates</span>
                        </div>
                        {validation.cpPrisMoisPrecedent.manquantes.length > 0 && (
                          <div className="text-xs text-red-600">
                            <div className="font-medium">Manquants:</div>
                            <div className="ml-2">{validation.cpPrisMoisPrecedent.manquantes.map(date => {
                              const d = new Date(date)
                              return d.toLocaleDateString('fr-FR')
                            }).join(', ')}</div>
                          </div>
                        )}
                        {validation.cpPrisMoisPrecedent.enTrop.length > 0 && (
                          <div className="text-xs text-yellow-600">
                            <div className="font-medium">En trop:</div>
                            <div className="ml-2">{validation.cpPrisMoisPrecedent.enTrop.map(date => {
                              const d = new Date(date)
                              return d.toLocaleDateString('fr-FR')
                            }).join(', ')}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Solde CET */}
                    <div className={`rounded p-3 border-2 ${validation.soldeCet.status === 'valid' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Solde CET {currentYear}</span>
                        {getStatusIcon(validation.soldeCet.status)}
                      </div>
                      <div className="text-sm">
                        <div className="mb-1">
                          <span>Feuille de paie: </span>
                          <span className="font-medium">{validation.soldeCet.saisie !== undefined && validation.soldeCet.saisie !== null ? validation.soldeCet.saisie : 'Non saisie'}</span>
                          <span> | </span>
                          <span>Application: </span>
                          <span className="font-medium">{validation.soldeCet.calculee !== undefined && validation.soldeCet.calculee !== null ? validation.soldeCet.calculee : 'Non calculée'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Détails des dates CP saisies */}
                  {validation.cpPrisMoisPrecedent.saisies.length > 0 || validation.cpPrisMoisPrecedent.calculees > 0 ? (
                    <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Dates saisies:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Feuille de paie:</div>
                          {validation.cpPrisMoisPrecedent.saisies.length > 0 ? (
                            <div className="space-y-1">
                              {validation.cpPrisMoisPrecedent.saisies.map((date, index) => (
                                <div key={index} className="text-gray-600 dark:text-gray-400">
                                  {date}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-400 dark:text-gray-500 italic">Aucune date</div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Application:</div>
                          {validation.cpPrisMoisPrecedent.calculees > 0 ? (
                            <div className="space-y-1">
                              {validation.cpPrisMoisPrecedent.calculees > 0 && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  {validation.cpPrisMoisPrecedent.calculees} jour{validation.cpPrisMoisPrecedent.calculees > 1 ? 's' : ''} trouvé{validation.cpPrisMoisPrecedent.calculees > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400 dark:text-gray-500 italic">Aucune date</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Résumé des incohérences - affiché seulement s'il y a des problèmes */}
                  {(validation.cpReliquat.difference !== 0 ||
                    validation.rttPrisDansMois.difference !== 0 || 
                    validation.cpPrisMoisPrecedent.manquantes.length > 0 || 
                    validation.cpPrisMoisPrecedent.enTrop.length > 0 || 
                    validation.soldeCet.difference !== 0) && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Incohérences détectées</h4>
                      </div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        {validation.cpReliquat.difference !== 0 && (
                          <div>• Reliquat CP: {validation.cpReliquat.difference > 0 ? 'Trop de jours saisis' : 'Jours manquants'} ({Math.abs(validation.cpReliquat.difference)} jour{Math.abs(validation.cpReliquat.difference) > 1 ? 's' : ''})</div>
                        )}
                        {validation.rttPrisDansMois.difference !== 0 && (
                          <div>• RTT: {validation.rttPrisDansMois.difference > 0 ? 'Trop de jours saisis' : 'Jours manquants'} ({Math.abs(validation.rttPrisDansMois.difference)} jour{Math.abs(validation.rttPrisDansMois.difference) > 1 ? 's' : ''})</div>
                        )}
                        {validation.cpPrisMoisPrecedent.manquantes.length > 0 && (
                          <div>• CP: {validation.cpPrisMoisPrecedent.manquantes.length} jour{validation.cpPrisMoisPrecedent.manquantes.length > 1 ? 's' : ''} manquant{validation.cpPrisMoisPrecedent.manquantes.length > 1 ? 's' : ''}</div>
                        )}
                        {validation.cpPrisMoisPrecedent.enTrop.length > 0 && (
                          <div>• CP: {validation.cpPrisMoisPrecedent.enTrop.length} jour{validation.cpPrisMoisPrecedent.enTrop.length > 1 ? 's' : ''} en trop</div>
                        )}
                        {validation.soldeCet.difference !== 0 && (
                          <div>• CET: Différence de {Math.abs(validation.soldeCet.difference)} jour{Math.abs(validation.soldeCet.difference) > 1 ? 's' : ''}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Corrections suggérées - affiché seulement s'il y a des problèmes ou si tout est cohérent */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-800 dark:text-green-200">
                        {validation.cpReliquat.status === 'valid' && validation.rttPrisDansMois.status === 'valid' && validation.cpPrisMoisPrecedent.status === 'valid' && validation.soldeCet.status === 'valid' 
                          ? 'Validation réussie' 
                          : 'Corrections attendues'
                        } :
                      </h4>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-3">
                      {validation.cpReliquat.difference !== 0 && (
                        <div>
                          <div className="font-semibold mb-1">• <strong>Reliquat CP:</strong> {validation.cpReliquat.difference > 0 ? 'Réduire' : 'Augmenter'} le reliquat saisi</div>
                          <div className="ml-4 text-xs space-y-1">
                            <div>📊 <strong>Feuille de paie:</strong> {validation.cpReliquat.saisie !== undefined && validation.cpReliquat.saisie !== null ? `${validation.cpReliquat.saisie} jour${validation.cpReliquat.saisie > 1 ? 's' : ''} CP reliquat` : 'Non saisie'}</div>
                            <div>📅 <strong>Application calculée:</strong> {validation.cpReliquat.calculee !== undefined && validation.cpReliquat.calculee !== null ? `${validation.cpReliquat.calculee} jour${validation.cpReliquat.calculee > 1 ? 's' : ''} CP reliquat` : 'Non calculée'}</div>
                            <div>⚖️ <strong>Action:</strong> {validation.cpReliquat.difference > 0 ? 'Réduire de' : 'Augmenter de'} {Math.abs(validation.cpReliquat.difference)} jour{Math.abs(validation.cpReliquat.difference) > 1 ? 's' : ''} le reliquat CP</div>
                          </div>
                        </div>
                      )}
                      {validation.rttPrisDansMois.difference !== 0 && (
                        <div>
                          <div className="font-semibold mb-1">• <strong>RTT:</strong> {validation.rttPrisDansMois.difference > 0 ? 'Réduire' : 'Augmenter'} le nombre de jours saisis</div>
                          <div className="ml-4 text-xs space-y-1">
                            <div>📊 <strong>Feuille de paie:</strong> {validation.rttPrisDansMois.saisie} jour{validation.rttPrisDansMois.saisie > 1 ? 's' : ''} RTT pris en {monthNames[data.month === 1 ? 11 : data.month - 2]} {data.month === 1 ? data.year - 1 : data.year}</div>
                            <div>📅 <strong>Congés enregistrés:</strong> {validation.rttPrisDansMois.calculee} jour{validation.rttPrisDansMois.calculee > 1 ? 's' : ''} RTT trouvé{validation.rttPrisDansMois.calculee > 1 ? 's' : ''} dans le système</div>
                            {validation.rttPrisDansMois.rttLeavesDates && validation.rttPrisDansMois.rttLeavesDates.length > 0 && (
                              <div>📅 <strong>Dates dans le calendrier:</strong> {validation.rttPrisDansMois.rttLeavesDates.map((leave, index) => (
                                <span key={index}>
                                  {new Date(leave.startDate).toLocaleDateString('fr-FR')} - {new Date(leave.endDate).toLocaleDateString('fr-FR')} ({leave.workingDays} jour{leave.workingDays > 1 ? 's' : ''})
                                  {index < validation.rttPrisDansMois.rttLeavesDates!.length - 1 ? ', ' : ''}
                                </span>
                              ))}</div>
                            )}
                            <div>⚖️ <strong>Action:</strong> {validation.rttPrisDansMois.difference > 0 ? 'Réduire de' : 'Augmenter de'} {Math.abs(validation.rttPrisDansMois.difference)} jour{Math.abs(validation.rttPrisDansMois.difference) > 1 ? 's' : ''} sur la feuille de paie</div>
                          </div>
                        </div>
                      )}
                      {validation.cpPrisMoisPrecedent.manquantes.length > 0 && (
                        <div>
                          <div className="font-semibold mb-1">• <strong>CP {monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]}:</strong> Ajouter les dates manquantes</div>
                          <div className="ml-4 text-xs space-y-1">
                            <div>📊 <strong>Feuille de paie:</strong> {validation.cpPrisMoisPrecedent.saisies.length} jour{validation.cpPrisMoisPrecedent.saisies.length > 1 ? 's' : ''} CP saisis</div>
                            <div>📋 <strong>Dates sur feuille de paie:</strong> {validation.cpPrisMoisPrecedent.saisies.map(date => {
                              const d = new Date(date)
                              return d.toLocaleDateString('fr-FR')
                            }).join(', ')}</div>
                            <div>📅 <strong>Congés enregistrés:</strong> {validation.cpPrisMoisPrecedent.calculees} jour{validation.cpPrisMoisPrecedent.calculees > 1 ? 's' : ''} CP trouvé{validation.cpPrisMoisPrecedent.calculees > 1 ? 's' : ''} dans le système (jours ouvrés uniquement)</div>
                            <div>➕ <strong>Dates à ajouter:</strong> {validation.cpPrisMoisPrecedent.manquantes.map(date => {
                              const d = new Date(date)
                              return d.toLocaleDateString('fr-FR')
                            }).join(', ')}</div>
                            <div>💡 <strong>Raison:</strong> Ces dates sont dans vos congés enregistrés mais pas sur votre feuille de paie</div>
                          </div>
                        </div>
                      )}
                      {validation.cpPrisMoisPrecedent.enTrop.length > 0 && (
                        <div>
                          <div className="font-semibold mb-1">• <strong>CP {monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]}:</strong> Supprimer les dates en trop</div>
                          <div className="ml-4 text-xs space-y-1">
                            <div>📊 <strong>Feuille de paie:</strong> {validation.cpPrisMoisPrecedent.saisies.length} jour{validation.cpPrisMoisPrecedent.saisies.length > 1 ? 's' : ''} CP saisis</div>
                            <div>📋 <strong>Dates sur feuille de paie:</strong> {validation.cpPrisMoisPrecedent.saisies.map(date => {
                              const d = new Date(date)
                              return d.toLocaleDateString('fr-FR')
                            }).join(', ')}</div>
                            <div>📅 <strong>Congés enregistrés:</strong> {validation.cpPrisMoisPrecedent.calculees} jour{validation.cpPrisMoisPrecedent.calculees > 1 ? 's' : ''} CP trouvé{validation.cpPrisMoisPrecedent.calculees > 1 ? 's' : ''} dans le système (jours ouvrés uniquement)</div>
                            <div>➖ <strong>Dates à supprimer:</strong> {validation.cpPrisMoisPrecedent.enTrop.map(date => {
                              const d = new Date(date)
                              return d.toLocaleDateString('fr-FR')
                            }).join(', ')}</div>
                            <div>💡 <strong>Raison:</strong> Ces dates sont sur votre feuille de paie mais pas dans vos congés enregistrés</div>
                          </div>
                        </div>
                      )}
                      {validation.soldeCet.difference !== 0 && (
                        <div>
                          <div className="font-semibold mb-1">• <strong>Solde CET:</strong> Ajuster le solde</div>
                          <div className="ml-4 text-xs space-y-1">
                            <div>📊 <strong>Feuille de paie:</strong> {validation.soldeCet.saisie !== undefined && validation.soldeCet.saisie !== null ? `${validation.soldeCet.saisie} jour${validation.soldeCet.saisie > 1 ? 's' : ''} CET` : 'Non saisie'}</div>
                            <div>📅 <strong>Congés enregistrés:</strong> {validation.soldeCet.calculee} jour{validation.soldeCet.calculee > 1 ? 's' : ''} CET trouvé{validation.soldeCet.calculee > 1 ? 's' : ''} dans le système</div>
                            <div>⚖️ <strong>Action:</strong> {validation.soldeCet.difference > 0 ? 'Réduire de' : 'Augmenter de'} {Math.abs(validation.soldeCet.difference)} jour{Math.abs(validation.soldeCet.difference) > 1 ? 's' : ''} le solde CET</div>
                          </div>
                        </div>
                      )}
                      {validation.cpReliquat.status === 'valid' && validation.rttPrisDansMois.status === 'valid' && validation.cpPrisMoisPrecedent.status === 'valid' && validation.soldeCet.status === 'valid' && (
                        <div className="text-green-600 dark:text-green-400">✅ Toutes les données sont cohérentes !</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de saisie */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingData ? 'Modifier' : 'Ajouter'} Données Feuille de Paie
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Fermer"
                  aria-label="Fermer le modal"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Mois et Année */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mois
                    </label>
                    <select
                      value={formData.month || ''}
                      onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      aria-label="Sélectionner le mois"
                    >
                      {monthNames.map((month, index) => (
                        <option key={index} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Année
                    </label>
                    <input
                      type="number"
                      value={formData.year || ''}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 2025"
                      aria-label="Saisir l'année"
                    />
                  </div>
                </div>

                {/* Reliquat CP calculé */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CP Reliquat (mois précédent)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cpReliquat || ''}
                    onChange={(e) => setFormData({...formData, cpReliquat: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: 47.5"
                    aria-label="Saisir le reliquat CP du mois précédent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Reliquat CP à la fin de {monthNames[(formData.month || selectedMonth) === 1 ? 11 : (formData.month || selectedMonth) - 2]} (début de {monthNames[(formData.month || selectedMonth) - 1]}). 
                    Calculé depuis le début de l'année jusqu'à la fin du mois précédent, SANS soustraire les CP pris en {monthNames[(formData.month || selectedMonth) - 1]}.
                  </p>
                </div>

                {/* RTT et CET */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      RTT de {monthNames[(formData.month || selectedMonth) - 1]} {formData.year || currentYear}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rttInputValue}
                        onChange={(e) => {
                          const rawValue = e.target.value
                          // Allow empty, numbers, and decimals
                          if (rawValue === '') {
                            setRttInputValue('')
                            setFormData({...formData, rttPrisDansMois: undefined})
                          } else if (/^-?\d*\.?\d*$/.test(rawValue)) {
                            // Always update the display value to allow typing decimals
                            setRttInputValue(rawValue)
                            // Try to parse the value - if valid, update formData
                            if (rawValue !== '-' && rawValue !== '.') {
                              const numValue = parseFloat(rawValue)
                              if (!isNaN(numValue) && numValue >= 0) {
                                setFormData({...formData, rttPrisDansMois: numValue})
                              }
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim()
                          if (value === '' || value === '.') {
                            setFormData({...formData, rttPrisDansMois: undefined})
                            setRttInputValue('')
                          } else {
                            const numValue = parseFloat(value)
                            if (!isNaN(numValue) && numValue >= 0) {
                              setFormData({...formData, rttPrisDansMois: numValue})
                              setRttInputValue(String(numValue))
                            } else {
                              setFormData({...formData, rttPrisDansMois: undefined})
                              setRttInputValue('')
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ex: 4.5"
                        aria-label={`Saisir le nombre de jours RTT pris en ${monthNames[(formData.month || selectedMonth) - 1]}`}
                      />
                      {(() => {
                        const expected = calculateExpectedData(formData.month || selectedMonth, formData.year || currentYear)
                        if (expected.rttPrisDansMois !== (formData.rttPrisDansMois || 0)) {
                          return (
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, rttPrisDansMois: expected.rttPrisDansMois})}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                              title={`Suggéré: ${expected.rttPrisDansMois} jours (basé sur les congés enregistrés)`}
                            >
                              {expected.rttPrisDansMois}
                            </button>
                          )
                        }
                        return null
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      RTT pris en {monthNames[(formData.month || selectedMonth) - 1]} {formData.year || currentYear}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Solde CET (mois précédent)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formData.soldeCet || ''}
                        onChange={(e) => setFormData({...formData, soldeCet: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ex: 5"
                        aria-label="Saisir le solde CET du mois précédent"
                      />
                      {(() => {
                        const expected = calculateExpectedData(formData.month || selectedMonth, formData.year || currentYear)
                        if (expected.cetPrisDansMois !== (formData.soldeCet || 0)) {
                          return (
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, soldeCet: expected.cetPrisDansMois})}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                              title={`Suggéré: ${expected.cetPrisDansMois} jours (basé sur les congés enregistrés)`}
                            >
                              {expected.cetPrisDansMois}
                            </button>
                          )
                        }
                        return null
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Solde CET du mois précédent - CET pris du mois précédent
                    </p>
                  </div>
                </div>

                {/* CP pris mois précédent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CP Pris (mois précédent) - Dates
                  </label>
                  <textarea
                    value={(formData.cpPrisMoisPrecedent || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n')
                      setFormData({...formData, cpPrisMoisPrecedent: lines})
                    }}
                    placeholder="Une date par ligne (formats acceptés):&#10;• DD-MM-YYYY: 15-07-2025&#10;• DD/MM/YYYY: 15/07/2025&#10;• YYYY-MM-DD: 2025-07-15&#10;&#10;Exemple:&#10;15-07-2025&#10;16-07-2025&#10;17-07-2025&#10;18-07-2025"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    CP pris sur {monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]} - Formats acceptés: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD
                  </p>
                </div>

                {/* Jours fériés */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jours fériés (mois précédent)
                  </label>
                  <textarea
                    value={(formData.joursFeries || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n')
                      setFormData({...formData, joursFeries: lines})
                    }}
                    placeholder="Une date par ligne (formats acceptés):&#10;• DD-MM-YYYY: 14-07-2025&#10;• DD/MM/YYYY: 14/07/2025&#10;• YYYY-MM-DD: 2025-07-14&#10;&#10;Exemple:&#10;14-07-2025"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Jours fériés de {monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]} - Formats acceptés: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {editingData ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Titre en bas */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Verifications Feuille/Calendrier
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-semibold mb-2">Explication des champs :</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>RTT de {monthNames[selectedMonth - 1]} :</strong> RTT pris pendant le mois sélectionné ({monthNames[selectedMonth - 1]} {currentYear})</li>
            <li><strong>Reliquat CP :</strong> Reliquat CP à la fin de {monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]} (début de {monthNames[selectedMonth - 1]}). 
                Il représente le solde CP disponible au début du mois sélectionné, calculé depuis le début de l'année jusqu'à la fin du mois précédent, 
                <strong className="text-red-600 dark:text-red-400"> SANS soustraire les CP pris en {monthNames[selectedMonth - 1]}</strong>.</li>
            <li><strong>CP Pris (mois précédent) :</strong> CP pris pendant le mois précédent ({monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]})</li>
            <li><strong>Solde CET (mois précédent) :</strong> Solde CET à la fin du mois précédent</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

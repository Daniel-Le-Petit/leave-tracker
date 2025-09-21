'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Gift, Sun, AlertTriangle, TrendingUp, Plus, Edit3, Trash2 } from 'lucide-react';
import LeaveFormModal from './LeaveFormModal';
import { getHolidaysForYear } from '../utils/leaveUtils';

interface LeaveCalendarProps {
  leaves: any[];
  currentYear: number;
  holidays: any[];
  onLeaveAdd?: (leave: any) => void;
  onLeaveUpdate?: (leave: any) => void;
  onLeaveDelete?: (id: string) => void;
  onYearChange?: (year: number) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  leave?: any;
  suggestions?: string[];
}

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ 
  leaves, 
  currentYear, 
  holidays, 
  onLeaveAdd, 
  onLeaveUpdate, 
  onLeaveDelete,
  onYearChange
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [viewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Synchroniser displayYear avec currentYear
  React.useEffect(() => {
    setDisplayYear(currentYear);
  }, [currentYear]);

  // Détection mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Jours fériés par défaut
  const holidaysArray = useMemo(() => {
    if (Array.isArray(holidays) && holidays.length > 0) {
      // Filtrer les jours fériés pour l'année courante du calendrier
      return holidays.filter(h => {
        const holidayYear = new Date(h.date).getFullYear();
        return holidayYear === displayYear;
      });
    }
    
    // Générer les jours fériés pour l'année courante du calendrier
    const holidaysForYear = [
      { date: `${displayYear}-01-01`, name: 'Jour de l\'An' },
      { date: `${displayYear}-05-01`, name: 'Fête du Travail' },
      { date: `${displayYear}-05-08`, name: 'Victoire 1945' },
      { date: `${displayYear}-07-14`, name: 'Fête Nationale' },
      { date: `${displayYear}-08-15`, name: 'Assomption' },
      { date: `${displayYear}-11-01`, name: 'Toussaint' },
      { date: `${displayYear}-11-11`, name: 'Armistice' },
      { date: `${displayYear}-12-25`, name: 'Noël' }
    ];

    // Ajouter les fêtes mobiles (approximation simple)
    if (currentYear === 2025) {
      holidaysForYear.push(
        { date: '2025-04-21', name: 'Lundi de Pâques' },
        { date: '2025-05-29', name: 'Ascension' },
      );
    } else if (currentYear === 2026) {
      holidaysForYear.push(
        { date: '2026-04-06', name: 'Lundi de Pâques' },
        { date: '2026-05-14', name: 'Ascension' },
      );
    }

    return holidaysForYear;
  }, [holidays, currentYear]);

  // Calcul des suggestions intelligentes
  const smartSuggestions = useMemo(() => {
    const suggestions = [];
    const currentDate = new Date();
    const rttRemaining = 29 - leaves.filter(leave => 
      new Date(leave.startDate).getFullYear() === currentYear && leave.type === 'rtt'
    ).reduce((sum, leave) => sum + leave.workingDays, 0);

    // Analyser chaque mois pour des suggestions (pour l'année courante)
    const startMonth = currentYear === currentDate.getFullYear() ? currentDate.getMonth() : 0;
    for (let month = startMonth; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);
      const monthHolidays = holidaysArray.filter(h => {
        const holidayDate = new Date(h.date);
        return holidayDate.getMonth() === month && holidayDate.getFullYear() === currentYear;
      });

      if (monthHolidays.length > 0) {
        // Calculer les ponts possibles
        monthHolidays.forEach(holiday => {
          const holidayDate = new Date(holiday.date);
          const dayOfWeek = holidayDate.getDay();
          
          // Pont du vendredi (férié le lundi)
          if (dayOfWeek === 1) {
            const friday = new Date(holidayDate);
            friday.setDate(friday.getDate() - 3);
            suggestions.push({
              date: friday,
              type: 'bridge',
              reason: `Pont ${holiday.name}`,
              efficiency: 4, // 1 jour de congé = 4 jours de repos
              priority: 'high'
            });
          }
          
          // Pont du lundi (férié le vendredi)
          if (dayOfWeek === 5) {
            const monday = new Date(holidayDate);
            monday.setDate(monday.getDate() + 3);
            suggestions.push({
              date: monday,
              type: 'bridge',
              reason: `Pont ${holiday.name}`,
              efficiency: 4,
              priority: 'high'
            });
          }
        });
      }

      // Suggestions saisonnières
      if (month >= 6 && month <= 8) { // Été
        suggestions.push({
          date: new Date(currentYear, month, 15),
          type: 'seasonal',
          reason: 'Période estivale',
          efficiency: 1,
          priority: 'medium'
        });
      }

      // Urgence RTT (seulement pour l'année courante)
      if (currentYear === currentDate.getFullYear() && month <= 1 && rttRemaining > 0) { // Janvier/Février
        suggestions.push({
          date: new Date(currentYear, month, 1),
          type: 'urgent',
          reason: 'Deadline RTT fin février',
          efficiency: 1,
          priority: 'high'
        });
      }
    }

    return suggestions.sort((a, b) => b.priority.localeCompare(a.priority));
  }, [leaves, currentYear, holidaysArray]);

  // Génération du calendrier
  const calendarDays = useMemo(() => {
    const year = displayYear;
    const firstDay = new Date(year, currentMonth, 1);
    const lastDay = new Date(year, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Debug: afficher les congés chargés
    console.log('Congés chargés pour le calendrier:', leaves);
    console.log('Année courante:', currentYear);
    console.log('Mois courant:', currentMonth);
    console.log('Jours fériés:', holidaysArray);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === currentMonth;
      const isToday = date.toDateString() === today.toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      // Debug pour les week-ends
      if (isWeekend && isCurrentMonth) {
        console.log(`Week-end détecté: ${date.toDateString()}, jour: ${date.getDay()}`);
      }
      
      // Vérifier si c'est un jour férié
      const holiday = holidaysArray.find(h => 
        new Date(h.date).toDateString() === date.toDateString()
      );
      
      // Debug pour les jours fériés
      if (holiday && isCurrentMonth) {
        console.log(`Jour férié détecté: ${date.toDateString()}, ${holiday.name}`);
      }
      
      // Vérifier si c'est un jour de congé (seulement sur les jours ouvrés)
      const leave = leaves.find(l => {
        const startDate = new Date(l.startDate);
        const endDate = new Date(l.endDate);
        
        // Normaliser les dates pour comparaison (ignorer l'heure)
        const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        // Vérifier si la date est dans la période du congé
        const isInPeriod = currentDate >= normalizedStart && currentDate <= normalizedEnd;
        
        // Ne montrer le congé que sur les jours ouvrés (pas les week-ends ni jours fériés)
        // ET seulement si le congé appartient à l'année courante du calendrier
        if (isInPeriod && !isWeekend && !holiday && startDate.getFullYear() === currentYear) {
          return true;
        }
        
        return false;
      });

      // Suggestions pour ce jour
      const daySuggestions = smartSuggestions.filter(s => 
        s.date.toDateString() === date.toDateString()
      );

      days.push({
        date,
        isCurrentMonth,
        isToday,
        isWeekend,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        leave,
        suggestions: daySuggestions.map(s => s.reason)
      });
    }
    
    return days;
  }, [currentMonth, currentYear, leaves, holidaysArray, smartSuggestions]);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Calculer les jours pris pour le mois courant
  const currentMonthStats = useMemo(() => {
    const monthLeaves = leaves.filter(leave => {
      const leaveDate = new Date(leave.startDate);
      return leaveDate.getFullYear() === currentYear && leaveDate.getMonth() === currentMonth;
    });

    const rttDays = monthLeaves
      .filter(leave => leave.type === 'rtt')
      .reduce((sum, leave) => sum + leave.workingDays, 0);

    const cpDays = monthLeaves
      .filter(leave => leave.type === 'cp')
      .reduce((sum, leave) => sum + leave.workingDays, 0);

    return { rttDays, cpDays };
  }, [leaves, currentYear, currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        // Si on est en janvier, on passe à décembre de l'année précédente
        // Mais on reste dans l'année courante du calendrier pour l'instant
        return 11;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        // Si on est en décembre, on passe à janvier de l'année suivante
        // Mais on reste dans l'année courante du calendrier pour l'instant
        return 0;
      }
      return prev + 1;
    });
  };

  const setCurrentYear = (year: number) => {
    if (onYearChange) {
      onYearChange(year)
    }
  };

  // Gestion des congés
  const handleDayClick = (day: CalendarDay) => {
    if (day.leave) {
      // Modifier un congé existant
      setSelectedLeave(day.leave);
      setSelectedDate(null);
    } else {
      // Créer un nouveau congé
      setSelectedLeave(null);
      setSelectedDate(day.date);
    }
    setIsModalOpen(true);
  };

  const handleSaveLeave = (leave: any) => {
    if (selectedLeave) {
      // Modification
      onLeaveUpdate?.(leave);
    } else {
      // Création
      onLeaveAdd?.(leave);
    }
    setIsModalOpen(false);
    setSelectedLeave(null);
    setSelectedDate(null);
  };

  const handleDeleteLeave = (id: string) => {
    onLeaveDelete?.(id);
    setIsModalOpen(false);
    setSelectedLeave(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLeave(null);
    setSelectedDate(null);
  };

  const getLeaveColor = (leave: any) => {
    switch (leave.type) {
      case 'rtt': return 'bg-red-500 text-white';
      case 'cp': return 'bg-blue-800 text-white';
      case 'cet': return 'bg-blue-300 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSuggestionColor = (suggestion: string) => {
    if (suggestion.includes('Pont')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (suggestion.includes('Deadline')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (suggestion.includes('estivale')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Calendrier des Congés
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ajoutez, modifiez ou supprimez des jours de RTT, CP ou CET
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card-body p-6">
        {viewMode === 'calendar' ? (
          <>
            {/* Navigation du calendrier */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentYear(currentYear - 1)}
                    className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Année précédente"
                  >
                    ←
                  </button>
                  <span className="px-3 py-1 text-sm font-medium bg-blue-500 text-white rounded">{currentYear}</span>
                  <button
                    onClick={() => setCurrentYear(currentYear + 1)}
                    className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Année suivante"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>

            {/* Calendrier horizontal scrollable - 12 mois */}
            <div className="overflow-x-auto">
              <div className="flex space-x-6 min-w-max">
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const month = monthIndex
                  const year = currentYear
                  
                  // Calculer les congés pris ce mois (seulement sur les jours ouvrés)
                  const monthLeaves = leaves.filter(leave => {
                    const leaveStartDate = new Date(leave.startDate)
                    const leaveEndDate = new Date(leave.endDate)
                    
                    // Vérifier si le congé traverse ce mois
                    const monthStart = new Date(year, month, 1)
                    const monthEnd = new Date(year, month + 1, 0)
                    
                    if (leaveStartDate > monthEnd || leaveEndDate < monthStart) return false
                    
                    // Obtenir tous les jours fériés pour la période du congé (peut couvrir plusieurs années)
                    const allHolidays = []
                    const startYear = Math.min(leaveStartDate.getFullYear(), year)
                    const endYear = Math.max(leaveEndDate.getFullYear(), year)
                    
                    for (let y = startYear; y <= endYear; y++) {
                      allHolidays.push(...getHolidaysForYear(y))
                    }
                    
                    // Calculer les jours ouvrés de ce congé dans ce mois
                    let workingDaysInMonth = 0
                    const currentDate = new Date(Math.max(leaveStartDate, monthStart))
                    const endDate = new Date(Math.min(leaveEndDate, monthEnd))
                    
                    while (currentDate <= endDate) {
                      const dayOfWeek = currentDate.getDay()
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                      
                      const isHoliday = allHolidays.some(holiday => 
                        new Date(holiday.date).toDateString() === currentDate.toDateString()
                      )
                      
                      // Compter seulement les jours ouvrés
                      if (!isWeekend && !isHoliday) {
                        workingDaysInMonth++
                      }
                      
                      currentDate.setDate(currentDate.getDate() + 1)
                    }
                    
                    // Retourner le congé avec le nombre de jours ouvrés dans ce mois
                    return workingDaysInMonth > 0
                  }).map(leave => {
                    // Recalculer les jours ouvrés pour ce congé dans ce mois
                    const leaveStartDate = new Date(leave.startDate)
                    const leaveEndDate = new Date(leave.endDate)
                    const monthStart = new Date(year, month, 1)
                    const monthEnd = new Date(year, month + 1, 0)
                    
                    // Obtenir tous les jours fériés pour la période du congé
                    const allHolidays = []
                    const startYear = Math.min(leaveStartDate.getFullYear(), year)
                    const endYear = Math.max(leaveEndDate.getFullYear(), year)
                    
                    for (let y = startYear; y <= endYear; y++) {
                      allHolidays.push(...getHolidaysForYear(y))
                    }
                    
                    let workingDaysInMonth = 0
                    const currentDate = new Date(Math.max(leaveStartDate, monthStart))
                    const endDate = new Date(Math.min(leaveEndDate, monthEnd))
                    
                    while (currentDate <= endDate) {
                      const dayOfWeek = currentDate.getDay()
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                      
                      const isHoliday = allHolidays.some(holiday => 
                        new Date(holiday.date).toDateString() === currentDate.toDateString()
                      )
                      
                      if (!isWeekend && !isHoliday) {
                        workingDaysInMonth++
                      }
                      
                      currentDate.setDate(currentDate.getDate() + 1)
                    }
                    
                    return {
                      ...leave,
                      workingDaysInMonth
                    }
                  })

                  const rttTaken = monthLeaves
                    .filter(leave => leave.type === 'rtt')
                    .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)
                  
                  const cpTaken = monthLeaves
                    .filter(leave => leave.type === 'cp')
                    .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)
                  
                  const cetTaken = monthLeaves
                    .filter(leave => leave.type === 'cet')
                    .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)

                  // Calculer les cumuls depuis le début de l'année jusqu'à ce mois
                  let cumulativeRTT = 0
                  let cumulativeCP = 0
                  let cumulativeCET = 0

                  for (let m = 0; m <= month; m++) {
                    const monthLeavesCumul = leaves.filter(leave => {
                      const leaveStartDate = new Date(leave.startDate)
                      const leaveEndDate = new Date(leave.endDate)
                      
                      // Vérifier si le congé traverse ce mois
                      const monthStart = new Date(year, m, 1)
                      const monthEnd = new Date(year, m + 1, 0)
                      
                      if (leaveStartDate > monthEnd || leaveEndDate < monthStart) return false
                      
                      // Obtenir tous les jours fériés pour la période du congé
                      const allHolidays = []
                      const startYear = Math.min(leaveStartDate.getFullYear(), year)
                      const endYear = Math.max(leaveEndDate.getFullYear(), year)
                      
                      for (let y = startYear; y <= endYear; y++) {
                        allHolidays.push(...getHolidaysForYear(y))
                      }
                      
                      // Calculer les jours ouvrés de ce congé dans ce mois
                      let workingDaysInMonth = 0
                      const currentDate = new Date(Math.max(leaveStartDate, monthStart))
                      const endDate = new Date(Math.min(leaveEndDate, monthEnd))
                      
                      while (currentDate <= endDate) {
                        const dayOfWeek = currentDate.getDay()
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                        
                        const isHoliday = allHolidays.some(holiday => 
                          new Date(holiday.date).toDateString() === currentDate.toDateString()
                        )
                        
                        if (!isWeekend && !isHoliday) {
                          workingDaysInMonth++
                        }
                        
                        currentDate.setDate(currentDate.getDate() + 1)
                      }
                      
                      return workingDaysInMonth > 0
                    }).map(leave => {
                      // Recalculer les jours ouvrés pour ce congé dans ce mois
                      const leaveStartDate = new Date(leave.startDate)
                      const leaveEndDate = new Date(leave.endDate)
                      const monthStart = new Date(year, m, 1)
                      const monthEnd = new Date(year, m + 1, 0)
                      
                      // Obtenir tous les jours fériés pour la période du congé
                      const allHolidays = []
                      const startYear = Math.min(leaveStartDate.getFullYear(), year)
                      const endYear = Math.max(leaveEndDate.getFullYear(), year)
                      
                      for (let y = startYear; y <= endYear; y++) {
                        allHolidays.push(...getHolidaysForYear(y))
                      }
                      
                      let workingDaysInMonth = 0
                      const currentDate = new Date(Math.max(leaveStartDate, monthStart))
                      const endDate = new Date(Math.min(leaveEndDate, monthEnd))
                      
                      while (currentDate <= endDate) {
                        const dayOfWeek = currentDate.getDay()
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                        
                        const isHoliday = allHolidays.some(holiday => 
                          new Date(holiday.date).toDateString() === currentDate.toDateString()
                        )
                        
                        if (!isWeekend && !isHoliday) {
                          workingDaysInMonth++
                        }
                        
                        currentDate.setDate(currentDate.getDate() + 1)
                      }
                      
                      return {
                        ...leave,
                        workingDaysInMonth
                      }
                    })

                    cumulativeRTT += monthLeavesCumul
                      .filter(leave => leave.type === 'rtt')
                      .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)
                    
                    cumulativeCP += monthLeavesCumul
                      .filter(leave => leave.type === 'cp')
                      .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)
                    
                    cumulativeCET += monthLeavesCumul
                      .filter(leave => leave.type === 'cet')
                      .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)
                  }

                  // Reliquats de l'année précédente (2024)
                  const rttReliquat2024 = 7
                  const cpReliquat2024 = 43.5
                  const cetReliquat2024 = 5

                  // Quotas annuels 2025
                  const rttQuota2025 = 23
                  const cpQuota2025 = 27 // Ajouté au 31/05
                  const cetQuota2025 = 0 // Pas de quota CET en 2025

                  // Calculer les restants selon la période
                  let rttRemaining, cpRemaining, cetRemaining

                  // RTT : reliquat + quota dès janvier
                  rttRemaining = Math.max(0, rttReliquat2024 + rttQuota2025 - cumulativeRTT)

                  // CP : reliquat seulement jusqu'en mai, puis + quota au 31/05
                  if (month < 4) { // Janvier à Avril (0-3)
                    cpRemaining = Math.max(0, cpReliquat2024 - cumulativeCP)
                  } else { // Mai et après (4+)
                    cpRemaining = Math.max(0, cpReliquat2024 + cpQuota2025 - cumulativeCP)
                  }

                  // CET : reliquat seulement (pas de quota)
                  cetRemaining = Math.max(0, cetReliquat2024 + cetQuota2025 - cumulativeCET)

                  return (
                    <div key={month} className="flex-shrink-0 w-80">
                      {/* En-tête du mois */}
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {monthNames[month]} {year}
                        </h3>
                        
                        {/* Tableau des totaux du mois */}
                        <div className="mt-2">
                          <table className="w-full text-xs border-collapse border border-gray-200 dark:border-gray-700">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-left font-semibold text-gray-700 dark:text-gray-300"></th>
                                <th className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-white bg-red-500">RTT</th>
                                <th className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-white bg-blue-800">CP</th>
                                <th className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-white bg-blue-400">CET</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">Pris en {monthNames[month]}</td>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-red-700 dark:text-red-400">{rttTaken}</td>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-blue-800 dark:text-blue-400">{cpTaken}</td>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-blue-600 dark:text-blue-400">{cetTaken}</td>
                              </tr>
                              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">Pris Cumulé</td>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-red-700 dark:text-red-400">{cumulativeRTT}</td>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-blue-800 dark:text-blue-400">{cumulativeCP}</td>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-blue-600 dark:text-blue-400">{cumulativeCET}</td>
                              </tr>
                              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">Restant</td>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-green-700 dark:text-green-400">{rttRemaining}</td>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-green-700 dark:text-green-400">{cpRemaining.toFixed(1)}</td>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-green-700 dark:text-green-400">{cetRemaining}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Grille du mois */}
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 35 }, (_, dayIndex) => {
                          const firstDayOfMonth = new Date(year, month, 1)
                          const startDate = new Date(firstDayOfMonth)
                          startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())
                          const date = new Date(startDate)
                          date.setDate(startDate.getDate() + dayIndex)
                          const isCurrentMonth = date.getMonth() === month
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6
                          const isToday = date.toDateString() === new Date().toDateString()
                          
                          // Vérifier si c'est un jour férié
                          const holiday = holidaysArray.find(h => 
                            new Date(h.date).toDateString() === date.toDateString()
                          )
                          
                          // Vérifier si c'est un jour de congé (seulement sur les jours ouvrés)
                          const leave = leaves.find(l => {
                            const startDate = new Date(l.startDate)
                            const endDate = new Date(l.endDate)
                            const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                            const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                            const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
                            
                            // Ne pas afficher les congés sur les week-ends et jours fériés
                            if (isWeekend || holiday) return false
                            
                            return currentDate >= normalizedStart && currentDate <= normalizedEnd && isCurrentMonth
                          })

                          // Suggestions pour ce jour
                          const daySuggestions = smartSuggestions.filter(s => 
                            s.date.toDateString() === date.toDateString()
                          )

                          const handleDayClick = () => {
                            if (!isCurrentMonth) return
                            if (leave) {
                              // Ouvrir pop-up "Modifier Congés"
                              setSelectedLeave(leave)
                              setIsModalOpen(true)
                            } else {
                              // Ouvrir pop-up "Nouveau Congés"
                              setSelectedDate(date)
                              setIsModalOpen(true)
                            }
                          }

                          return (
                            <div
                              key={dayIndex}
                              onClick={handleDayClick}
                              className={`
                                min-h-[40px] p-1 border border-gray-200 dark:border-gray-700 rounded cursor-pointer
                                transition-all duration-200 hover:shadow-md hover:scale-105
                                ${isToday ? 'ring-2 ring-blue-500' : ''}
                                ${isWeekend ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}
                                ${holiday && !isWeekend ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''}
                                ${!isWeekend && !holiday ? (isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800') : ''}
                                ${leave ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'hover:bg-green-50 dark:hover:bg-green-900/20'}
                              `}
                            >
                              <div className="flex justify-between items-start">
                                <span className={`text-xs font-medium ${
                                  isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                                }`}>
                                  {date.getDate()}
                                </span>
                                {holiday && (
                                  <Gift className="h-2 w-2 text-yellow-600" />
                                )}
                              </div>
                              
                              {holiday && (
                                <div className="text-xs text-yellow-800 dark:text-yellow-200 font-medium truncate">
                                  {holiday.name}
                                </div>
                              )}
                              
                              {leave && (
                                <div className={`text-xs p-1 rounded ${getLeaveColor(leave)} flex items-center justify-between`}>
                                  <span className="truncate">{leave.type.toUpperCase()}</span>
                                  {leave.isForecast && (
                                    <span className="text-xs opacity-75">(P)</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Indicateur d'ajout pour les jours vides */}
                              {!leave && !holiday && isCurrentMonth && !isWeekend && (
                                <div className="flex items-center justify-center h-4">
                                  <Plus className="h-2 w-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              )}
                              
                              {daySuggestions && daySuggestions.length > 0 && (
                                <div className="space-y-1">
                                  {daySuggestions.slice(0, 1).map((suggestion, idx) => (
                                    <div key={idx} className={`text-xs p-1 rounded ${getSuggestionColor(suggestion.reason)}`}>
                                      {suggestion.reason}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          /* Vue Timeline améliorée */
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Opportunités de congés
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Les meilleures périodes pour optimiser vos congés
              </p>
            </div>

            {/* Légende */}
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">Ponts</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-gray-600 dark:text-gray-400">Urgent</span>
              </div>
              <div className="flex items-center space-x-1">
                <Sun className="h-3 w-3 text-yellow-500" />
                <span className="text-gray-600 dark:text-gray-400">Saisonnier</span>
              </div>
            </div>
            
            {/* Suggestions par catégorie */}
            <div className="space-y-4">
              {/* Ponts (priorité haute) */}
              {smartSuggestions.filter(s => s.type === 'bridge').length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                    🌉 Ponts à saisir
                  </h5>
                  <div className="space-y-2">
                    {smartSuggestions.filter(s => s.type === 'bridge').map((suggestion, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-purple-900 dark:text-purple-200">
                            {suggestion.reason}
                          </span>
                          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {suggestion.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                          🎯 1 jour de congé = {suggestion.efficiency} jours de repos
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Urgent (RTT) */}
              {smartSuggestions.filter(s => s.type === 'urgent').length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    ⚠️ Actions urgentes
                  </h5>
                  <div className="space-y-2">
                    {smartSuggestions.filter(s => s.type === 'urgent').map((suggestion, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-red-900 dark:text-red-200">
                            {suggestion.reason}
                          </span>
                          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {suggestion.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                          🚨 À planifier rapidement
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saisonnier */}
              {smartSuggestions.filter(s => s.type === 'seasonal').length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Sun className="h-4 w-4 mr-2 text-yellow-500" />
                    ☀️ Périodes recommandées
                  </h5>
                  <div className="space-y-2">
                    {smartSuggestions.filter(s => s.type === 'seasonal').map((suggestion, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-yellow-900 dark:text-yellow-200">
                            {suggestion.reason}
                          </span>
                          <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                            {suggestion.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          📅 Bonne période pour prendre des congés
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si aucune suggestion */}
              {smartSuggestions.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Aucune suggestion particulière pour le moment
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Consultez le calendrier pour voir les jours fériés
                  </p>
                </div>
              )}
            </div>
          </div>
        )}


      </div>

      {/* Modal de saisie */}
        <LeaveFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveLeave}
          onDelete={handleDeleteLeave}
          leave={selectedLeave}
          selectedDate={selectedDate}
          holidays={holidays}
        />
    </div>
  );
};

export default LeaveCalendar;

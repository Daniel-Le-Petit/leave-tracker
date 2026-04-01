'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Gift, Sun, AlertTriangle, TrendingUp, Plus, Edit3, Trash2 } from 'lucide-react';
import LeaveFormModal from './LeaveFormModal';
import { getHolidaysForYear, getWorkScheduleFromSettings, isOffDay, isWorkingDay } from '../utils/leaveUtils';
import { AppSettings } from '../types';
import WorkdayOverrideModal from './WorkdayOverrideModal';

interface LeaveCalendarProps {
  leaves: any[];
  currentYear: number;
  holidays: any[];
  settings?: AppSettings | null;
  onSettingsUpdate?: (settings: AppSettings) => void;
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
  settings,
  onSettingsUpdate,
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
  const [isWorkdayModalOpen, setIsWorkdayModalOpen] = useState(false);
  const [selectedWorkdayDate, setSelectedWorkdayDate] = useState<Date | null>(null);

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

  const workSchedule = useMemo(() => getWorkScheduleFromSettings(settings), [settings]);

  const setDateOverride = (date: Date, mode: 'off' | 'working' | 'clear') => {
    if (!settings || !onSettingsUpdate) return;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;

    const nextOverrides = { ...(workSchedule.dateOverrides || {}) };
    if (mode === 'clear') {
      delete nextOverrides[key];
    } else {
      nextOverrides[key] = mode;
    }

    onSettingsUpdate({
      ...settings,
      workSchedule: {
        ...workSchedule,
        dateOverrides: nextOverrides,
      }
    });
  };

  const openWorkdayModal = (date: Date) => {
    if (!settings || !onSettingsUpdate) return;
    setSelectedWorkdayDate(date);
    setIsWorkdayModalOpen(true);
  };

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
              reason: 'Pont',
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
              reason: 'Pont',
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

  // Fonction pour détecter si c'est une demi-journée
  const isHalfDay = (leave: any): boolean => {
    return leave.workingDays === 0.5 || leave.isHalfDay === true;
  };

  const getLeaveColor = (leave: any) => {
    const baseColor = (() => {
      switch (leave.type) {
        case 'rtt': return 'bg-red-500 text-white';
        case 'cp': return 'bg-blue-800 text-white';
        case 'cet': return 'bg-blue-300 text-white';
        default: return 'bg-gray-500 text-white';
      }
    })();
    
    // Si c'est une demi-journée, ajouter un style différent (bordure en pointillés, opacité réduite)
    if (isHalfDay(leave)) {
      return `${baseColor} border-2 border-dashed border-white/70 opacity-75`;
    }
    
    return baseColor;
  };

  // Fonction pour obtenir la hauteur du badge de congé (plus petit pour les demi-journées)
  const getLeaveHeight = (leave: any) => {
    if (isHalfDay(leave)) {
      return 'h-3'; // Plus petit pour les demi-journées
    }
    return 'h-4'; // Hauteur normale pour les journées complètes
  };

  const getSuggestionColor = (suggestion: string) => {
    if (suggestion.includes('Pont')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (suggestion.includes('Deadline')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (suggestion.includes('estivale')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  // Fonction pour récupérer les données de feuille de paie depuis localStorage
  const getPayrollDataForMonth = (month: number, year: number) => {
    try {
      const savedData = localStorage.getItem('payrollDataByMonth');
      if (savedData) {
        const payrollDataByMonth = JSON.parse(savedData);
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        return payrollDataByMonth[key] || null;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de feuille de paie:', error);
    }
    return null;
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
                    // Exclure les prévisions du tableau mensuel (la feuille de paie ne compte que le réel)
                    if (leave.isForecast) return false
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
                    const currentDate = new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime()))
                    const endDate = new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime()))
                    
                      while (currentDate <= endDate) {
                        const dayOfWeek = currentDate.getDay()
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                        
                        const isHoliday = allHolidays.some(holiday => 
                          new Date(holiday.date).toDateString() === currentDate.toDateString()
                        )
                        
                        // Debug pour le 1er janvier 2026
                        if (currentDate.toDateString() === 'Thu Jan 01 2026') {
                          console.log('Debug 1er janvier 2026:', {
                            date: currentDate.toDateString(),
                            dayOfWeek,
                            isWeekend,
                            isHoliday,
                            allHolidays: allHolidays.map(h => ({ date: h.date, name: h.name })),
                            matchingHoliday: allHolidays.find(h => 
                              new Date(h.date).toDateString() === currentDate.toDateString()
                            )
                          })
                        }
                        
                        // Compter seulement les jours ouvrés (inclut OFF schedule)
                        if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
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
                    
                    // Vérifier si c'est une demi-journée
                    const isHalfDayLeave = leave.workingDays === 0.5 || leave.isHalfDay === true
                    
                    // Si c'est une demi-journée et que le congé est dans un seul mois
                    if (isHalfDayLeave && leaveStartDate >= monthStart && leaveEndDate <= monthEnd) {
                      // Utiliser directement la valeur workingDays pour les demi-journées dans un seul mois
                      return {
                        ...leave,
                        workingDaysInMonth: leave.workingDays
                      }
                    }
                    
                    let workingDaysInMonth = 0
                    const currentDate = new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime()))
                    const endDate = new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime()))
                    
                    // Traiter tous les jours de la période (inclusif) - approche différente
                    const startTime = Math.max(leaveStartDate.getTime(), monthStart.getTime())
                    // Utiliser la fin de journée pour endTime (23:59:59.999)
                    const leaveEndTime = new Date(leaveEndDate.getFullYear(), leaveEndDate.getMonth(), leaveEndDate.getDate(), 23, 59, 59, 999).getTime()
                    const monthEndTime = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999).getTime()
                    const endTime = Math.min(leaveEndTime, monthEndTime)
                    
                    // Boucle jour par jour
                    for (let dayTime = startTime; dayTime <= endTime; dayTime += 24 * 60 * 60 * 1000) {
                      const currentDate = new Date(dayTime)
                      const dayOfWeek = currentDate.getDay()
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                      
                      const isHoliday = allHolidays.some(holiday => 
                        new Date(holiday.date).toDateString() === currentDate.toDateString()
                      )
                      
                      if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
                        // Si c'est une demi-journée et que c'est le premier ou dernier jour du congé dans ce mois
                        if (isHalfDayLeave) {
                          // Pour les demi-journées, compter 0.5 au lieu de 1
                          // Si c'est le premier jour du congé dans ce mois OU le dernier jour du congé dans ce mois
                          const isFirstDayInMonth = currentDate.toDateString() === new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime())).toDateString()
                          const isLastDayInMonth = currentDate.toDateString() === new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime())).toDateString()
                          
                          if (isFirstDayInMonth || isLastDayInMonth) {
                            workingDaysInMonth += 0.5
                          } else {
                            workingDaysInMonth++
                          }
                        } else {
                          workingDaysInMonth++
                        }
                      }
                    }
                    
                    return {
                      ...leave,
                      workingDaysInMonth
                    }
                  })

                  const rttTaken = monthLeaves
                    .filter(leave => leave.type === 'rtt')
                    .reduce((sum, leave) => {
                      // Debug pour décembre 2024 RTT
                      if (year === 2024 && month === 11 && leave.startDate.includes('2024-12-30')) {
                        console.log('Debug RTT 30-31 décembre 2024:', {
                          leaveId: leave.id,
                          startDate: leave.startDate,
                          endDate: leave.endDate,
                          workingDays: leave.workingDays,
                          workingDaysInMonth: leave.workingDaysInMonth,
                          type: leave.type
                        })
                      }
                      
                      // Debug pour janvier 2025 RTT
                      if (year === 2025 && month === 0) {
                        console.log('Debug RTT janvier 2025:', {
                          leaveId: leave.id,
                          startDate: leave.startDate,
                          endDate: leave.endDate,
                          workingDays: leave.workingDays,
                          workingDaysInMonth: leave.workingDaysInMonth,
                          type: leave.type
                        })
                      }
                      
                      return sum + leave.workingDaysInMonth
                    }, 0)
                  
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
                      if (leave.isForecast) return false
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
                      const currentDate = new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime()))
                      const endDate = new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime()))
                      
                      while (currentDate <= endDate) {
                        const dayOfWeek = currentDate.getDay()
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                        
                        const isHoliday = allHolidays.some(holiday => 
                          new Date(holiday.date).toDateString() === currentDate.toDateString()
                        )
                        
                        if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
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
                      
                      // Vérifier si c'est une demi-journée
                      const isHalfDayLeave = leave.workingDays === 0.5 || leave.isHalfDay === true
                      
                      // Si c'est une demi-journée et que le congé est dans un seul mois
                      if (isHalfDayLeave && leaveStartDate >= monthStart && leaveEndDate <= monthEnd) {
                        // Utiliser directement la valeur workingDays pour les demi-journées dans un seul mois
                        return {
                          ...leave,
                          workingDaysInMonth: leave.workingDays
                        }
                      }
                      
                      let workingDaysInMonth = 0
                      const startTime = Math.max(leaveStartDate.getTime(), monthStart.getTime())
                      // Utiliser la fin de journée pour endTime (23:59:59.999)
                      const leaveEndTime = new Date(leaveEndDate.getFullYear(), leaveEndDate.getMonth(), leaveEndDate.getDate(), 23, 59, 59, 999).getTime()
                      const monthEndTime = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999).getTime()
                      const endTime = Math.min(leaveEndTime, monthEndTime)
                      
                      // Boucle jour par jour
                      for (let dayTime = startTime; dayTime < endTime; dayTime += 24 * 60 * 60 * 1000) {
                        const currentDate = new Date(dayTime)
                        const dayOfWeek = currentDate.getDay()
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                        
                        const isHoliday = allHolidays.some(holiday => 
                          new Date(holiday.date).toDateString() === currentDate.toDateString()
                        )
                        
                        if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
                          // Si c'est une demi-journée et que c'est le premier ou dernier jour du congé dans ce mois
                          if (isHalfDayLeave) {
                            // Pour les demi-journées, compter 0.5 au lieu de 1
                            const isFirstDayInMonth = currentDate.toDateString() === new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime())).toDateString()
                            const isLastDayInMonth = currentDate.toDateString() === new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime())).toDateString()
                            
                            if (isFirstDayInMonth || isLastDayInMonth) {
                              workingDaysInMonth += 0.5
                            } else {
                              workingDaysInMonth++
                            }
                          } else {
                            workingDaysInMonth++
                          }
                        }
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

                  // Calculer les restants selon l'année
                  let rttRemaining, cpRemaining, cetRemaining

                  if (year === 2025) {
                    // Reliquats de l'année précédente (2024)
                    const rttReliquat2024 = 7
                    const cpReliquat2024 = 43.5
                    const cetReliquat2024 = 5

                    // Quotas annuels 2025
                    const rttQuota2025 = 23
                    const cpQuota2025 = 27 // Ajouté au 31/05
                    const cetQuota2025 = 0 // Pas de quota CET en 2025

                    // RTT : reliquat + quota dès janvier
                    rttRemaining = Math.max(0, rttReliquat2024 + rttQuota2025 - cumulativeRTT)

                    // CP : reliquat seulement jusqu'en avril, puis + quota au 31/05
                    if (month < 4) { // Janvier à Avril (0-3)
                      cpRemaining = Math.max(0, cpReliquat2024 - cumulativeCP)
                    } else { // Mai et après (4+)
                      cpRemaining = Math.max(0, cpReliquat2024 + cpQuota2025 - cumulativeCP)
                    }

                    // CET : reliquat seulement (pas de quota)
                    cetRemaining = Math.max(0, cetReliquat2024 + cetQuota2025 - cumulativeCET)
                  } else if (year === 2026) {
                    // 2026 (règles métier)
                    // - Reliquats fin déc. 2025 : CP=49,5 ; RTT=0,5 ; CET=0
                    // - RTT : 2/mois (janv.–nov.), 1 en déc. (24/12 exclu) => acquisition au fil de l'année
                    // - CP : +27 acquis au 31/05 (donc disponible à partir de juin)
                    const rttReliquat2025 = 0.5
                    const cpReliquat2025 = 49.5
                    const cetReliquat2025 = 0

                    const cpTakenBeforeMonth = cumulativeCP - cpTaken
                    const cetTakenBeforeMonth = cumulativeCET - cetTaken

                    // RTT : solde affiché = disponible en FIN de mois (reliquat + acquis jusqu'à fin du mois - pris cumulé)
                    const rttAcquiredByEndOfMonth = month < 11 ? 2 * (month + 1) : 23
                    const rttAvailableEndOfMonth = rttReliquat2025 + rttAcquiredByEndOfMonth

                    // CP/CET : solde affiché = disponible au DÉBUT du mois (cohérent avec l'affichage actuel)
                    const cpAcquiredBeforeMonth = month < 5 ? 0 : 27

                    const cpAvailableStartOfMonth = cpReliquat2025 + cpAcquiredBeforeMonth
                    const cetAvailableStartOfMonth = cetReliquat2025

                    rttRemaining = Math.max(0, rttAvailableEndOfMonth - cumulativeRTT)
                    cpRemaining = Math.max(0, cpAvailableStartOfMonth - cpTakenBeforeMonth)
                    cetRemaining = Math.max(0, cetAvailableStartOfMonth - cetTakenBeforeMonth)
                    
                    // Debug pour janvier 2026
                    if (month === 0 && year === 2026) {
                      console.log('Janvier 2026 Debug:', {
                        monthLeaves: monthLeaves.map(l => ({
                          id: l.id,
                          type: l.type,
                          startDate: l.startDate,
                          endDate: l.endDate,
                          workingDaysInMonth: l.workingDaysInMonth
                        })),
                        rttReliquat2025,
                        rttAcquiredByEndOfMonth,
                        rttRemaining,
                        cumulativeRTT,
                        cpReliquat2025,
                        cpRemaining,
                        cumulativeCP,
                        cetReliquat2025,
                        cumulativeCET,
                        cetRemaining
                      })
                    }
                  } else {
                    // Années futures (par défaut)
                    rttRemaining = Math.max(0, 23 - cumulativeRTT)
                    cpRemaining = Math.max(0, 27 - cumulativeCP)
                    cetRemaining = Math.max(0, 0 - cumulativeCET)
                  }

                  return (
                    <div key={month} className="flex-shrink-0 w-80">
                      {/* En-tête du mois */}
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {monthNames[month]} {year}
                        </h3>
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
                          
                          // Afficher uniquement les cases du mois en cours :
                          // on garde l'alignement de la grille (cases vides), mais on masque visuellement
                          // les jours hors mois (ni fond, ni bordure, ni click).
                          if (!isCurrentMonth) {
                            return <div key={dayIndex} className="min-h-[40px]" />
                          }

                          // Vérifier si c'est un jour férié
                          const holiday = holidaysArray.find(h => 
                            new Date(h.date).toDateString() === date.toDateString()
                          )

                          const effectiveFrom = new Date(workSchedule.effectiveFrom + 'T00:00:00')
                          const isAfterEffective = date >= effectiveFrom
                          const offDay = isAfterEffective && !isWeekend && !holiday && isOffDay(date, workSchedule)
                          const workingDay = isWorkingDay(date, holidaysArray, workSchedule)
                          
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
                            // Only allow overrides on weekdays that are not holidays
                            if (isWeekend || holiday) return
                            // If the day is OFF (by schedule or override), open planning modal instead of leave modal
                            if (!workingDay) {
                              openWorkdayModal(date)
                              return
                            }
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
                                ${
                                  offDay
                                    ? 'bg-blue-100 dark:bg-blue-900/30 cursor-not-allowed'
                                    : isWeekend
                                      ? 'bg-yellow-50 dark:bg-yellow-900/25 cursor-not-allowed'
                                      : holiday
                                        ? 'bg-yellow-100 dark:bg-yellow-900/20'
                                        : 'bg-white dark:bg-gray-900'
                                }
                                ${workingDay ? (leave ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'hover:bg-green-50 dark:hover:bg-green-900/20') : ''}
                              `}
                            >
                              <div className="flex justify-between items-start">
                                <span className={`text-xs font-medium ${
                                  'text-gray-900 dark:text-white'
                                }`}>
                                  {date.getDate()}
                    </span>
                                {holiday && (
                                  <Gift className="h-2 w-2 text-yellow-600" />
                    )}
                  </div>

                              {/* OFF indicator (no inline buttons) */}
                              {offDay && (
                                <div className="mt-1">
                                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-black/20 px-1.5 py-0.5 rounded">
                                    OFF
                                  </span>
                                </div>
                              )}
                  
                              {holiday && (
                                <div className="text-xs text-yellow-800 dark:text-yellow-200 font-medium truncate">
                                  {holiday.name}
                                </div>
                              )}
                              
                              {leave && (
                                <div className={`text-xs p-1 rounded ${getLeaveColor(leave)} ${getLeaveHeight(leave)} flex items-center justify-between`}>
                                  <span className="truncate flex items-center gap-1">
                                    {leave.type.toUpperCase()}
                                    {isHalfDay(leave) && (
                                      <span className="text-[10px] font-bold" title="Demi-journée">½</span>
                                    )}
                                  </span>
                                  {leave.isForecast && (
                        <span className="text-xs opacity-75">(P)</span>
                      )}
                    </div>
                  )}
                  
                  {/* Indicateur d'ajout pour les jours vides */}
                              {!leave && !holiday && isCurrentMonth && !isWeekend && workingDay && (
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

                      {/* Tableaux sous le calendrier */}
                      <div className="mt-4 space-y-3">
                        {/* Tableau des totaux du mois */}
                        {(() => {
                          // Calculer les valeurs du mois suivant pour validation
                          const nextMonth = month === 11 ? 0 : month + 1;
                          const nextYear = month === 11 ? year + 1 : year;
                          
                          // Récupérer les données de feuille de paie du mois suivant
                          const nextMonthPayrollData = getPayrollDataForMonth(nextMonth + 1, nextYear);
                          
                          // Calculer les valeurs du mois suivant pour validation
                          let nextMonthRttPris = 0;
                          let nextMonthCpPris = 0;
                          let nextMonthCetPris = 0;
                          let nextMonthCpSolde = 0;
                          let nextMonthCetSolde = 0;
                          
                          if (nextMonthPayrollData) {
                            nextMonthRttPris = nextMonthPayrollData.rttPrisDansMois || 0;
                            nextMonthCpPris = nextMonthPayrollData.cpPrisMoisPrecedent?.filter(date => date.trim() !== '').length || 0;
                            nextMonthCetPris = nextMonthPayrollData.cetPrisMoisPrecedent?.filter(date => date.trim() !== '').length || 0;
                            nextMonthCpSolde = nextMonthPayrollData.cpReliquat || 0;
                            nextMonthCetSolde = nextMonthPayrollData.soldeCet || 0;
                            
                            // Debug: Afficher les dates CP saisies pour ce mois
                            if (nextMonthPayrollData.cpPrisMoisPrecedent && nextMonthPayrollData.cpPrisMoisPrecedent.length > 0) {
                              console.log(`🔍 Debug CP ${monthNames[nextMonth]} ${nextYear}:`, nextMonthPayrollData.cpPrisMoisPrecedent);
                            }
                          }
                          
                          // Vérifier les correspondances pour les couleurs du tableau mensuel
                          const prisRttMatch = rttTaken === nextMonthRttPris;
                          const prisCpMatch = cpTaken === nextMonthCpPris;
                          const prisCetMatch = cetTaken === nextMonthCetPris;
                          const restantCpMatch = cpRemaining.toFixed(1) === nextMonthCpSolde.toFixed(1);
                          const restantCetMatch = cetRemaining === nextMonthCetSolde;
                          
                          return (
                            <table className="w-full text-xs border-collapse border border-gray-200 dark:border-gray-700">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                              <th className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-24"></th>
                              <th className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-white bg-red-500 w-12">RTT</th>
                              <th className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-white bg-blue-800 w-12">CP</th>
                              <th className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-white bg-blue-400 w-12">CET</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">Pris en {monthNames[month]}</td>
                              <td className={`border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold ${prisRttMatch ? 'text-white bg-green-500' : 'text-gray-900 dark:text-white bg-pink-200 dark:bg-pink-800'}`}>{rttTaken % 1 === 0 ? rttTaken : rttTaken.toFixed(1)}</td>
                              <td className={`border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold ${prisCpMatch ? 'text-white bg-green-500' : 'text-gray-900 dark:text-white bg-pink-200 dark:bg-pink-800'}`}>{cpTaken % 1 === 0 ? cpTaken : cpTaken.toFixed(1)}</td>
                              <td className={`border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold ${prisCetMatch ? 'text-white bg-green-500' : 'text-gray-900 dark:text-white bg-pink-200 dark:bg-pink-800'}`}>{cetTaken % 1 === 0 ? cetTaken : cetTaken.toFixed(1)}</td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">Restant</td>
                              <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-green-700 dark:text-green-400">{rttRemaining % 1 === 0 ? rttRemaining : rttRemaining.toFixed(1)}</td>
                              <td className={`border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold ${restantCpMatch ? 'text-white bg-green-500' : 'text-gray-900 dark:text-white bg-pink-200 dark:bg-pink-800'}`}>{cpRemaining.toFixed(1)}</td>
                              <td className={`border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold ${restantCetMatch ? 'text-white bg-green-500' : 'text-gray-900 dark:text-white bg-pink-200 dark:bg-pink-800'}`}>{cetRemaining % 1 === 0 ? cetRemaining : cetRemaining.toFixed(1)}</td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">Pris Cumulé</td>
                              <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-gray-900 dark:text-white">{cumulativeRTT % 1 === 0 ? cumulativeRTT : cumulativeRTT.toFixed(1)}</td>
                              <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-gray-900 dark:text-white">{cumulativeCP % 1 === 0 ? cumulativeCP : cumulativeCP.toFixed(1)}</td>
                              <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-gray-900 dark:text-white">{cumulativeCET % 1 === 0 ? cumulativeCET : cumulativeCET.toFixed(1)}</td>
                            </tr>
                          </tbody>
                        </table>
                          );
                        })()}

                        {/* Tableau de validation des données de feuille de paie */}
                        {(() => {
                          const payrollData = getPayrollDataForMonth(month + 1, year);
                          
                          // Vérifier s'il y a des données de feuille de paie
                          const hasPayrollData = (payrollData?.cpReliquat !== undefined) ||
                                               (payrollData?.rttPrisDansMois !== undefined) ||
                                               (payrollData?.soldeCet !== undefined) ||
                                               (payrollData?.cpPrisMoisPrecedent && payrollData.cpPrisMoisPrecedent.filter(date => date.trim() !== '').length > 0) ||
                                               (payrollData?.cetPrisMoisPrecedent && payrollData.cetPrisMoisPrecedent.filter(date => date.trim() !== '').length > 0);
                          
                          // Si pas de données, ne pas afficher le tableau du tout
                          if (!hasPayrollData) {
                            return null;
                          }
                          
                          return (
                            <div>
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {(() => {
                                  const prevMonth = month === 0 ? 11 : month - 1
                                  const prevYear = month === 0 ? year - 1 : year
                                  return `Validation Feuille de Paie de ${monthNames[prevMonth]} ${prevYear}`
                                })()}
                              </div>
                              <table className="w-full text-xs border-collapse border border-gray-200 dark:border-gray-700">
                            <tbody>
                              {(() => {
                                // Calculer les CP pris du mois précédent
                                const cpPrisCount = payrollData?.cpPrisMoisPrecedent?.filter(date => date.trim() !== '').length || 0;
                                // Calculer les CET pris du mois précédent  
                                const cetPrisCount = payrollData?.cetPrisMoisPrecedent?.filter(date => date.trim() !== '').length || 0;
                                
                                // Valeurs par défaut si pas de données
                                const rttSolde = payrollData?.rttPrisDansMois || 0; // RTT pris = solde pour le mois -1
                                const cpSolde = payrollData?.cpReliquat || 0;
                                const cetSolde = payrollData?.soldeCet || 0;
                                
                                const rttPris = payrollData?.rttPrisDansMois || 0;
                                const cpPris = cpPrisCount;
                                const cetPris = cetPrisCount;

                                // Mois de paie = mois précédent (cas janvier -> décembre année - 1)
                                const prevMonth = month === 0 ? 11 : month - 1;
                                const prevYear = month === 0 ? year - 1 : year;

                                // Récupérer les données du mois précédent
                                const prevMonthLeaves = leaves.filter(leave => {
                                  const leaveStartDate = new Date(leave.startDate)
                                  const leaveEndDate = new Date(leave.endDate)
                                  
                                  // Vérifier si le congé traverse le mois précédent
                                  const monthStart = new Date(prevYear, prevMonth, 1)
                                  const monthEnd = new Date(prevYear, prevMonth + 1, 0)
                                  
                                  if (leaveStartDate > monthEnd || leaveEndDate < monthStart) return false
                                  
                                  // Obtenir tous les jours fériés pour la période du congé
                                  const allHolidays = []
                                  const startYear = Math.min(leaveStartDate.getFullYear(), prevYear)
                                  const endYear = Math.max(leaveEndDate.getFullYear(), prevYear)
                                  
                                  for (let y = startYear; y <= endYear; y++) {
                                    allHolidays.push(...getHolidaysForYear(y))
                                  }
                                  
                                  // Calculer les jours ouvrés de ce congé dans le mois précédent
                                  let workingDaysInMonth = 0
                                  const currentDate = new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime()))
                                  const endDate = new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime()))
                                  
                                  while (currentDate <= endDate) {
                                    const dayOfWeek = currentDate.getDay()
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                    
                                    const isHoliday = allHolidays.some(holiday => 
                                      new Date(holiday.date).toDateString() === currentDate.toDateString()
                                    )
                                    
                                    if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
                                      workingDaysInMonth++
                                    }
                                    
                                    currentDate.setDate(currentDate.getDate() + 1)
                                  }
                                  
                                  return workingDaysInMonth > 0
                                }).map(leave => {
                                  // Recalculer les jours ouvrés pour ce congé dans le mois précédent
                                  const leaveStartDate = new Date(leave.startDate)
                                  const leaveEndDate = new Date(leave.endDate)
                                  const monthStart = new Date(prevYear, prevMonth, 1)
                                  const monthEnd = new Date(prevYear, prevMonth + 1, 0)
                                  
                                  // Obtenir tous les jours fériés pour la période du congé
                                  const allHolidays = []
                                  const startYear = Math.min(leaveStartDate.getFullYear(), prevYear)
                                  const endYear = Math.max(leaveEndDate.getFullYear(), prevYear)
                                  
                                  for (let y = startYear; y <= endYear; y++) {
                                    allHolidays.push(...getHolidaysForYear(y))
                                  }
                                  
                                  let workingDaysInMonth = 0
                                  const currentDate = new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime()))
                                  const endDate = new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime()))
                                  
                                  while (currentDate <= endDate) {
                                    const dayOfWeek = currentDate.getDay()
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                    
                                    const isHoliday = allHolidays.some(holiday => 
                                      new Date(holiday.date).toDateString() === currentDate.toDateString()
                                    )
                                    
                                    if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
                                      workingDaysInMonth++
                                    }
                                    
                                    currentDate.setDate(currentDate.getDate() + 1)
                                  }
                                  
                                  return {
                                    ...leave,
                                    workingDaysInMonth
                                  }
                                })

                                const prevRttTaken = prevMonthLeaves
                                  .filter(leave => leave.type === 'rtt')
                                  .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)
                                
                                const prevCpTaken = prevMonthLeaves
                                  .filter(leave => leave.type === 'cp')
                                  .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)
                                
                                const prevCetTaken = prevMonthLeaves
                                  .filter(leave => leave.type === 'cet')
                                  .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)

                                // Calculer les restants du mois précédent
                                let prevRttRemaining, prevCpRemaining, prevCetRemaining
                                
                                if (prevYear === 2025) {
                                  const rttReliquat2024 = 7
                                  const cpReliquat2024 = 43.5
                                  const cetReliquat2024 = 5
                                  const rttQuota2025 = 23
                                  const cpQuota2025 = 27
                                  const cetQuota2025 = 0

                                  // Calculer les cumuls jusqu'au mois précédent
                                  let cumulativeRTT = 0
                                  let cumulativeCP = 0
                                  let cumulativeCET = 0

                                  for (let m = 0; m <= prevMonth; m++) {
                                    const monthLeavesCumul = leaves.filter(leave => {
                                      const leaveStartDate = new Date(leave.startDate)
                                      const leaveEndDate = new Date(leave.endDate)
                                      
                                      const monthStart = new Date(prevYear, m, 1)
                                      const monthEnd = new Date(prevYear, m + 1, 0)
                                      
                                      if (leaveStartDate > monthEnd || leaveEndDate < monthStart) return false
                                      
                                      const allHolidays = []
                                      const startYear = Math.min(leaveStartDate.getFullYear(), prevYear)
                                      const endYear = Math.max(leaveEndDate.getFullYear(), prevYear)
                                      
                                      for (let y = startYear; y <= endYear; y++) {
                                        allHolidays.push(...getHolidaysForYear(y))
                                      }
                                      
                                      let workingDaysInMonth = 0
                                      const currentDate = new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime()))
                                      const endDate = new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime()))
                                      
                                      while (currentDate <= endDate) {
                                        const dayOfWeek = currentDate.getDay()
                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                        
                                        const isHoliday = allHolidays.some(holiday => 
                                          new Date(holiday.date).toDateString() === currentDate.toDateString()
                                        )
                                        
                                        if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
                                          workingDaysInMonth++
                                        }
                                        
                                        currentDate.setDate(currentDate.getDate() + 1)
                                      }
                                      
                                      return workingDaysInMonth > 0
                                    }).map(leave => {
                                      const leaveStartDate = new Date(leave.startDate)
                                      const leaveEndDate = new Date(leave.endDate)
                                      const monthStart = new Date(prevYear, m, 1)
                                      const monthEnd = new Date(prevYear, m + 1, 0)
                                      
                                      const allHolidays = []
                                      const startYear = Math.min(leaveStartDate.getFullYear(), prevYear)
                                      const endYear = Math.max(leaveEndDate.getFullYear(), prevYear)
                                      
                                      for (let y = startYear; y <= endYear; y++) {
                                        allHolidays.push(...getHolidaysForYear(y))
                                      }
                                      
                                      let workingDaysInMonth = 0
                                      const currentDate = new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime()))
                                      const endDate = new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime()))
                                      
                                      while (currentDate <= endDate) {
                                        const dayOfWeek = currentDate.getDay()
                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                        
                                        const isHoliday = allHolidays.some(holiday => 
                                          new Date(holiday.date).toDateString() === currentDate.toDateString()
                                        )
                                        
                                        if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
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

                                  prevRttRemaining = Math.max(0, rttReliquat2024 + rttQuota2025 - cumulativeRTT)
                                  if (prevMonth < 4) {
                                    prevCpRemaining = Math.max(0, cpReliquat2024 - cumulativeCP)
                                  } else {
                                    prevCpRemaining = Math.max(0, cpReliquat2024 + cpQuota2025 - cumulativeCP)
                                  }
                                  prevCetRemaining = Math.max(0, cetReliquat2024 + cetQuota2025 - cumulativeCET)
                                } else {
                                  // Pour les autres années, valeurs par défaut
                                  prevRttRemaining = 0
                                  prevCpRemaining = 0
                                  prevCetRemaining = 0
                                }

                                // Vérifier les correspondances pour le style vert
                                const rttPrisMatch = rttPris === prevRttTaken
                                const cpPrisMatch = cpPris === prevCpTaken
                                const cetPrisMatch = cetPris === prevCetTaken
                                
                                const cpSoldeMatch = cpSolde === prevCpRemaining
                                const cetSoldeMatch = cetSolde === prevCetRemaining

                                // Comparer avec les valeurs du mois suivant pour la validation
                                const nextMonth = month === 11 ? 0 : month + 1
                                const nextYear = month === 11 ? year + 1 : year
                                
                                // Récupérer les données du mois suivant pour validation
                                const nextMonthLeaves = leaves.filter(leave => {
                                  const leaveStartDate = new Date(leave.startDate)
                                  const leaveEndDate = new Date(leave.endDate)
                                  
                                  const monthStart = new Date(nextYear, nextMonth, 1)
                                  const monthEnd = new Date(nextYear, nextMonth + 1, 0)
                                  
                                  if (leaveStartDate > monthEnd || leaveEndDate < monthStart) return false
                                  
                                  const allHolidays = []
                                  const startYear = Math.min(leaveStartDate.getFullYear(), nextYear)
                                  const endYear = Math.max(leaveEndDate.getFullYear(), nextYear)
                                  
                                  for (let y = startYear; y <= endYear; y++) {
                                    allHolidays.push(...getHolidaysForYear(y))
                                  }
                                  
                                  let workingDaysInMonth = 0
                                  const startTime = Math.max(leaveStartDate.getTime(), monthStart.getTime())
                                  const leaveEndTime = new Date(leaveEndDate.getFullYear(), leaveEndDate.getMonth(), leaveEndDate.getDate(), 23, 59, 59, 999).getTime()
                                  const monthEndTime = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999).getTime()
                                  const endTime = Math.min(leaveEndTime, monthEndTime)
                                  
                                  for (let dayTime = startTime; dayTime < endTime; dayTime += 24 * 60 * 60 * 1000) {
                                    const currentDate = new Date(dayTime)
                                    const dayOfWeek = currentDate.getDay()
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                    
                                    const isHoliday = allHolidays.some(holiday => 
                                      new Date(holiday.date).toDateString() === currentDate.toDateString()
                                    )
                                    
                                    if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
                                      workingDaysInMonth++
                                    }
                                  }
                                  
                                  return workingDaysInMonth > 0
                                }).map(leave => {
                                  const leaveStartDate = new Date(leave.startDate)
                                  const leaveEndDate = new Date(leave.endDate)
                                  const monthStart = new Date(nextYear, nextMonth, 1)
                                  const monthEnd = new Date(nextYear, nextMonth + 1, 0)
                                  
                                  const allHolidays = []
                                  const startYear = Math.min(leaveStartDate.getFullYear(), nextYear)
                                  const endYear = Math.max(leaveEndDate.getFullYear(), nextYear)
                                  
                                  for (let y = startYear; y <= endYear; y++) {
                                    allHolidays.push(...getHolidaysForYear(y))
                                  }
                                  
                                  let workingDaysInMonth = 0
                                  const startTime = Math.max(leaveStartDate.getTime(), monthStart.getTime())
                                  const leaveEndTime = new Date(leaveEndDate.getFullYear(), leaveEndDate.getMonth(), leaveEndDate.getDate(), 23, 59, 59, 999).getTime()
                                  const monthEndTime = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999).getTime()
                                  const endTime = Math.min(leaveEndTime, monthEndTime)
                                  
                                  for (let dayTime = startTime; dayTime < endTime; dayTime += 24 * 60 * 60 * 1000) {
                                    const currentDate = new Date(dayTime)
                                    const dayOfWeek = currentDate.getDay()
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                    
                                    const isHoliday = allHolidays.some(holiday => 
                                      new Date(holiday.date).toDateString() === currentDate.toDateString()
                                    )
                                    
                                    if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
                                      workingDaysInMonth++
                                    }
                                  }
                                  
                                  return {
                                    ...leave,
                                    workingDaysInMonth
                                  }
                                })

                                const nextMonthRttTaken = nextMonthLeaves
                                  .filter(leave => leave.type === 'rtt')
                                  .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)
                                
                                const nextMonthCpTaken = nextMonthLeaves
                                  .filter(leave => leave.type === 'cp')
                                  .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)
                                
                                const nextMonthCetTaken = nextMonthLeaves
                                  .filter(leave => leave.type === 'cet')
                                  .reduce((sum, leave) => sum + leave.workingDaysInMonth, 0)

                                // Calculer les restants du mois suivant pour validation
                                let nextMonthRttRemaining, nextMonthCpRemaining, nextMonthCetRemaining
                                
                                if (nextYear === 2025) {
                                  const rttReliquat2024 = 7
                                  const cpReliquat2024 = 43.5
                                  const cetReliquat2024 = 5
                                  const rttQuota2025 = 23
                                  const cpQuota2025 = 27
                                  const cetQuota2025 = 0

                                  let cumulativeRTT = 0
                                  let cumulativeCP = 0
                                  let cumulativeCET = 0

                                  for (let m = 0; m <= nextMonth; m++) {
                                    const monthLeavesCumul = leaves.filter(leave => {
                                      const leaveStartDate = new Date(leave.startDate)
                                      const leaveEndDate = new Date(leave.endDate)
                                      
                                      const monthStart = new Date(nextYear, m, 1)
                                      const monthEnd = new Date(nextYear, m + 1, 0)
                                      
                                      if (leaveStartDate > monthEnd || leaveEndDate < monthStart) return false
                                      
                                      const allHolidays = []
                                      const startYear = Math.min(leaveStartDate.getFullYear(), nextYear)
                                      const endYear = Math.max(leaveEndDate.getFullYear(), nextYear)
                                      
                                      for (let y = startYear; y <= endYear; y++) {
                                        allHolidays.push(...getHolidaysForYear(y))
                                      }
                                      
                                      let workingDaysInMonth = 0
                                      const startTime = Math.max(leaveStartDate.getTime(), monthStart.getTime())
                                      const leaveEndTime = new Date(leaveEndDate.getFullYear(), leaveEndDate.getMonth(), leaveEndDate.getDate(), 23, 59, 59, 999).getTime()
                                      const monthEndTime = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999).getTime()
                                      const endTime = Math.min(leaveEndTime, monthEndTime)
                                      
                                      for (let dayTime = startTime; dayTime < endTime; dayTime += 24 * 60 * 60 * 1000) {
                                        const currentDate = new Date(dayTime)
                                        const dayOfWeek = currentDate.getDay()
                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                        
                                        const isHoliday = allHolidays.some(holiday => 
                                          new Date(holiday.date).toDateString() === currentDate.toDateString()
                                        )
                                        
                                        if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
                                          workingDaysInMonth++
                                        }
                                      }
                                      
                                      return workingDaysInMonth > 0
                                    }).map(leave => {
                                      const leaveStartDate = new Date(leave.startDate)
                                      const leaveEndDate = new Date(leave.endDate)
                                      const monthStart = new Date(nextYear, m, 1)
                                      const monthEnd = new Date(nextYear, m + 1, 0)
                                      
                                      const allHolidays = []
                                      const startYear = Math.min(leaveStartDate.getFullYear(), nextYear)
                                      const endYear = Math.max(leaveEndDate.getFullYear(), nextYear)
                                      
                                      for (let y = startYear; y <= endYear; y++) {
                                        allHolidays.push(...getHolidaysForYear(y))
                                      }
                                      
                                      let workingDaysInMonth = 0
                                      const startTime = Math.max(leaveStartDate.getTime(), monthStart.getTime())
                                      const leaveEndTime = new Date(leaveEndDate.getFullYear(), leaveEndDate.getMonth(), leaveEndDate.getDate(), 23, 59, 59, 999).getTime()
                                      const monthEndTime = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999).getTime()
                                      const endTime = Math.min(leaveEndTime, monthEndTime)
                                      
                                      for (let dayTime = startTime; dayTime < endTime; dayTime += 24 * 60 * 60 * 1000) {
                                        const currentDate = new Date(dayTime)
                                        const dayOfWeek = currentDate.getDay()
                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                        
                                        const isHoliday = allHolidays.some(holiday => 
                                          new Date(holiday.date).toDateString() === currentDate.toDateString()
                                        )
                                        
                                        if (isWorkingDay(currentDate, allHolidays as any, workSchedule)) {
                                          workingDaysInMonth++
                                        }
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

                                  nextMonthRttRemaining = Math.max(0, rttReliquat2024 + rttQuota2025 - cumulativeRTT)
                                  if (nextMonth < 4) {
                                    nextMonthCpRemaining = Math.max(0, cpReliquat2024 - cumulativeCP)
                                  } else {
                                    nextMonthCpRemaining = Math.max(0, cpReliquat2024 + cpQuota2025 - cumulativeCP)
                                  }
                                  nextMonthCetRemaining = Math.max(0, cetReliquat2024 + cetQuota2025 - cumulativeCET)
                                } else {
                                  nextMonthRttRemaining = 0
                                  nextMonthCpRemaining = 0
                                  nextMonthCetRemaining = 0
                                }

                                // Vérifier les correspondances pour les couleurs
                                const prisRttMatch = rttTaken === nextMonthRttTaken
                                const prisCpMatch = cpTaken === nextMonthCpTaken
                                const prisCetMatch = cetTaken === nextMonthCetTaken
                                
                                const soldeCpMatch = cpSolde === nextMonthCpRemaining
                                const soldeCetMatch = cetSolde === nextMonthCetRemaining
                                
                                return (
                                  <>
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                      <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                                        Pris
                                      </td>
                                      <td className={`border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold ${rttPrisMatch ? 'text-white bg-green-500' : 'text-gray-900 dark:text-white bg-pink-200 dark:bg-pink-800'}`}>
                                        {rttPris}
                                      </td>
                                      <td className={`border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold ${cpPrisMatch ? 'text-white bg-green-500' : 'text-gray-900 dark:text-white bg-pink-200 dark:bg-pink-800'}`}>
                                        {cpPris}
                                      </td>
                                      <td className={`border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold ${cetPrisMatch ? 'text-white bg-green-500' : 'text-gray-900 dark:text-white bg-pink-200 dark:bg-pink-800'}`}>
                                        {cetPris}
                                      </td>
                                    </tr>
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                      <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                                        Solde
                                      </td>
                                      <td className="border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700">
                                        -
                                      </td>
                                      <td className={`border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold ${cpSoldeMatch ? 'text-white bg-green-500' : 'text-gray-900 dark:text-white bg-pink-200 dark:bg-pink-800'}`}>
                                        {cpSolde}
                                      </td>
                                      <td className={`border border-gray-200 dark:border-gray-700 px-1 py-1 text-center font-semibold ${cetSoldeMatch ? 'text-white bg-green-500' : 'text-gray-900 dark:text-white bg-pink-200 dark:bg-pink-800'}`}>
                                        {cetSolde}
                                      </td>
                                    </tr>
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                            </div>
                          );
                        })()}
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
          workSchedule={workSchedule}
          onWorkdayOverrideChange={(mode, dateISO) => {
            const date = new Date(dateISO + 'T00:00:00')
            setDateOverride(date, mode)
          }}
        />

      <WorkdayOverrideModal
        isOpen={isWorkdayModalOpen}
        date={selectedWorkdayDate}
        isDefaultOff={(() => {
          if (!selectedWorkdayDate) return false
          const key = `${selectedWorkdayDate.getFullYear()}-${String(selectedWorkdayDate.getMonth() + 1).padStart(2, '0')}-${String(selectedWorkdayDate.getDate()).padStart(2, '0')}`
          const weekday = selectedWorkdayDate.getDay()
          return key >= workSchedule.effectiveFrom && workSchedule.defaultOffWeekdays.includes(weekday as any)
        })()}
        overrideValue={(() => {
          if (!selectedWorkdayDate) return null
          const key = `${selectedWorkdayDate.getFullYear()}-${String(selectedWorkdayDate.getMonth() + 1).padStart(2, '0')}-${String(selectedWorkdayDate.getDate()).padStart(2, '0')}`
          return (workSchedule.dateOverrides?.[key] as any) || null
        })()}
        onClose={() => {
          setIsWorkdayModalOpen(false)
          setSelectedWorkdayDate(null)
        }}
        onSave={(mode) => {
          if (!selectedWorkdayDate) return
          setDateOverride(selectedWorkdayDate, mode)
          setIsWorkdayModalOpen(false)
          setSelectedWorkdayDate(null)
        }}
      />
    </div>
  );
};

export default LeaveCalendar;

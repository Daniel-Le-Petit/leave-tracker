'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Mail, Send, Eye, X, Check, Calendar, Clock, Filter, Plus, Edit3 } from 'lucide-react';
import { LeaveEntry } from '../types';
import { format, subDays, startOfMonth, endOfMonth, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaves: LeaveEntry[];
  currentYear: number;
  onLeaveUpdate?: (leave: LeaveEntry) => void;
}

type TemplateType = 'recent' | 'current_month' | 'last_week' | 'urgent_rtt';

const EmailReportModal: React.FC<EmailReportModalProps> = ({
  isOpen,
  onClose,
  leaves,
  currentYear,
  onLeaveUpdate
}) => {
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<('rtt' | 'cp' | 'cet')[]>(['rtt', 'cp', 'cet']);
  const [dateFilter, setDateFilter] = useState<'all' | 'last_week' | 'last_month' | 'current_month'>('all');
  const [includeForecast, setIncludeForecast] = useState(true);
  const [includeReal, setIncludeReal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filtrer les congés selon les critères
  const filteredLeaves = useMemo(() => {
    let filtered = leaves.filter(leave => 
      new Date(leave.startDate).getFullYear() === currentYear &&
      (leave.type === 'rtt' || leave.type === 'cp' || leave.type === 'cet') &&
      selectedTypes.includes(leave.type as 'rtt' | 'cp' | 'cet')
    );

    // Appliquer le filtre de statut (réel/prévision)
    if (includeForecast && includeReal) {
      // Inclure tous les congés
    } else if (includeForecast && !includeReal) {
      filtered = filtered.filter(leave => leave.isForecast);
    } else if (!includeForecast && includeReal) {
      filtered = filtered.filter(leave => !leave.isForecast);
    } else {
      // Si aucune checkbox n'est cochée, ne rien afficher
      filtered = [];
    }

    // Appliquer le filtre de date
    const now = new Date();
    switch (dateFilter) {
      case 'last_week':
        const weekAgo = subDays(now, 7);
        filtered = filtered.filter(leave => new Date(leave.startDate) >= weekAgo);
        break;
      case 'last_month':
        const monthAgo = subDays(now, 30);
        filtered = filtered.filter(leave => new Date(leave.startDate) >= monthAgo);
        break;
      case 'current_month':
        filtered = filtered.filter(leave => {
          const leaveDate = new Date(leave.startDate);
          return leaveDate >= startOfMonth(now) && leaveDate <= endOfMonth(now);
        });
        break;
    }

    // Trier par date de modification (plus récent en premier)
    return filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [leaves, currentYear, selectedTypes, dateFilter, includeForecast, includeReal]);

  // Obtenir les congés sélectionnés
  const selectedLeaveEntries = useMemo(() => {
    return filteredLeaves.filter(leave => selectedLeaves.includes(leave.id));
  }, [filteredLeaves, selectedLeaves]);

  // Grouper les congés sélectionnés par date
  const leavesByDate = useMemo(() => {
    const grouped: { [key: string]: LeaveEntry[] } = {};
    
    selectedLeaveEntries.forEach(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      // Créer une entrée pour chaque jour du congé
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        // Ignorer les week-ends
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          const dateKey = format(date, 'yyyy-MM-dd');
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(leave);
        }
      }
    });

    // Trier par date
    return Object.keys(grouped)
      .sort()
      .reduce((result, date) => {
        result[date] = grouped[date];
        return result;
      }, {} as { [key: string]: LeaveEntry[] });
  }, [selectedLeaveEntries]);

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'rtt': return '🔄';
      case 'cp': return '🏖️';
      case 'cet': return '🏥';
      default: return '📅';
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'rtt': return 'RTT';
      case 'cp': return 'CP';
      case 'cet': return 'CET';
      default: return type.toUpperCase();
    }
  };

  // Fonction pour vérifier si une date est un jour férié
  const isHoliday = (date: Date) => {
    const year = date.getFullYear();
    const holidays = [
      `${year}-01-01`, // Jour de l'An
      `${year}-05-01`, // Fête du Travail
      `${year}-05-08`, // Victoire 1945
      `${year}-07-14`, // Fête Nationale
      `${year}-08-15`, // Assomption
      `${year}-11-01`, // Toussaint
      `${year}-11-11`, // Armistice
      `${year}-12-25`  // Noël
    ];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.includes(dateStr);
  };

  // Fonction pour vérifier si une date est un jour ouvré (pas weekend ni férié)
  const isWorkingDay = (date: Date) => {
    return !isWeekend(date) && !isHoliday(date);
  };

  // Fonctions de gestion des sélections
  const toggleLeaveSelection = (leaveId: string) => {
    setSelectedLeaves(prev => 
      prev.includes(leaveId) 
        ? prev.filter(id => id !== leaveId)
        : [...prev, leaveId]
    );
  };

  const toggleTypeFilter = (type: 'rtt' | 'cp' | 'cet') => {
    setSelectedTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Fonctions pour gérer les checkboxes de statut
  const handleForecastChange = (checked: boolean) => {
    setIncludeForecast(checked);
  };

  const handleRealChange = (checked: boolean) => {
    setIncludeReal(checked);
  };

  // Synchroniser les états pour éviter d'avoir les deux décochés
  useEffect(() => {
    if (!includeForecast && !includeReal) {
      setIncludeForecast(true); // Par défaut, cocher Prévision
    }
  }, [includeForecast, includeReal]);

  // Désélectionner les congés qui ne sont plus visibles après le changement de filtre
  useEffect(() => {
    const visibleLeaveIds = filteredLeaves.map(leave => leave.id);
    const filteredSelectedLeaves = selectedLeaves.filter(id => visibleLeaveIds.includes(id));
    if (filteredSelectedLeaves.length !== selectedLeaves.length) {
      setSelectedLeaves(filteredSelectedLeaves);
    }
  }, [filteredLeaves, selectedLeaves]);

  const selectAllVisible = () => {
    const visibleIds = filteredLeaves.map(leave => leave.id);
    setSelectedLeaves(visibleIds);
  };

  const clearSelection = () => {
    setSelectedLeaves([]);
  };

  // Templates prédéfinis
  const applyTemplate = (template: TemplateType) => {
    const now = new Date();
    let templateLeaves: LeaveEntry[] = [];

    switch (template) {
      case 'recent':
        setDateFilter('last_week');
        setSelectedTypes(['rtt', 'cp', 'cet']);
        setIncludeForecast(true);
        setIncludeReal(false);
        templateLeaves = filteredLeaves.slice(0, 5); // 5 plus récents
        break;
      case 'current_month':
        setDateFilter('current_month');
        setSelectedTypes(['rtt', 'cp', 'cet']);
        setIncludeForecast(true);
        setIncludeReal(false);
        templateLeaves = filteredLeaves;
        break;
      case 'last_week':
        setDateFilter('last_week');
        setSelectedTypes(['rtt', 'cp', 'cet']);
        setIncludeForecast(true);
        setIncludeReal(false);
        templateLeaves = filteredLeaves;
        break;
      case 'urgent_rtt':
        setDateFilter('all');
        setSelectedTypes(['rtt']);
        setIncludeForecast(true);
        setIncludeReal(false);
        // RTT du début d'année (urgent)
        templateLeaves = filteredLeaves.filter(leave => {
          const leaveDate = new Date(leave.startDate);
          return leaveDate.getMonth() <= 2; // Janvier, Février, Mars
        });
        break;
    }

    setSelectedLeaves(templateLeaves.map(leave => leave.id));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Créer le contenu de l'email
      const emailContent = generateEmailContent();
      
      // Simuler l'envoi d'email (à remplacer par une vraie implémentation)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Passer les congés en prévision à réel après l'envoi
      if (onLeaveUpdate) {
        selectedLeaveEntries.forEach(leave => {
          if (leave.isForecast) {
            const updatedLeave = { ...leave, isForecast: false };
            onLeaveUpdate(updatedLeave);
          }
        });
      }
      
      // Ici vous pourriez utiliser un service d'email comme EmailJS, SendGrid, etc.
      console.log('Email content:', emailContent);
      console.log('Congés en prévision passés en réel:', selectedLeaveEntries.filter(l => l.isForecast));
      
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setSelectedLeaves([]);
        setIncludeForecast(true);
        setIncludeReal(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      alert('Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateEmailContent = () => {
    let content = `Hi Carlo,\n\nPlease find my vacation report below:\n\n`;
    
    // Grouper par type de congé
    const leavesByType = selectedLeaveEntries.reduce((acc, leave) => {
      if (!acc[leave.type]) {
        acc[leave.type] = [];
      }
      acc[leave.type].push(leave);
      return acc;
    }, {} as Record<string, LeaveEntry[]>);

    // Trier les types : RTT, CP, CET
    const typeOrder = ['rtt', 'cp', 'cet'];
    
    typeOrder.forEach(type => {
      if (leavesByType[type] && leavesByType[type].length > 0) {
        const typeLabel = getLeaveTypeLabel(type);
        content += `${typeLabel}\n`;
        
        // Collecter toutes les dates pour ce type
        const allDates: string[] = [];
        
        leavesByType[type].forEach(leave => {
          const startDate = new Date(leave.startDate);
          const endDate = new Date(leave.endDate);
          
          // Si c'est une période d'un seul jour
          if (startDate.toDateString() === endDate.toDateString()) {
            if (isWorkingDay(startDate)) {
              const formattedDate = format(startDate, 'dd MMM yyyy', { locale: fr });
              allDates.push(formattedDate);
            }
          } else {
            // Si c'est une période multi-jours, afficher tous les jours ouvrés
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
              // Ignorer les week-ends et jours fériés
              if (isWorkingDay(currentDate)) {
                const formattedDate = format(currentDate, 'dd MMM yyyy', { locale: fr });
                allDates.push(formattedDate);
              }
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
        });
        
        // Trier les dates et les afficher
        const uniqueDates = Array.from(new Set(allDates)).sort((a, b) => {
          const dateA = new Date(a);
          const dateB = new Date(b);
          return dateA.getTime() - dateB.getTime();
        });
        
        uniqueDates.forEach(date => {
          content += `• ${date}\n`;
        });
        
        content += `\n`;
      }
    });
    
    content += `Regards,\nDaniel`;
    
    return content;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Rapport de Congés
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedLeaves.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              title={selectedLeaves.length === 0 ? "Sélectionnez des congés à envoyer" : "Envoyer le rapport par email"}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Envoyer le rapport</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Fermer la fenêtre"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Email envoyé avec succès !
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Le rapport a été envoyé à dlepetit.maa@gmail.com
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Panel de filtres */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-fit">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtres</h3>
                  
                  {/* Types de congés */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type de congés</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['rtt', 'cp', 'cet'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => toggleTypeFilter(type)}
                          className={`flex items-center px-3 py-2 rounded-full border transition-all ${
                            selectedTypes.includes(type)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span className="mr-2">{getLeaveTypeIcon(type)}</span>
                          <span className="text-sm">{getLeaveTypeLabel(type)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Statut du congé */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut du congé</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleForecastChange(!includeForecast)}
                        className={`flex items-center px-3 py-2 rounded-full border transition-all ${
                          includeForecast
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="mr-2">🔄</span>
                        <span className="text-sm">Prévision</span>
                      </button>
                      <button
                        onClick={() => handleRealChange(!includeReal)}
                        className={`flex items-center px-3 py-2 rounded-full border transition-all ${
                          includeReal
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="mr-2">🏖️</span>
                        <span className="text-sm">Réel</span>
                      </button>
                    </div>
                    {includeForecast && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                        Les congés en prévision seront passés en réel après l'envoi.
                      </div>
                    )}
                  </div>

                  {/* Période */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Période</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'last_week', label: 'Dernière semaine' },
                        { key: 'last_month', label: 'Dernier mois' },
                        { key: 'current_month', label: 'Mois en cours' },
                        { key: 'all', label: 'Toutes les dates' }
                      ].map(period => (
                        <button
                          key={period.key}
                          onClick={() => setDateFilter(period.key as any)}
                          className={`px-3 py-2 rounded-full border transition-all text-sm ${
                            dateFilter === period.key
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {period.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="mb-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAllVisible}
                        className="text-xs px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        title="Sélectionner tous les congés visibles"
                      >
                        Tout sélectionner
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-xs px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Effacer la sélection"
                      >
                        Effacer
                      </button>
                    </div>
                  </div>

                  {/* Liste des congés disponibles */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Congés disponibles</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {filteredLeaves.length} congé{filteredLeaves.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredLeaves.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                          Aucun congé trouvé avec les filtres sélectionnés
                        </div>
                      ) : (
                        filteredLeaves.map(leave => (
                          <div
                            key={leave.id}
                            className={`flex items-start p-3 border rounded-lg transition-colors cursor-pointer ${
                              selectedLeaves.includes(leave.id)
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                            onClick={() => toggleLeaveSelection(leave.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedLeaves.includes(leave.id)}
                              onChange={() => toggleLeaveSelection(leave.id)}
                              className="mt-1 mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              title={`Sélectionner le congé ${getLeaveTypeLabel(leave.type)} du ${format(new Date(leave.startDate), 'dd/MM/yyyy', { locale: fr })}`}
                            />
                            <div className="mr-3 text-lg">{getLeaveTypeIcon(leave.type)}</div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 dark:text-white">
                                {format(new Date(leave.startDate), 'dd MMM yyyy', { locale: fr })}
                                {leave.startDate !== leave.endDate && 
                                  ` - ${format(new Date(leave.endDate), 'dd MMM yyyy', { locale: fr })}`
                                }
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {leave.workingDays} jour{leave.workingDays > 1 ? 's' : ''} de {getLeaveTypeLabel(leave.type)}
                              </div>
                            </div>
                            <div className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                              {leave.isForecast ? 'En prévision' : 'Réel'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Vos congés sélectionnés */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Vos congés sélectionnés</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedLeaveEntries.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                          Aucun congé sélectionné
                        </div>
                      ) : (
                        selectedLeaveEntries.map(leave => (
                          <div
                            key={leave.id}
                            className="flex items-start p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          >
                            <div className="mr-3 text-lg">{getLeaveTypeIcon(leave.type)}</div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 dark:text-white">
                                {format(new Date(leave.startDate), 'dd MMM yyyy', { locale: fr })}
                                {leave.startDate !== leave.endDate && 
                                  ` - ${format(new Date(leave.endDate), 'dd MMM yyyy', { locale: fr })}`
                                }
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {leave.workingDays} jour{leave.workingDays > 1 ? 's' : ''} de {getLeaveTypeLabel(leave.type)}
                              </div>
                            </div>
                            <div className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                              {leave.isForecast ? 'En prévision' : 'Réel'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel de prévisualisation */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Résumé du rapport</h3>
                  
                  {/* Résumé des congés */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">RTT</div>
                      <div className="text-xl font-semibold text-red-600 dark:text-red-400">
                        {selectedLeaveEntries.filter(l => l.type === 'rtt').reduce((sum, l) => sum + l.workingDays, 0)} jours
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">CP</div>
                      <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                        {selectedLeaveEntries.filter(l => l.type === 'cp').reduce((sum, l) => sum + l.workingDays, 0)} jours
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">CET</div>
                      <div className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">
                        {selectedLeaveEntries.filter(l => l.type === 'cet').reduce((sum, l) => sum + l.workingDays, 0)} jours
                      </div>
                    </div>
                  </div>

                  {selectedLeaveEntries.some(leave => leave.isForecast) && (
                    <div className="mb-4 text-sm text-purple-600 dark:text-purple-400 italic">
                      Ces congés en prévision seront passés en réel.
                    </div>
                  )}

                  {/* Aperçu de l'email */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aperçu de l'email</h4>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-600">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          À: dlepetit.maa@gmail.com
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Objet: Rapport de congés {currentYear}
                        </div>
                      </div>
                      
                      <div className="text-sm leading-relaxed whitespace-pre-line text-gray-900 dark:text-white">
                        {generateEmailContent()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status indicator */}
        {!isSubmitted && (
          <div className="absolute bottom-4 left-4 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            {selectedLeaves.length > 0 ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span>{selectedLeaves.length} congé{selectedLeaves.length > 1 ? 's' : ''} sélectionné{selectedLeaves.length > 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Sélectionnez des congés pour l'email</span>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default EmailReportModal;

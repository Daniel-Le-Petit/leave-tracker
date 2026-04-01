import { addDays, format, isAfter, isBefore, isSameDay, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppSettings, CalendarDay, CarryoverLeave, LeaveBalance, LeaveEntry, LeaveType, PublicHoliday, Weekday, WorkSchedule } from '../types';

// Configuration des types de congés
export const LEAVE_TYPES = {
  cp: { label: 'Congés Payés', color: 'leave-cp', icon: '🏖️' },
  rtt: { label: 'RTT', color: 'leave-rtt', icon: '📅' },
  cet: { label: 'CET', color: 'leave-cet', icon: '🏥' },
  pipe: { label: 'PIPE', color: 'leave-pipe', icon: '🔧' },
  sick: { label: 'Maladie', color: 'leave-sick', icon: '🏥' },
} as const;

// Types de congés qui comptent dans les statistiques principales (exclut PIPE)
export const LEAVE_TYPES_FOR_STATS: LeaveType[] = ['cp', 'rtt', 'cet'];

// Types de congés qui comptent dans les quotas (exclut PIPE, prevision, reel)
export const LEAVE_TYPES_FOR_QUOTAS: LeaveType[] = ['cp', 'rtt', 'cet'];

/**
 * Vérifie si un type de congé doit être inclus dans les statistiques principales
 */
export function isLeaveTypeForStats(type: LeaveType): boolean {
  return LEAVE_TYPES_FOR_STATS.includes(type);
}

/**
 * Vérifie si un type de congé doit être inclus dans les quotas
 */
export function isLeaveTypeForQuotas(type: LeaveType): boolean {
  return LEAVE_TYPES_FOR_QUOTAS.includes(type);
}

// Jours fériés français 2024
export const FRENCH_HOLIDAYS_2024: PublicHoliday[] = [
  { id: '1', date: '2024-01-01', name: 'Jour de l\'an', year: 2024, country: 'FR' },
  { id: '2', date: '2024-05-01', name: 'Fête du travail', year: 2024, country: 'FR' },
  { id: '3', date: '2024-05-08', name: 'Victoire 1945', year: 2024, country: 'FR' },
  { id: '4', date: '2024-05-09', name: 'Ascension', year: 2024, country: 'FR' },
  { id: '5', date: '2024-07-14', name: 'Fête nationale', year: 2024, country: 'FR' },
  { id: '6', date: '2024-08-15', name: 'Assomption', year: 2024, country: 'FR' },
  { id: '7', date: '2024-11-01', name: 'Toussaint', year: 2024, country: 'FR' },
  { id: '8', date: '2024-11-11', name: 'Armistice', year: 2024, country: 'FR' },
  { id: '9', date: '2024-12-25', name: 'Noël', year: 2024, country: 'FR' },
];

// Jours fériés français 2025
export const FRENCH_HOLIDAYS_2025: PublicHoliday[] = [
  { id: '1', date: '2025-01-01', name: 'Jour de l\'an', year: 2025, country: 'FR' },
  { id: '2', date: '2025-05-01', name: 'Fête du travail', year: 2025, country: 'FR' },
  { id: '3', date: '2025-05-08', name: 'Victoire 1945', year: 2025, country: 'FR' },
  { id: '4', date: '2025-05-29', name: 'Ascension', year: 2025, country: 'FR' },
  { id: '5', date: '2025-07-14', name: 'Fête nationale', year: 2025, country: 'FR' },
  { id: '6', date: '2025-08-15', name: 'Assomption', year: 2025, country: 'FR' },
  { id: '7', date: '2025-11-01', name: 'Toussaint', year: 2025, country: 'FR' },
  { id: '8', date: '2025-11-11', name: 'Armistice', year: 2025, country: 'FR' },
  { id: '9', date: '2025-12-25', name: 'Noël', year: 2025, country: 'FR' },
];

// Jours fériés français 2026
export const FRENCH_HOLIDAYS_2026: PublicHoliday[] = [
  { id: '1', date: '2026-01-01', name: 'Jour de l\'an', year: 2026, country: 'FR' },
  { id: '2', date: '2026-05-01', name: 'Fête du travail', year: 2026, country: 'FR' },
  { id: '3', date: '2026-05-08', name: 'Victoire 1945', year: 2026, country: 'FR' },
  { id: '4', date: '2026-05-14', name: 'Ascension', year: 2026, country: 'FR' },
  { id: '5', date: '2026-07-14', name: 'Fête nationale', year: 2026, country: 'FR' },
  { id: '6', date: '2026-08-15', name: 'Assomption', year: 2026, country: 'FR' },
  { id: '7', date: '2026-11-01', name: 'Toussaint', year: 2026, country: 'FR' },
  { id: '8', date: '2026-11-11', name: 'Armistice', year: 2026, country: 'FR' },
  { id: '9', date: '2026-12-25', name: 'Noël', year: 2026, country: 'FR' },
];

/**
 * Calcule le nombre de jours ouvrés entre deux dates
 */
export function calculateWorkingDays(
  startDate: string, 
  endDate: string, 
  holidays: PublicHoliday[] = [],
  isHalfDay: boolean = false,
  halfDayType?: 'morning' | 'afternoon',
  workSchedule?: WorkSchedule
): number {
  // Parse dates safely using new Date() instead of parseISO
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error('Invalid date input:', { startDate, endDate });
    return 0;
  }
  
  let workingDays = 0;
  let currentDate = start;

  while (!isAfter(currentDate, end)) {
    if (isWorkingDay(currentDate, holidays, workSchedule)) {
      workingDays++;
    }
    currentDate = addDays(currentDate, 1);
  }

  // Si c'est un demi-jour, ajuster le calcul
  if (isHalfDay && workingDays > 0) {
    // Si c'est le même jour (début = fin), c'est 0.5 jour
    if (isSameDay(start, end)) {
      workingDays = 0.5;
    } else {
      // Pour les périodes de plusieurs jours avec demi-journée,
      // on soustrait 0.5 du total (le dernier jour compte pour 0.5 au lieu de 1)
      workingDays = Math.max(0.5, workingDays - 0.5);
    }
  }

  return workingDays;
}

function toISODateKeyLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DEFAULT_OFF_WEEKDAYS_RP: Weekday[] = [1, 2]; // Lundi, Mardi (retraite progressive)

function normalizeEffectiveFrom(value?: string): string {
  if (!value) return '2026-04-01';
  // Accept ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // Accept FR (DD/MM/YYYY)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  return '2026-04-01';
}

function dateKeyToMidnight(key: string): number {
  // key is expected YYYY-MM-DD
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getTime();
}

function normalizeSchedule(schedule?: WorkSchedule): WorkSchedule | undefined {
  if (!schedule) return undefined;
  const raw = (schedule.defaultOffWeekdays || []) as Weekday[];
  // Éviter "tous les jours OFF" ou tableau vide : par défaut RP = seulement Lundi et Mardi
  const defaultOffWeekdays =
    raw.length === 0 || raw.length === 7
      ? [...DEFAULT_OFF_WEEKDAYS_RP]
      : raw;
  return {
    effectiveFrom: normalizeEffectiveFrom(schedule.effectiveFrom),
    defaultOffWeekdays,
    dateOverrides: schedule.dateOverrides || {},
  };
}

export function getDefaultWorkSchedule(): WorkSchedule {
  return {
    effectiveFrom: '2026-04-01',
    defaultOffWeekdays: [...DEFAULT_OFF_WEEKDAYS_RP],
    dateOverrides: {},
  };
}

export function getWorkScheduleFromSettings(settings?: AppSettings | null): WorkSchedule {
  return normalizeSchedule(settings?.workSchedule) ?? getDefaultWorkSchedule();
}

export function isOffDay(date: Date, schedule?: WorkSchedule): boolean {
  const s = normalizeSchedule(schedule);
  if (!s) return false;

  const dateKey = toISODateKeyLocal(date);
  if (dateKeyToMidnight(dateKey) < dateKeyToMidnight(s.effectiveFrom)) return false;

  const override = s.dateOverrides?.[dateKey];
  if (override === 'off') return true;
  if (override === 'working') return false;

  const weekday = date.getDay() as Weekday;
  return s.defaultOffWeekdays.includes(weekday);
}

export function isWorkingDay(date: Date, holidays: PublicHoliday[] = [], schedule?: WorkSchedule): boolean {
  if (isWeekend(date)) return false;
  if (isHoliday(date, holidays)) return false;
  if (isOffDay(date, schedule)) return false;
  return true;
}

/**
 * Vérifie si une date est un jour férié
 */
export function isHoliday(date: Date, holidays: PublicHoliday[]): boolean {
  return holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    // Comparer les dates en format YYYY-MM-DD pour éviter les problèmes de timezone
    const dateStr = date.toISOString().split('T')[0];
    const holidayStr = holidayDate.toISOString().split('T')[0];
    return dateStr === holidayStr;
  });
}

/**
 * Obtient les jours fériés pour une année donnée
 */
export function getHolidaysForYear(year: number): PublicHoliday[] {
  if (year === 2024) return FRENCH_HOLIDAYS_2024;
  if (year === 2025) return FRENCH_HOLIDAYS_2025;
  if (year === 2026) return FRENCH_HOLIDAYS_2026;
  
  // Pour les autres années, on peut étendre ou utiliser une API
  return [];
}

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

/**
 * Calcule le nombre de jours ouvrés d'un congé dans un mois donné (pour une année).
 */
export function getWorkingDaysOfLeaveInMonth(
  leave: LeaveEntry,
  month: number,
  year: number,
  holidays: PublicHoliday[],
  workSchedule?: WorkSchedule
): number {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const leaveStart = new Date(leave.startDate);
  const leaveEnd = new Date(leave.endDate);
  const start = leaveStart > monthStart ? leaveStart : monthStart;
  const end = leaveEnd < monthEnd ? leaveEnd : monthEnd;
  if (start > end) return 0;

  const isHalfDay = leave.workingDays === 0.5 || leave.isHalfDay === true;
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    if (isWorkingDay(current, holidays, workSchedule)) {
      if (isHalfDay && (isSameDay(current, leaveStart) || isSameDay(current, leaveEnd))) count += 0.5;
      else count += 1;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export type MonthlyCPRTTRow = {
  month: number;
  monthName: string;
  rttPris: number;
  cpPris: number;
  cumulativeRTT: number;
  cumulativeCP: number;
  rttRemaining: number;
  cpRemaining: number;
};

/** Reliquats CP / RTT à fin décembre 2025 (entrée en 2026) — utilisés si aucune saisie reliquat année 2025 */
export const CP_RELIQUAT_FIN_DEC_2025 = 49.5;
export const RTT_RELIQUAT_FIN_DEC_2025 = 0.5;

export function sumCarryoverDaysForYear(
  carryovers: CarryoverLeave[],
  type: LeaveType,
  y: number
): number {
  return carryovers
    .filter((c) => c.type === type && Number(c.year) === y)
    .reduce((s, c) => s + (Number(c.days) || 0), 0);
}

/**
 * Récapitulatif CP / RTT par mois pour une année (reliquats et quotas selon l'année).
 */
export function getMonthlyCPRTTSummary(
  leaves: LeaveEntry[],
  year: number,
  workSchedule?: WorkSchedule
): MonthlyCPRTTRow[] {
  const holidays = getHolidaysForYear(year);
  const yearLeaves = leaves.filter(
    (l) => new Date(l.startDate).getFullYear() <= year && new Date(l.endDate).getFullYear() >= year
  );

  let rttReliquat: number;
  let cpReliquat: number;
  let rttQuota: number;
  let cpQuota: number;
  if (year === 2025) {
    rttReliquat = 7;
    cpReliquat = 43.5;
    rttQuota = 23;
    cpQuota = 27;
  } else if (year === 2026) {
    rttReliquat = 4;
    cpReliquat = 48.5;
    rttQuota = 23;
    cpQuota = 27;
  } else {
    rttReliquat = 0;
    cpReliquat = 0;
    rttQuota = 23;
    cpQuota = 27;
  }

  const rows: MonthlyCPRTTRow[] = [];
  let cumulativeRTT = 0;
  let cumulativeCP = 0;

  for (let month = 0; month < 12; month++) {
    let rttPris = 0;
    let cpPris = 0;
    for (const leave of yearLeaves) {
      const days = getWorkingDaysOfLeaveInMonth(leave, month, year, holidays, workSchedule);
      if (days <= 0) continue;
      if (leave.type === 'rtt') rttPris += days;
      if (leave.type === 'cp') cpPris += days;
    }
    cumulativeRTT += rttPris;
    cumulativeCP += cpPris;

    let rttRemaining: number;
    let cpRemaining: number;
    if (year === 2025) {
      rttRemaining = Math.max(0, 7 + 23 - cumulativeRTT);
      cpRemaining = month < 4 ? Math.max(0, 43.5 - cumulativeCP) : Math.max(0, 43.5 + 27 - cumulativeCP);
    } else if (year === 2026) {
      rttRemaining = Math.max(0, 4 + 23 - cumulativeRTT);
      cpRemaining = month < 4 ? Math.max(0, 48.5 - cumulativeCP) : Math.max(0, 48.5 + 27 - cumulativeCP);
    } else {
      rttRemaining = Math.max(0, rttReliquat + rttQuota - cumulativeRTT);
      cpRemaining = month < 4 ? Math.max(0, cpReliquat - cumulativeCP) : Math.max(0, cpReliquat + cpQuota - cumulativeCP);
    }

    rows.push({
      month,
      monthName: MONTH_NAMES[month],
      rttPris,
      cpPris,
      cumulativeRTT,
      cumulativeCP,
      rttRemaining,
      cpRemaining,
    });
  }
  return rows;
}

/**
 * Récap CP/RTT par mois aligné sur le calendrier : les jours sont répartis par mois
 * avec getWorkingDaysOfLeaveInMonth (un congé à cheval sur mars/avril compte en mars ET en avril).
 * Utilise quotas + reliquats passés en paramètre (settings.quotas + carryovers).
 */
export function getMonthlyCPRTTSummaryForCalendar(
  leaves: LeaveEntry[],
  year: number,
  workSchedule: WorkSchedule | undefined,
  quotas: { type: LeaveType; yearlyQuota: number }[],
  carryovers: CarryoverLeave[] = []
): MonthlyCPRTTRow[] {
  const holidays = getHolidaysForYear(year);
  const yearLeaves = leaves.filter(
    (l) => new Date(l.startDate).getFullYear() <= year && new Date(l.endDate).getFullYear() >= year
  );

  const rttQuota = quotas.find((q) => q.type === 'rtt')?.yearlyQuota ?? 23;
  const cpQuota = quotas.find((q) => q.type === 'cp')?.yearlyQuota ?? 27;
  const cetQuota = quotas.find((q) => q.type === 'cet')?.yearlyQuota ?? 0;
  const prevYear = year - 1;
  const isCarryoverForYear = (c: CarryoverLeave) =>
    Number(c.year) === prevYear || Number(c.year) === year;

  const rttCarryover = carryovers
    .filter((c) => c.type === 'rtt' && isCarryoverForYear(c))
    .reduce((s, c) => s + (Number(c.days) || 0), 0);
  const cpCarryover = carryovers
    .filter((c) => c.type === 'cp' && isCarryoverForYear(c))
    .reduce((s, c) => s + (Number(c.days) || 0), 0);
  const cetCarryover = carryovers
    .filter((c) => c.type === 'cet' && isCarryoverForYear(c))
    .reduce((s, c) => s + (Number(c.days) || 0), 0);

  // 2026 : reliquats CP/RTT à fin déc. 2025 = 49,5 CP et 0,5 RTT (sauf si reliquats saisis pour l'année 2025)
  let rttCarryoverEffective: number;
  let cpCarryoverEffective: number;
  let cetCarryoverEffective: number;
  if (year === 2026) {
    const rtt2025 = sumCarryoverDaysForYear(carryovers, 'rtt', 2025);
    const cp2025 = sumCarryoverDaysForYear(carryovers, 'cp', 2025);
    rttCarryoverEffective = rtt2025 > 0 ? rtt2025 : RTT_RELIQUAT_FIN_DEC_2025;
    cpCarryoverEffective = cp2025 > 0 ? cp2025 : CP_RELIQUAT_FIN_DEC_2025;
    cetCarryoverEffective =
      sumCarryoverDaysForYear(carryovers, 'cet', 2025) + sumCarryoverDaysForYear(carryovers, 'cet', 2026);
  } else {
    rttCarryoverEffective = rttCarryover;
    cpCarryoverEffective = cpCarryover;
    cetCarryoverEffective = cetCarryover;
  }

  // Règles 2026 : reliquats fin 2025 ; 2 RTT/mois (janv.–nov.), 1 RTT en déc. (24/12 exclu) = 23 RTT/an ; 27 CP au 31/05
  const is2026Rules = year === 2026;

  const rows: MonthlyCPRTTRow[] = [];
  let cumulativeRTT = 0;
  let cumulativeCP = 0;

  for (let month = 0; month < 12; month++) {
    let rttPris = 0;
    let cpPris = 0;
    for (const leave of yearLeaves) {
      const days = getWorkingDaysOfLeaveInMonth(leave, month, year, holidays, workSchedule);
      if (days <= 0) continue;
      if (leave.type === 'rtt') rttPris += days;
      if (leave.type === 'cp') cpPris += days;
      if (leave.type === 'cet') cpPris += days;
    }
    cumulativeRTT += rttPris;
    cumulativeCP += cpPris;

    let rttRemaining: number;
    let cpRemaining: number;
    if (is2026Rules) {
      // RTT : reliquat + 2 par mois (décembre = 1 seul, 24/12 non compté)
      const rttAcquiredByEndOfMonth = month < 11 ? 2 * (month + 1) : 23;
      const rttAvailableEndOfMonth = rttCarryoverEffective + rttAcquiredByEndOfMonth;
      rttRemaining = Math.max(0, rttAvailableEndOfMonth - cumulativeRTT);
      // CP : reliquat seul janvier–mai ; reliquat + 27 à partir du 31/05 (donc à partir de juin, month >= 5)
      const cpAvailableEndOfMonth =
        month < 5
          ? cpCarryoverEffective + cetCarryoverEffective
          : cpCarryoverEffective + cpQuota + cetCarryoverEffective + cetQuota;
      cpRemaining = Math.max(0, cpAvailableEndOfMonth - cumulativeCP);
    } else {
      const totalRTT = rttQuota + rttCarryoverEffective;
      const totalCPCET = cpQuota + cetQuota + cpCarryoverEffective + cetCarryoverEffective;
      rttRemaining = Math.max(0, totalRTT - cumulativeRTT);
      cpRemaining = Math.max(0, totalCPCET - cumulativeCP);
    }

    rows.push({
      month,
      monthName: MONTH_NAMES[month],
      rttPris,
      cpPris,
      cumulativeRTT,
      cumulativeCP,
      rttRemaining,
      cpRemaining,
    });
  }
  return rows;
}

/**
 * Calcule le solde de congés pour chaque type en incluant les reliquats
 */
export function calculateLeaveBalances(
  leaves: LeaveEntry[],
  quotas: { type: LeaveType; yearlyQuota: number }[],
  carryovers: CarryoverLeave[] = [],
  year: number = new Date().getFullYear()
): LeaveBalance[] {
  const balances: LeaveBalance[] = [];

  quotas.forEach(quota => {
    const yearLeaves = leaves.filter(leave => 
      leave.type === quota.type && 
      new Date(leave.startDate).getFullYear() === year
    );

    const used = yearLeaves.reduce((total, leave) => total + leave.workingDays, 0);
    
    // Calculer les reliquats pour ce type de congé (seulement de l'année précédente)
    const carryoverDays = carryovers
      .filter(carryover => carryover.type === quota.type && carryover.year === year - 1)
      .reduce((total, carryover) => total + carryover.days, 0);
    
    // Le total inclut le quota annuel + les reliquats
    const totalWithCarryover = quota.yearlyQuota + carryoverDays;
    const remaining = Math.max(0, totalWithCarryover - used);

    balances.push({
      type: quota.type,
      total: totalWithCarryover,
      taken: used,
      used: used, // Alias pour taken
      remaining,
      year
    });
  });

  return balances;
}

/**
 * Calcule les reliquats disponibles pour une année donnée
 */
export function calculateAvailableCarryover(
  carryovers: CarryoverLeave[],
  year: number = new Date().getFullYear()
): Record<LeaveType, number> {
  const available: Record<LeaveType, number> = {
    cp: 0, rtt: 0, cet: 0, pipe: 0, sick: 0
  };

  carryovers.forEach(carryover => {
    // Seuls les reliquats de l'année précédente sont disponibles pour l'année courante
    if (carryover.year === year - 1) {
      available[carryover.type] += carryover.days;
    }
  });

  return available;
}

/**
 * Génère un résumé des reliquats par année
 */
export function generateCarryoverSummary(carryovers: CarryoverLeave[]): {
  byYear: Record<number, CarryoverLeave[]>;
  byType: Record<LeaveType, CarryoverLeave[]>;
  totalByType: Record<LeaveType, number>;
} {
  const byYear: Record<number, CarryoverLeave[]> = {};
  const byType: Record<LeaveType, CarryoverLeave[]> = {
    cp: [], rtt: [], cet: [], pipe: [], sick: []
  };
  const totalByType: Record<LeaveType, number> = {
    cp: 0, rtt: 0, cet: 0, pipe: 0, sick: 0
  };

  carryovers.forEach(carryover => {
    // Par année
    if (!byYear[carryover.year]) {
      byYear[carryover.year] = [];
    }
    byYear[carryover.year].push(carryover);

    // Par type
    byType[carryover.type].push(carryover);
    totalByType[carryover.type] += carryover.days;
  });

  return { byYear, byType, totalByType };
}

/**
 * Valide si les RTT peuvent être pris pour un mois donné
 * Les RTT s'accumulent à la fin du mois, donc on ne peut les prendre
 * que si le mois correspondant est passé
 */
export function canTakeRTTForMonth(
  targetMonth: number, // 1-12
  targetYear: number,
  currentDate: Date = new Date()
): { canTake: boolean; reason?: string; availableDays: number } {
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();
  
  // Si on est dans une année future, on ne peut pas encore prendre les RTT
  if (targetYear > currentYear) {
    return {
      canTake: false,
      reason: `Les RTT de ${targetYear} ne sont pas encore disponibles`,
      availableDays: 0
    };
  }
  
  // Si on est dans une année passée, on peut prendre les RTT
  if (targetYear < currentYear) {
    return {
      canTake: true,
      availableDays: 2 // 2 RTT par mois
    };
  }
  
  // Même année : vérifier si le mois est passé
  if (targetMonth < currentMonth) {
    return {
      canTake: true,
      availableDays: 2
    };
  } else if (targetMonth === currentMonth) {
    // Pour le mois en cours, on peut prendre les RTT dès le début du mois
    return {
      canTake: true,
      availableDays: 2
    };
  } else {
    // Mois futur - possible en prévision
    return {
      canTake: true,
      availableDays: 2,
      reason: `RTT disponible en prévision pour ${targetYear}`
    };
  }
}

/**
 * Calcule le nombre total de RTT disponibles pour une période donnée
 */
export function calculateAvailableRTTForPeriod(
  startDate: Date,
  endDate: Date,
  currentDate: Date = new Date()
): { totalAvailable: number; details: Array<{ month: number; year: number; available: number; canTake: boolean }> } {
  const details: Array<{ month: number; year: number; available: number; canTake: boolean }> = [];
  let totalAvailable = 0;
  
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const month = current.getMonth() + 1;
    const year = current.getFullYear();
    
    const validation = canTakeRTTForMonth(month, year, currentDate);
    
    details.push({
      month,
      year,
      available: validation.availableDays,
      canTake: validation.canTake
    });
    
    // Pour les prévisions, on compte tous les mois (passés, présents et futurs)
    totalAvailable += validation.availableDays;
    
    // Passer au mois suivant
    current.setMonth(current.getMonth() + 1);
  }
  
  return { totalAvailable, details };
}

/**
 * Calcule le nombre total de RTT disponibles actuellement
 * (depuis le début de l'année jusqu'à maintenant)
 */
export function calculateCurrentAvailableRTT(
  currentDate: Date = new Date(),
  year: number = currentDate.getFullYear()
): { totalAvailable: number; details: Array<{ month: number; available: number; canTake: boolean; reason?: string }> } {
  const details: Array<{ month: number; available: number; canTake: boolean; reason?: string }> = [];
  let totalAvailable = 0;
  
  // Parcourir tous les mois de l'année (y compris les mois futurs en prévision)
  for (let month = 1; month <= 12; month++) {
    const validation = canTakeRTTForMonth(month, year, currentDate);
    
    details.push({
      month,
      available: validation.availableDays,
      canTake: validation.canTake,
      reason: validation.reason
    });
    
    // Pour les prévisions, on compte tous les mois (passés, présents et futurs)
    totalAvailable += validation.availableDays;
  }
  
  return { totalAvailable, details };
}

// Nouvelle fonction pour calculer les données séparées par type (réel vs prévision)
export function calculateMonthlyLeaveSummarySeparated(
  leaves: LeaveEntry[],
  quotas: { type: LeaveType; yearlyQuota: number }[],
  carryovers: CarryoverLeave[] = [],
  year: number = new Date().getFullYear()
): {
  months: Array<{
    month: number;
    monthName: string;
    rtt: {
      real: { taken: number; cumul: number; remaining: number };
      forecast: { taken: number; cumul: number; remaining: number };
    };
    cp: {
      real: { taken: number; cumul: number; remaining: number };
      forecast: { taken: number; cumul: number; remaining: number };
    };
  }>;
  yearlyTotals: {
    rtt: { real: number; forecast: number; total: number };
    cp: { real: number; forecast: number; total: number };
  };
} {
  const months = [];
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  // Récupérer les quotas
  const rttQuota = quotas.find(q => q.type === 'rtt')?.yearlyQuota || 23;
  const cpQuota = quotas.find(q => q.type === 'cp')?.yearlyQuota || 25;
  const cetQuota = quotas.find(q => q.type === 'cet')?.yearlyQuota || 5;
  const totalCPCETQuota = cpQuota + cetQuota;

  // Récupérer les reliquats
  const rttCarryover = carryovers.find(c => c.type === 'rtt')?.days || 0;
  const cpCarryover = carryovers.find(c => c.type === 'cp')?.days || 0;
  const cetCarryover = carryovers.find(c => c.type === 'cet')?.days || 0;
  const totalCPCETCarryover = cpCarryover + cetCarryover;

  // Ajouter la ligne des reliquats au début
  months.push({
    month: 0,
    monthName: 'Reliquats',
    rtt: {
      real: { taken: 0, cumul: 0, remaining: rttCarryover },
      forecast: { taken: 0, cumul: 0, remaining: rttCarryover }
    },
    cp: {
      real: { taken: 0, cumul: 0, remaining: totalCPCETCarryover },
      forecast: { taken: 0, cumul: 0, remaining: totalCPCETCarryover }
    }
  });

  let rttCumulReal = 0;
  let rttCumulForecast = 0;
  let cpCumulReal = 0;
  let cpCumulForecast = 0;

  for (let month = 1; month <= 12; month++) {
    // Filtrer les congés pour ce mois et cette année
    const monthLeaves = leaves.filter(leave => {
      const leaveDate = new Date(leave.startDate);
      return leaveDate.getFullYear() === year && leaveDate.getMonth() === month - 1;
    });

    // Séparer les congés réels et les prévisions
    // Si le mois est passé, les prévisions deviennent réelles
    const isMonthPassed = year < currentYear || (year === currentYear && month < currentMonth);
    const isCurrentMonth = year === currentYear && month === currentMonth;
    
    // Congés réels : tous les congés non marqués comme prévision OU les prévisions des mois passés
    const rttReal = monthLeaves
      .filter(leave => leave.type === 'rtt' && (!leave.isForecast || isMonthPassed))
      .reduce((sum, leave) => sum + leave.workingDays, 0);

    const cpReal = monthLeaves
      .filter(leave => (leave.type === 'cp' || leave.type === 'cet') && (!leave.isForecast || isMonthPassed))
      .reduce((sum, leave) => sum + leave.workingDays, 0);

    // Pour les prévisions, compter les congés marqués comme prévision des mois futurs
    // ET les congés non marqués comme prévision des mois futurs (pour simulation)
    const rttForecast = monthLeaves
      .filter(leave => leave.type === 'rtt' && (leave.isForecast || (!isMonthPassed && !isCurrentMonth)))
      .reduce((sum, leave) => sum + leave.workingDays, 0);

    const cpForecast = monthLeaves
      .filter(leave => (leave.type === 'cp' || leave.type === 'cet') && (leave.isForecast || (!isMonthPassed && !isCurrentMonth)))
      .reduce((sum, leave) => sum + leave.workingDays, 0);

    // Calculer les cumuls
    rttCumulReal += rttReal;
    rttCumulForecast += rttForecast;
    cpCumulReal += cpReal;
    cpCumulForecast += cpForecast;

    // Calculer les soldes restants (cumuls inversés)
    // Les reliquats sont déjà inclus dans les quotas totaux
    const rttRemainingReal = Math.max(0, rttQuota + rttCarryover - rttCumulReal);
    const rttRemainingForecast = Math.max(0, rttQuota + rttCarryover - rttCumulReal - rttCumulForecast);
    const cpRemainingReal = Math.max(0, totalCPCETQuota + totalCPCETCarryover - cpCumulReal);
    const cpRemainingForecast = Math.max(0, totalCPCETQuota + totalCPCETCarryover - cpCumulReal - cpCumulForecast);

    months.push({
      month,
      monthName: monthNames[month - 1],
      rtt: {
        real: { taken: rttReal, cumul: rttCumulReal, remaining: rttRemainingReal },
        forecast: { taken: rttForecast, cumul: rttCumulForecast, remaining: rttRemainingForecast }
      },
      cp: {
        real: { taken: cpReal, cumul: cpCumulReal, remaining: cpRemainingReal },
        forecast: { taken: cpForecast, cumul: cpCumulForecast, remaining: cpRemainingForecast }
      }
    });
  }

  return {
    months,
    yearlyTotals: {
      rtt: { real: rttCumulReal, forecast: rttCumulForecast, total: rttCumulReal + rttCumulForecast },
      cp: { real: cpCumulReal, forecast: cpCumulForecast, total: cpCumulReal + cpCumulForecast }
    }
  };
}

// Fonction utilitaire pour vérifier si deux congés correspondent à la même période
function isSamePeriod(forecast: LeaveEntry, real: LeaveEntry): boolean {
  // Si c'est un seul jour, vérifier la date exacte
  if (forecast.workingDays === 1 && real.workingDays === 1) {
    return forecast.startDate === real.startDate;
  }
  
  // Si c'est une période, vérifier si les dates se chevauchent
  const forecastStart = new Date(forecast.startDate);
  const forecastEnd = new Date(forecast.endDate);
  const realStart = new Date(real.startDate);
  const realEnd = new Date(real.endDate);
  
  // Vérifier si les périodes se chevauchent
  return forecastStart <= realEnd && realStart <= forecastEnd;
}


/**
 * Génère les données du calendrier pour un mois donné
 */
export function generateCalendarDays(
  year: number,
  month: number,
  leaves: LeaveEntry[],
  holidays: PublicHoliday[],
  workSchedule?: WorkSchedule
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  let currentDate = startDate;
  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const leave = leaves.find(l => {
      const leaveStart = new Date(l.startDate);
      const leaveEnd = new Date(l.endDate);
      return (
        isSameDay(currentDate, leaveStart) ||
        isSameDay(currentDate, leaveEnd) ||
        (isAfter(currentDate, leaveStart) && isBefore(currentDate, leaveEnd))
      );
    });

    const holiday = holidays.find(h => {
      const holidayDate = new Date(h.date);
      return isSameDay(currentDate, holidayDate);
    });

    days.push({
      date: currentDate,
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: isSameDay(currentDate, new Date()),
      isWeekend: isWeekend(currentDate),
      isHoliday: !!holiday,
      leaves: leave ? [leave] : [],
    });

    currentDate = addDays(currentDate, 1);
  }

  return days;
}

/**
 * Formate une date pour l'affichage
 */
export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Validate the date
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date for formatting:', date);
    return 'Date invalide';
  }
  
  return format(dateObj, formatStr, { locale: fr });
}

/**
 * Formate le nombre de jours ouvrés pour l'affichage (gère les demi-journées)
 * Exemples: 0.5 -> "1/2 journée", 1.5 -> "1 jour et demi", 2 -> "2 jours"
 * @param days - Nombre de jours
 * @param locale - Locale pour la traduction ('fr' ou 'en'), par défaut 'fr'
 */
export function formatWorkingDays(days: number, locale: 'fr' | 'en' = 'fr'): string {
  if (days === 0) return locale === 'en' ? '0 day' : '0 jour';
  
  // Vérifier si c'est un nombre décimal
  const isDecimal = days % 1 !== 0;
  
  if (!isDecimal) {
    // Nombre entier
    if (locale === 'en') {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${days} jour${days > 1 ? 's' : ''}`;
  }
  
  // Nombre décimal
  const wholePart = Math.floor(days);
  
  if (wholePart === 0) {
    // Seulement une demi-journée
    return locale === 'en' ? '1/2 day' : '1/2 journée';
  } else {
    // Jours entiers + demi-journée
    if (locale === 'en') {
      return `${wholePart} day${wholePart > 1 ? 's' : ''} and a half`;
    }
    return `${wholePart} jour${wholePart > 1 ? 's' : ''} et demi`;
  }
}

/**
 * Obtient le nom du type de congé
 */
export function getLeaveTypeLabel(type: LeaveType): string {
  return LEAVE_TYPES[type].label;
}

/**
 * Obtient la couleur du type de congé
 */
export function getLeaveTypeColor(type: LeaveType): string {
  return LEAVE_TYPES[type].color;
}

/**
 * Obtient l'icône du type de congé
 */
export function getLeaveTypeIcon(type: LeaveType): string {
  return LEAVE_TYPES[type].icon;
}

/**
 * Valide une période de congés
 */
export function validateLeavePeriod(
  startDate: string,
  endDate: string,
  existingLeaves: LeaveEntry[],
  excludeId?: string
): { isValid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isAfter(start, end)) {
    return { isValid: false, error: 'La date de début doit être antérieure à la date de fin' };
  }

  // Vérifier les chevauchements avec les congés existants
  const overlapping = existingLeaves
    .filter(leave => leave.id !== excludeId)
    .some(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      
      return (
        (isAfter(start, leaveStart) && isBefore(start, leaveEnd)) ||
        (isAfter(end, leaveStart) && isBefore(end, leaveEnd)) ||
        (isBefore(start, leaveStart) && isAfter(end, leaveEnd)) ||
        isSameDay(start, leaveStart) ||
        isSameDay(end, leaveEnd)
      );
    });

  if (overlapping) {
    return { isValid: false, error: 'Cette période chevauche un congé existant' };
  }

  return { isValid: true };
}

/**
 * Calcule les statistiques des congés
 */
export function calculateLeaveStats(leaves: LeaveEntry[], year: number): {
  totalDays: number;
  byType: Record<LeaveType, number>;
  byMonth: Record<string, number>;
} {
  const yearLeaves = leaves.filter(leave => 
    new Date(leave.startDate).getFullYear() === year
  );

  // Calculer le total des jours en excluant PIPE
  const totalDays = yearLeaves
    .filter(leave => isLeaveTypeForStats(leave.type))
    .reduce((total, leave) => total + leave.workingDays, 0);
  
  const byType: Record<LeaveType, number> = {
    cp: 0, rtt: 0, cet: 0, pipe: 0, sick: 0
  };
  
  const byMonth: Record<string, number> = {};

  yearLeaves.forEach(leave => {
    byType[leave.type] += leave.workingDays;
    
    // Inclure dans les statistiques mensuelles seulement si c'est un type de congé valide
    if (isLeaveTypeForStats(leave.type)) {
      const leaveStart = new Date(leave.startDate);
      const month = format(leaveStart, 'yyyy-MM');
      byMonth[month] = (byMonth[month] || 0) + leave.workingDays;
    }
  });

  return { totalDays, byType, byMonth };
}

/**
 * Convertit une date du format français (DD/MM/YYYY) vers le format ISO (YYYY-MM-DD)
 */
export function frenchDateToISO(frenchDate: string): string {
  if (!frenchDate || frenchDate.length !== 10) return ''
  
  const parts = frenchDate.split('/')
  if (parts.length !== 3) return ''
  
  const [day, month, year] = parts
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/**
 * Convertit une date du format ISO (YYYY-MM-DD) vers le format français (DD/MM/YYYY)
 */
export function isoDateToFrench(isoDate: string): string {
  if (!isoDate || isoDate.length !== 10) return ''
  
  const parts = isoDate.split('-')
  if (parts.length !== 3) return ''
  
  const [year, month, day] = parts
  return `${day}/${month}/${year}`
}

/**
 * Valide une date au format français (DD/MM/YYYY)
 */
export function isValidFrenchDate(frenchDate: string): boolean {
  if (!frenchDate || frenchDate.length !== 10) return false
  
  const parts = frenchDate.split('/')
  if (parts.length !== 3) return false
  
  const [day, month, year] = parts
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const date = new Date(isoDate)
  
  return !isNaN(date.getTime()) && 
         date.getFullYear() >= 2020 && 
         date.getFullYear() <= 2030
}

/**
 * Calcule les données pour les cartes du dashboard
 */
export function calculateDashboardCards(
  leaves: LeaveEntry[],
  quotas: { type: LeaveType; yearlyQuota: number }[],
  carryovers: CarryoverLeave[] = [],
  year: number = new Date().getFullYear(),
  workSchedule?: WorkSchedule
): {
  allTypes: {
    quotaInitial: number;
    pris: number;
    restantPlanifie: number;
    restantNonPlanifie: number;
    restantDisponible: number;
  };
  rtt: {
    quotaInitial: number;
    pris: number;
    restantPlanifie: number;
    restantNonPlanifie: number;
    restantDisponible: number;
  };
  cp: {
    quotaInitial: number;
    pris: number;
    restantPlanifie: number;
    restantNonPlanifie: number;
    restantDisponible: number;
  };
  cet: {
    quotaInitial: number;
    pris: number;
    restantPlanifie: number;
    restantNonPlanifie: number;
    restantDisponible: number;
  };
} {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const holidays = getHolidaysForYear(year);
  const monthIndexForTotals = year === currentYear ? currentDate.getMonth() : 11;
  
  // Récupérer les quotas
  const rttQuota = quotas.find(q => q.type === 'rtt')?.yearlyQuota || 23;
  const cpQuota = quotas.find(q => q.type === 'cp')?.yearlyQuota || 25;
  const cetQuota = quotas.find(q => q.type === 'cet')?.yearlyQuota || 5;
  
  // Reliquats (année N-1 ou N) ; pour 2026 : CP/RTT fin déc. 2025 = 49,5 / 0,5 si pas de saisie année 2025
  const prevYear = year - 1;
  const isCarryoverForYear = (c: CarryoverLeave) =>
    Number(c.year) === prevYear || Number(c.year) === year;
  const rttCarryover = carryovers
    .filter((c) => c.type === 'rtt' && isCarryoverForYear(c))
    .reduce((s, c) => s + (Number(c.days) || 0), 0);
  const cpCarryover = carryovers
    .filter((c) => c.type === 'cp' && isCarryoverForYear(c))
    .reduce((s, c) => s + (Number(c.days) || 0), 0);
  const cetCarryover = carryovers
    .filter((c) => c.type === 'cet' && isCarryoverForYear(c))
    .reduce((s, c) => s + (Number(c.days) || 0), 0);

  let rttCarryoverEff = rttCarryover;
  let cpCarryoverEff = cpCarryover;
  let cetCarryoverEff = cetCarryover;
  if (year === 2026) {
    const rtt2025 = sumCarryoverDaysForYear(carryovers, 'rtt', 2025);
    const cp2025 = sumCarryoverDaysForYear(carryovers, 'cp', 2025);
    rttCarryoverEff = rtt2025 > 0 ? rtt2025 : RTT_RELIQUAT_FIN_DEC_2025;
    cpCarryoverEff = cp2025 > 0 ? cp2025 : CP_RELIQUAT_FIN_DEC_2025;
    cetCarryoverEff =
      sumCarryoverDaysForYear(carryovers, 'cet', 2025) + sumCarryoverDaysForYear(carryovers, 'cet', 2026);
  }
  
  // Filtrer les congés qui touchent l'année (un congé à cheval compte sur l'année)
  const yearLeaves = leaves.filter(
    (l) => new Date(l.startDate).getFullYear() <= year && new Date(l.endDate).getFullYear() >= year
  );

  const sumTypeDaysInYear = (type: LeaveType, isForecast: boolean) => {
    let total = 0;
    for (let m = 0; m < 12; m++) {
      for (const leave of yearLeaves) {
        if (leave.type !== type) continue;
        if ((leave.isForecast || false) !== isForecast) continue;
        total += getWorkingDaysOfLeaveInMonth(leave, m, year, holidays, workSchedule);
      }
    }
    return total;
  };

  const sumAllTypesDaysInYear = (isForecast: boolean) => {
    let total = 0;
    for (let m = 0; m < 12; m++) {
      for (const leave of yearLeaves) {
        if (!isLeaveTypeForQuotas(leave.type)) continue;
        if ((leave.isForecast || false) !== isForecast) continue;
        total += getWorkingDaysOfLeaveInMonth(leave, m, year, holidays, workSchedule);
      }
    }
    return total;
  };

  // "Pris" = réel (non prévision) sur l'année, réparti par mois comme le calendrier
  const rttPrisYear = sumTypeDaysInYear('rtt', false);
  const cpPrisYear = sumTypeDaysInYear('cp', false);
  const cetPrisYear = sumTypeDaysInYear('cet', false);
  const allTypesPrisYear = sumAllTypesDaysInYear(false);

  // "Planifié" = prévision (forecast) sur l'année, réparti par mois comme le calendrier
  const rttPlanifieYear = sumTypeDaysInYear('rtt', true);
  const cpPlanifieYear = sumTypeDaysInYear('cp', true);
  const cetPlanifieYear = sumTypeDaysInYear('cet', true);
  const allTypesPlanifieYear = sumAllTypesDaysInYear(true);

  // Règles d'acquisition 2026
  const is2026Rules = year === 2026;
  const rttAcquiredByEndOfMonth = (m: number) => (m < 11 ? 2 * (m + 1) : 23);
  const cpAcquiredByEndOfMonth = (m: number) => (m < 5 ? 0 : cpQuota);

  const rttAvailableNow = is2026Rules
    ? rttCarryoverEff + rttAcquiredByEndOfMonth(monthIndexForTotals)
    : rttCarryover + rttQuota;
  const cpAvailableNow = is2026Rules
    ? cpCarryoverEff + cpAcquiredByEndOfMonth(monthIndexForTotals)
    : cpCarryover + cpQuota;
  const cetAvailableNow = is2026Rules ? cetCarryoverEff + cetQuota : cetCarryover + cetQuota;
  const allTypesAvailableNow = rttAvailableNow + cpAvailableNow + cetAvailableNow;
  
  // Quotas initiaux (année complète)
  const allTypesQuotaInitial =
    (rttQuota + (is2026Rules ? rttCarryoverEff : rttCarryover)) +
    (cpQuota + (is2026Rules ? cpCarryoverEff : cpCarryover)) +
    (cetQuota + (is2026Rules ? cetCarryoverEff : cetCarryover));
  const rttQuotaInitial = rttQuota + (is2026Rules ? rttCarryoverEff : rttCarryover);
  const cpQuotaInitial = cpQuota + (is2026Rules ? cpCarryoverEff : cpCarryover);
  const cetQuotaInitial = cetQuota + (is2026Rules ? cetCarryoverEff : cetCarryover);
  
  // Calculer les restants
  const allTypesRestantDisponible = Math.max(0, allTypesAvailableNow - allTypesPrisYear);
  const allTypesRestantNonPlanifie = Math.max(0, allTypesRestantDisponible - allTypesPlanifieYear);
  const allTypesRestantPlanifie = allTypesPlanifieYear;
  
  const rttRestantDisponible = Math.max(0, rttAvailableNow - rttPrisYear);
  const rttRestantNonPlanifie = Math.max(0, rttRestantDisponible - rttPlanifieYear);
  const rttRestantPlanifie = rttPlanifieYear;
  
  const cpRestantDisponible = Math.max(0, cpAvailableNow - cpPrisYear);
  const cpRestantNonPlanifie = Math.max(0, cpRestantDisponible - cpPlanifieYear);
  const cpRestantPlanifie = cpPlanifieYear;
  
  const cetRestantDisponible = Math.max(0, cetAvailableNow - cetPrisYear);
  const cetRestantNonPlanifie = Math.max(0, cetRestantDisponible - cetPlanifieYear);
  const cetRestantPlanifie = cetPlanifieYear;
  
  return {
    allTypes: {
      quotaInitial: allTypesQuotaInitial,
      pris: allTypesPrisYear,
      restantPlanifie: allTypesRestantPlanifie,
      restantNonPlanifie: allTypesRestantNonPlanifie,
      restantDisponible: allTypesRestantDisponible
    },
    rtt: {
      quotaInitial: rttQuotaInitial,
      pris: rttPrisYear,
      restantPlanifie: rttRestantPlanifie,
      restantNonPlanifie: rttRestantNonPlanifie,
      restantDisponible: rttRestantDisponible
    },
    cp: {
      quotaInitial: cpQuotaInitial,
      pris: cpPrisYear,
      restantPlanifie: cpRestantPlanifie,
      restantNonPlanifie: cpRestantNonPlanifie,
      restantDisponible: cpRestantDisponible
    },
    cet: {
      quotaInitial: cetQuotaInitial,
      pris: cetPrisYear,
      restantPlanifie: cetRestantPlanifie,
      restantNonPlanifie: cetRestantNonPlanifie,
      restantDisponible: cetRestantDisponible
    }
  };
}

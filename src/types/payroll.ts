// Payroll validation types

import { LeaveEntry } from './index'

export interface PayrollValidation {
  month: number
  year: number
  cpReliquat: {
    saisie: number
    calculee: number
    difference: number
    status: 'valid' | 'warning' | 'error'
  }
  rttPrisDansMois: {
    saisie: number
    calculee: number
    difference: number
    status: 'valid' | 'warning' | 'error'
    rttLeavesDates: Array<{
      startDate: string
      endDate: string
      workingDays: number
    }>
  }
  soldeCet: {
    saisie: number
    calculee: number
    difference: number
    status: 'valid' | 'warning' | 'error'
  }
  cpPrisMoisPrecedent: {
    saisies: string[]
    calculees: number
    manquantes: string[]
    enTrop: string[]
    status: 'valid' | 'warning' | 'error'
  }
  joursFeries: {
    saisies: string[]
    calculees: string[]
    manquantes: string[]
    enTrop: string[]
    status: 'valid' | 'warning' | 'error'
  }
  scoreGlobal: number
  statusGlobal: 'valid' | 'warning' | 'error'
}


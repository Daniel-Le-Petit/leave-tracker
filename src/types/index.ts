// Types pour le leave-tracker

export type LeaveType = 'rtt' | 'cp' | 'cet' | 'pipe'

export interface LeaveEntry {
  id: string
  type: LeaveType
  startDate: string
  endDate: string
  workingDays: number
  isHalfDay: boolean
  halfDayType?: 'morning' | 'afternoon'
  isForecast: boolean
  description?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  darkMode: boolean
  language: string
  notifications: boolean
  email: string
  firstName: string
  lastName: string
}

export interface LeaveBalance {
  type: LeaveType
  initial: number
  taken: number
  remaining: number
  carryover?: number
}

export interface PublicHoliday {
  id: string
  date: string
  name: string
  year: number
}

export interface CarryoverLeave {
  id: string
  type: LeaveType
  year: number
  days: number
  description: string
  createdAt: string
}

export interface PayrollData {
  id: string
  month: number
  year: number
  rttPrisDansMois: number
  cpPrisMoisPrecedent: string[]
  cpReliquat: number
  soldeCet: number
  createdAt: string
  updatedAt: string
}

// Types pour le transcripteur IA

export interface TranscriptionSegment {
  id: string
  text: string
  startTime: number
  endTime: number
  confidence: number
  speakerId?: string
  speakerName?: string
  isCorrected: boolean
  originalText?: string
}

export interface Speaker {
  id: string
  name: string
  voiceProfile: {
    pitch: number
    speed: number
    accent: string
  }
  isActive: boolean
  lastSeen: Date
}

export interface TranscriptionSession {
  id: string
  title: string
  startTime: Date
  endTime?: Date
  participants: Speaker[]
  segments: TranscriptionSegment[]
  isRecording: boolean
  isTranscribing: boolean
  consent: ConsentData
  settings: SessionSettings
}

export interface ConsentData {
  recording: boolean
  transcription: boolean
  storage: boolean
  sharing: boolean
  retentionDays: number
  timestamp: string
  sessionId: string
}

export interface SessionSettings {
  language: string
  autoCorrect: boolean
  realTimeCorrection: boolean
  speakerDiarization: boolean
  noiseReduction: boolean
  sensitivity: number
}

export interface CorrectionSuggestion {
  original: string
  suggested: string
  confidence: number
  context: string
}

export interface ExportOptions {
  format: 'txt' | 'pdf' | 'docx' | 'json' | 'srt'
  includeTimestamps: boolean
  includeSpeakers: boolean
  includeConfidence: boolean
  language: string
}

export interface AudioSettings {
  sampleRate: number
  channels: number
  bitDepth: number
  format: 'wav' | 'mp3' | 'webm'
}

export interface TranscriptionStats {
  totalWords: number
  totalTime: number
  averageConfidence: number
  correctionsCount: number
  speakersCount: number
  segmentsCount: number
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface WebSocketMessage {
  type: 'transcription' | 'correction' | 'speaker_change' | 'error' | 'status'
  data: any
  timestamp: string
  sessionId: string
}

export interface TranscriptionError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface VoiceProfile {
  id: string
  name: string
  samples: number
  accuracy: number
  lastUpdated: Date
  features: {
    pitch: number
    formants: number[]
    spectralCentroid: number
    mfcc: number[]
  }
}
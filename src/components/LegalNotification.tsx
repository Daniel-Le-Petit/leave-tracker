'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Mic, MicOff, Users, Clock, Shield } from 'lucide-react'

interface LegalNotificationProps {
  isRecording: boolean
  isTranscribing: boolean
  participantCount: number
  sessionStartTime: Date
  onStop: () => void
}

export default function LegalNotification({
  isRecording,
  isTranscribing,
  participantCount,
  sessionStartTime,
  onStop
}: LegalNotificationProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [sessionDuration, setSessionDuration] = useState('00:00:00')

  // Calculer la durée de la session
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const diff = now.getTime() - sessionStartTime.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setSessionDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStartTime])

  if (!isRecording && !isTranscribing) return null

  return (
    <div className="fixed top-4 right-4 z-40 max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header avec statut */}
        <div className={`px-4 py-3 flex items-center space-x-3 ${
          isRecording ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          }`}></div>
          <div className="flex items-center space-x-2">
            {isRecording ? (
              <Mic className="w-4 h-4 text-red-600" />
            ) : (
              <MicOff className="w-4 h-4 text-blue-600" />
            )}
            <span className={`text-sm font-medium ${
              isRecording ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200'
            }`}>
              {isRecording ? 'ENREGISTREMENT' : 'TRANSCRIPTION'}
            </span>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="px-4 py-3 space-y-3">
          {/* Informations de session */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{participantCount} participant{participantCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{sessionDuration}</span>
            </div>
          </div>

          {/* Avertissement légal */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Conformité Légale</p>
                <p>
                  Tous les participants ont consenti à l'enregistrement/transcription.
                  Respectez les lois locales sur la vie privée.
                </p>
              </div>
            </div>
          </div>

          {/* Détails (collapsible) */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <Shield className="w-3 h-3" />
            <span>{showDetails ? 'Masquer' : 'Afficher'} les détails</span>
          </button>

          {showDetails && (
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div>
                <strong>Base légale :</strong> Consentement explicite (RGPD)
              </div>
              <div>
                <strong>Finalité :</strong> Transcription et amélioration du service
              </div>
              <div>
                <strong>Durée :</strong> Session en cours depuis {sessionDuration}
              </div>
              <div>
                <strong>Participants :</strong> {participantCount} personne{participantCount > 1 ? 's' : ''}
              </div>
              <div>
                <strong>Statut :</strong> {isRecording ? 'Enregistrement + Transcription' : 'Transcription seule'}
              </div>
            </div>
          )}

          {/* Bouton d'arrêt */}
          <button
            onClick={onStop}
            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Arrêter la Session
          </button>
        </div>
      </div>
    </div>
  )
}

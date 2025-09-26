'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Pause, Play, Square, Users, Clock, Settings, Download, Edit3 } from 'lucide-react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import WebSpeechService from '../../services/webSpeechService'
import ConsentManager from '../../utils/consentManager'
import ConsentModal from '../../components/ConsentModal'
import LegalNotification from '../../components/LegalNotification'
import { TranscriptionSegment, Speaker, ConsentData } from '../../types'

export default function TranscripteurPage() {
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false)
  const [consent, setConsent] = useState<ConsentData | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [sessionTitle, setSessionTitle] = useState('')
  const [participants, setParticipants] = useState<Speaker[]>([])
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [editingSegment, setEditingSegment] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const transcriptionService = useRef(WebSpeechService.getInstance())
  const consentManager = useRef(ConsentManager.getInstance())

  const {
    isRecording,
    isPaused,
    audioLevel,
    duration,
    error: audioError,
    startRecording,
    stopRecording,
    togglePause,
    checkBrowserSupport,
    formatDuration
  } = useAudioRecorder({
    onSegmentComplete: handleSegmentComplete,
    onError: handleAudioError
  })

  // Vérifier le consentement au chargement
  useEffect(() => {
    const userConsent = consentManager.current.getUserConsent()
    if (!userConsent) {
      setIsConsentModalOpen(true)
    } else {
      setConsent(userConsent)
    }
  }, [])

  // Gérer la complétion d'un segment audio
  function handleSegmentComplete(segment: TranscriptionSegment) {
    if (!consent?.transcription) return
    setSegments(prev => [...prev, segment])
  }

  // Gérer les erreurs audio
  function handleAudioError(error: string) {
    console.error('Erreur audio:', error)
  }

  // Gérer le consentement
  function handleConsent(consentData: ConsentData) {
    consentManager.current.setUserConsent(consentData)
    setConsent(consentData)
    setIsConsentModalOpen(false)
    
    // Générer un ID de session
    const newSessionId = `session_${Date.now()}`
    setSessionId(newSessionId)
    
    // Initialiser le service de transcription
    const success = transcriptionService.current.initialize(newSessionId)
    if (success) {
      transcriptionService.current.setCallbacks(
        handleSegmentComplete,
        handleAudioError
      )
    }
  }

  // Démarrer/arrêter l'enregistrement
  function handleToggleRecording() {
    if (isRecording) {
      stopRecording()
      transcriptionService.current.stopListening()
    } else {
      // Vérifier le support Web Speech API
      if (!transcriptionService.current.isSupported()) {
        alert('Web Speech API non supportée par ce navigateur. Veuillez utiliser Chrome, Edge ou Safari.')
        return
      }
      
      const browserError = checkBrowserSupport()
      if (browserError) {
        alert(browserError)
        return
      }
      
      startRecording()
      transcriptionService.current.startListening()
    }
  }

  // Corriger un segment
  function handleCorrectSegment(segmentId: string, correctedText: string) {
    const success = transcriptionService.current.correctSegment(segmentId, correctedText)
    if (success) {
      setSegments(prev => 
        prev.map(seg => 
          seg.id === segmentId 
            ? { ...seg, text: correctedText, isCorrected: true, originalText: seg.text }
            : seg
        )
      )
    }
  }

  // Exporter la transcription
  function handleExport() {
    const exportData = {
      sessionId,
      title: sessionTitle || 'Transcription',
      date: new Date().toISOString(),
      participants: participants.map(p => p.name),
      segments: segments.map(seg => ({
        speaker: seg.speakerName || 'Inconnu',
        text: seg.text,
        timestamp: new Date(seg.startTime).toLocaleTimeString(),
        confidence: seg.confidence
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcription-${sessionId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!consent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Chargement...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vérification du consentement en cours
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Transcripteur IA
              </h1>
              {sessionTitle && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {sessionTitle}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExport}
                disabled={segments.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
              
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Contrôles */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contrôles
              </h2>
              
              {/* Bouton principal */}
              <div className="text-center mb-6">
                <button
                  onClick={handleToggleRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {isRecording ? 'Arrêter' : 'Démarrer'} l'enregistrement
                </p>
              </div>

              {/* Statut */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Statut</span>
                  <span className={`text-sm font-medium ${
                    isRecording ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {isRecording ? 'Enregistrement' : 'Arrêté'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Durée</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDuration(duration)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Segments</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {segments.length}
                  </span>
                </div>
              </div>

              {/* Niveau audio */}
              {isRecording && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Niveau audio</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.round(audioLevel)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${audioLevel}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Bouton pause/reprendre */}
              {isRecording && (
                <button
                  onClick={togglePause}
                  className="w-full mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 inline mr-2" />
                      Reprendre
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 inline mr-2" />
                      Pause
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Transcription */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Transcription en Temps Réel
                </h2>
                {isTranscribing && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Transcription en cours...
                  </p>
                )}
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                {segments.length === 0 ? (
                  <div className="text-center py-12">
                    <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Aucune transcription pour le moment
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Démarrez l'enregistrement pour commencer
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {segments.map((segment) => (
                      <div key={segment.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {segment.speakerName || 'Locuteur'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(segment.startTime).toLocaleTimeString()}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                ({Math.round(segment.confidence * 100)}%)
                              </span>
                            </div>
                            
                            {editingSegment === segment.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  rows={2}
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      handleCorrectSegment(segment.id, editingText)
                                      setEditingSegment(null)
                                      setEditingText('')
                                    }}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                                  >
                                    Sauvegarder
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingSegment(null)
                                      setEditingText('')
                                    }}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-900 dark:text-white">
                                {segment.text}
                                {segment.isCorrected && (
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    (corrigé)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          
                          {editingSegment !== segment.id && (
                            <button
                              onClick={() => {
                                setEditingSegment(segment.id)
                                setEditingText(segment.text)
                              }}
                              className="ml-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              <Edit3 className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onConsent={handleConsent}
      />

      <LegalNotification
        isRecording={isRecording}
        isTranscribing={isTranscribing}
        participantCount={participants.length}
        sessionStartTime={new Date()}
        onStop={stopRecording}
      />
    </div>
  )
}

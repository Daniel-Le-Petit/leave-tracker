'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { TranscriptionSegment } from '../types'

interface AudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  audioLevel: number
  duration: number
  segments: TranscriptionSegment[]
  error: string | null
}

interface AudioRecorderOptions {
  sampleRate?: number
  channels?: number
  bitRate?: number
  onSegmentComplete?: (segment: TranscriptionSegment) => void
  onError?: (error: string) => void
}

export function useAudioRecorder(options: AudioRecorderOptions = {}) {
  const {
    sampleRate = 44100,
    channels = 1,
    bitRate = 128,
    onSegmentComplete,
    onError
  } = options

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    audioLevel: 0,
    duration: 0,
    segments: [],
    error: null
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialiser l'audio context
  const initializeAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      return audioContextRef.current
    } catch (error) {
      const errorMsg = 'Erreur lors de l\'initialisation de l\'audio context'
      setState(prev => ({ ...prev, error: errorMsg }))
      onError?.(errorMsg)
      throw error
    }
  }, [onError])

  // Démarrer l'enregistrement
  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }))

      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      streamRef.current = stream

      // Initialiser l'audio context
      const audioContext = await initializeAudioContext()
      
      // Créer l'analyseur pour le niveau audio
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      analyserRef.current = analyser

      // Configurer le MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder

      // Gérer les données audio
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const duration = Date.now() - startTimeRef.current
        
        // Créer un segment de transcription
        const segment: TranscriptionSegment = {
          id: `segment_${Date.now()}`,
          text: '', // Sera rempli par le service de transcription
          startTime: startTimeRef.current,
          endTime: Date.now(),
          confidence: 0,
          isCorrected: false
        }

        setState(prev => ({
          ...prev,
          segments: [...prev.segments, segment]
        }))

        onSegmentComplete?.(segment)
      }

      // Démarrer l'enregistrement
      mediaRecorder.start(1000) // Collecter des données toutes les secondes
      startTimeRef.current = Date.now()

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0
      }))

      // Démarrer le monitoring du niveau audio et de la durée
      startMonitoring()

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur lors du démarrage de l\'enregistrement'
      setState(prev => ({ ...prev, error: errorMsg }))
      onError?.(errorMsg)
    }
  }, [sampleRate, channels, initializeAudioContext, onSegmentComplete, onError])

  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && state.isRecording) {
        mediaRecorderRef.current.stop()
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      stopMonitoring()

      setState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        audioLevel: 0
      }))

    } catch (error) {
      const errorMsg = 'Erreur lors de l\'arrêt de l\'enregistrement'
      setState(prev => ({ ...prev, error: errorMsg }))
      onError?.(errorMsg)
    }
  }, [state.isRecording])

  // Mettre en pause/reprendre
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return

    if (state.isPaused) {
      mediaRecorderRef.current.resume()
      startMonitoring()
    } else {
      mediaRecorderRef.current.pause()
      stopMonitoring()
    }

    setState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }))
  }, [state.isPaused])

  // Démarrer le monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return

    intervalRef.current = setInterval(() => {
      // Mettre à jour la durée
      if (startTimeRef.current) {
        const duration = Date.now() - startTimeRef.current
        setState(prev => ({ ...prev, duration }))
      }

      // Mettre à jour le niveau audio
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
        const audioLevel = Math.min(100, (average / 255) * 100)
        
        setState(prev => ({ ...prev, audioLevel }))
      }
    }, 100)
  }, [])

  // Arrêter le monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Nettoyer les ressources
  useEffect(() => {
    return () => {
      stopRecording()
      stopMonitoring()
    }
  }, [stopRecording, stopMonitoring])

  // Vérifier le support du navigateur
  const checkBrowserSupport = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'Votre navigateur ne supporte pas l\'enregistrement audio'
    }

    if (!window.MediaRecorder) {
      return 'Votre navigateur ne supporte pas MediaRecorder'
    }

    return null
  }, [])

  // Formater la durée
  const formatDuration = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
    }
  }, [])

  return {
    ...state,
    startRecording,
    stopRecording,
    togglePause,
    checkBrowserSupport,
    formatDuration
  }
}












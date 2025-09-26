// Service de transcription 100% gratuit avec Web Speech API

import { TranscriptionSegment } from '../types'

class WebSpeechService {
  private static instance: WebSpeechService
  private recognition: any = null
  private isListening = false
  private currentSession: string | null = null
  private segments: TranscriptionSegment[] = []
  private onSegmentCallback?: (segment: TranscriptionSegment) => void
  private onErrorCallback?: (error: string) => void

  static getInstance(): WebSpeechService {
    if (!WebSpeechService.instance) {
      WebSpeechService.instance = new WebSpeechService()
    }
    return WebSpeechService.instance
  }

  // Vérifier le support du navigateur
  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  // Initialiser le service
  initialize(sessionId: string): boolean {
    if (!this.isSupported()) {
      this.onErrorCallback?.('Web Speech API non supportée par ce navigateur')
      return false
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      
      // Configuration
      this.recognition.lang = 'fr-FR'
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.maxAlternatives = 1
      this.recognition.serviceURI = undefined // Utiliser le service par défaut

      // Événements
      this.recognition.onstart = () => {
        console.log('Reconnaissance vocale démarrée')
        this.isListening = true
      }

      this.recognition.onresult = (event: any) => {
        this.handleResult(event)
      }

      this.recognition.onerror = (event: any) => {
        this.handleError(event)
      }

      this.recognition.onend = () => {
        console.log('Reconnaissance vocale arrêtée')
        this.isListening = false
        // Redémarrer automatiquement si on était en train d'écouter
        if (this.currentSession) {
          setTimeout(() => {
            if (this.currentSession) {
              this.startListening()
            }
          }, 100)
        }
      }

      this.currentSession = sessionId
      this.segments = []
      return true
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error)
      this.onErrorCallback?.('Erreur lors de l\'initialisation de la reconnaissance vocale')
      return false
    }
  }

  // Démarrer l'écoute
  startListening(): boolean {
    if (!this.recognition || this.isListening) {
      return false
    }

    try {
      this.recognition.start()
      return true
    } catch (error) {
      console.error('Erreur lors du démarrage:', error)
      this.onErrorCallback?.('Impossible de démarrer la reconnaissance vocale')
      return false
    }
  }

  // Arrêter l'écoute
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
    this.currentSession = null
  }

  // Gérer les résultats
  private handleResult(event: any): void {
    let finalTranscript = ''
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }

    // Créer un segment pour le texte final
    if (finalTranscript.trim()) {
      const segment: TranscriptionSegment = {
        id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: finalTranscript.trim(),
        startTime: Date.now() - 3000, // Estimation
        endTime: Date.now(),
        confidence: 0.8, // Web Speech API ne donne pas de confidence
        isCorrected: false
      }

      this.segments.push(segment)
      this.onSegmentCallback?.(segment)
    }

    // Optionnel : gérer le texte intermédiaire
    if (interimTranscript.trim()) {
      console.log('Texte intermédiaire:', interimTranscript)
    }
  }

  // Gérer les erreurs
  private handleError(event: any): void {
    console.error('Erreur de reconnaissance:', event.error)
    
    let errorMessage = 'Erreur de reconnaissance vocale'
    
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'Aucune parole détectée'
        break
      case 'audio-capture':
        errorMessage = 'Erreur de capture audio'
        break
      case 'not-allowed':
        errorMessage = 'Permission refusée pour l\'accès au microphone'
        break
      case 'network':
        errorMessage = 'Erreur réseau'
        break
      case 'service-not-allowed':
        errorMessage = 'Service de reconnaissance non autorisé'
        break
      case 'bad-grammar':
        errorMessage = 'Erreur de grammaire'
        break
      case 'language-not-supported':
        errorMessage = 'Langue non supportée'
        break
      default:
        errorMessage = `Erreur inconnue: ${event.error}`
    }

    this.onErrorCallback?.(errorMessage)
  }

  // Définir les callbacks
  setCallbacks(
    onSegment: (segment: TranscriptionSegment) => void,
    onError: (error: string) => void
  ): void {
    this.onSegmentCallback = onSegment
    this.onErrorCallback = onError
  }

  // Obtenir les segments
  getSegments(): TranscriptionSegment[] {
    return [...this.segments]
  }

  // Obtenir le statut
  getStatus(): any {
    return {
      isSupported: this.isSupported(),
      isListening: this.isListening,
      currentSession: this.currentSession,
      segmentsCount: this.segments.length,
      language: this.recognition?.lang || 'fr-FR'
    }
  }

  // Changer la langue
  setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language
    }
  }

  // Obtenir les langues supportées
  getSupportedLanguages(): string[] {
    return [
      'fr-FR', // Français
      'en-US', // Anglais
      'en-GB', // Anglais (UK)
      'es-ES', // Espagnol
      'de-DE', // Allemand
      'it-IT', // Italien
      'pt-PT', // Portugais
      'nl-NL', // Néerlandais
      'ru-RU', // Russe
      'ja-JP', // Japonais
      'ko-KR', // Coréen
      'zh-CN', // Chinois
    ]
  }

  // Corriger un segment
  correctSegment(segmentId: string, correctedText: string): boolean {
    const segmentIndex = this.segments.findIndex(seg => seg.id === segmentId)
    if (segmentIndex !== -1) {
      this.segments[segmentIndex] = {
        ...this.segments[segmentIndex],
        text: correctedText,
        isCorrected: true,
        originalText: this.segments[segmentIndex].text
      }
      return true
    }
    return false
  }

  // Nettoyer les ressources
  cleanup(): void {
    this.stopListening()
    this.recognition = null
    this.segments = []
    this.currentSession = null
  }
}

export default WebSpeechService

// Service de transcription gratuit avec fallbacks

import { TranscriptionSegment } from '../types'

interface TranscriptionProvider {
  name: string
  isAvailable: boolean
  remainingQuota: number
  priority: number
}

class FreeTranscriptionService {
  private static instance: FreeTranscriptionService
  private providers: Map<string, TranscriptionProvider> = new Map()
  private currentProvider: string = 'whisper'

  static getInstance(): FreeTranscriptionService {
    if (!FreeTranscriptionService.instance) {
      FreeTranscriptionService.instance = new FreeTranscriptionService()
    }
    return FreeTranscriptionService.instance
  }

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // Whisper (OpenAI) - Gratuit
    this.providers.set('whisper', {
      name: 'OpenAI Whisper',
      isAvailable: true,
      remainingQuota: 1000000, // 1M tokens/mois
      priority: 1
    })

    // Google Speech - 60 min/mois
    this.providers.set('google', {
      name: 'Google Speech-to-Text',
      isAvailable: true,
      remainingQuota: 3600, // 60 minutes en secondes
      priority: 2
    })

    // Azure Speech - 5h/mois
    this.providers.set('azure', {
      name: 'Azure Speech Services',
      isAvailable: true,
      remainingQuota: 18000, // 5 heures en secondes
      priority: 3
    })

    // Fallback local (Web Speech API)
    this.providers.set('local', {
      name: 'Web Speech API (Local)',
      isAvailable: this.checkWebSpeechSupport(),
      remainingQuota: Infinity,
      priority: 4
    })
  }

  // Vérifier le support Web Speech API
  private checkWebSpeechSupport(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  // Obtenir le meilleur provider disponible
  private getBestProvider(): string {
    const availableProviders = Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isAvailable && provider.remainingQuota > 0)
      .sort((a, b) => a[1].priority - b[1].priority)

    return availableProviders[0]?.[0] || 'local'
  }

  // Transcrire avec le meilleur provider
  async transcribeAudio(audioBlob: Blob, timestamp: number): Promise<TranscriptionSegment | null> {
    const provider = this.getBestProvider()
    
    try {
      switch (provider) {
        case 'whisper':
          return await this.transcribeWithWhisper(audioBlob, timestamp)
        case 'google':
          return await this.transcribeWithGoogle(audioBlob, timestamp)
        case 'azure':
          return await this.transcribeWithAzure(audioBlob, timestamp)
        case 'local':
          return await this.transcribeWithWebSpeech(audioBlob, timestamp)
        default:
          return await this.transcribeWithWebSpeech(audioBlob, timestamp)
      }
    } catch (error) {
      console.error(`Erreur avec ${provider}:`, error)
      // Fallback vers le provider suivant
      return await this.fallbackTranscription(audioBlob, timestamp, provider)
    }
  }

  // Whisper (OpenAI) - Gratuit
  private async transcribeWithWhisper(audioBlob: Blob, timestamp: number): Promise<TranscriptionSegment> {
    // En production, utiliser l'API OpenAI
    // const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //     'Content-Type': 'multipart/form-data'
    //   },
    //   body: formData
    // })

    // Simulation pour la démo
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      id: `whisper_${Date.now()}`,
      text: "Transcription Whisper (gratuite) - Très précise",
      startTime: timestamp,
      endTime: timestamp + 3000,
      confidence: 0.95,
      isCorrected: false
    }
  }

  // Google Speech-to-Text - 60 min/mois
  private async transcribeWithGoogle(audioBlob: Blob, timestamp: number): Promise<TranscriptionSegment> {
    // En production, utiliser l'API Google
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      id: `google_${Date.now()}`,
      text: "Transcription Google (60 min/mois) - Bonne qualité",
      startTime: timestamp,
      endTime: timestamp + 3000,
      confidence: 0.90,
      isCorrected: false
    }
  }

  // Azure Speech - 5h/mois
  private async transcribeWithAzure(audioBlob: Blob, timestamp: number): Promise<TranscriptionSegment> {
    // En production, utiliser l'API Azure
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    return {
      id: `azure_${Date.now()}`,
      text: "Transcription Azure (5h/mois) - Speaker Diarization",
      startTime: timestamp,
      endTime: timestamp + 3000,
      confidence: 0.88,
      isCorrected: false
    }
  }

  // Web Speech API - Local (gratuit)
  private async transcribeWithWebSpeech(audioBlob: Blob, timestamp: number): Promise<TranscriptionSegment> {
    return new Promise((resolve, reject) => {
      if (!this.checkWebSpeechSupport()) {
        reject(new Error('Web Speech API non supportée'))
        return
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.lang = 'fr-FR'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      let finalTranscript = ''

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
      }

      recognition.onend = () => {
        resolve({
          id: `local_${Date.now()}`,
          text: finalTranscript || "Transcription locale (gratuite) - Qualité variable",
          startTime: timestamp,
          endTime: timestamp + 3000,
          confidence: 0.75,
          isCorrected: false
        })
      }

      recognition.onerror = (event: any) => {
        reject(new Error(`Erreur Web Speech: ${event.error}`))
      }

      recognition.start()
    })
  }

  // Fallback vers un autre provider
  private async fallbackTranscription(audioBlob: Blob, timestamp: number, failedProvider: string): Promise<TranscriptionSegment | null> {
    console.log(`Fallback depuis ${failedProvider}`)
    
    // Marquer le provider comme indisponible
    const provider = this.providers.get(failedProvider)
    if (provider) {
      provider.isAvailable = false
    }

    // Essayer avec le provider suivant
    const nextProvider = this.getBestProvider()
    if (nextProvider && nextProvider !== failedProvider) {
      return await this.transcribeAudio(audioBlob, timestamp)
    }

    // Dernier recours : transcription simulée
    return {
      id: `fallback_${Date.now()}`,
      text: "Transcription de secours - Veuillez corriger manuellement",
      startTime: timestamp,
      endTime: timestamp + 3000,
      confidence: 0.50,
      isCorrected: false
    }
  }

  // Obtenir le statut des providers
  getProvidersStatus(): any[] {
    return Array.from(this.providers.entries()).map(([key, provider]) => ({
      id: key,
      name: provider.name,
      isAvailable: provider.isAvailable,
      remainingQuota: provider.remainingQuota,
      priority: provider.priority
    }))
  }

  // Obtenir le provider actuel
  getCurrentProvider(): string {
    return this.currentProvider
  }

  // Changer de provider
  setProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.currentProvider = providerId
      return true
    }
    return false
  }

  // Réinitialiser les quotas (pour les tests)
  resetQuotas(): void {
    this.providers.forEach(provider => {
      provider.isAvailable = true
      if (provider.name.includes('Whisper')) {
        provider.remainingQuota = 1000000
      } else if (provider.name.includes('Google')) {
        provider.remainingQuota = 3600
      } else if (provider.name.includes('Azure')) {
        provider.remainingQuota = 18000
      }
    })
  }
}

export default FreeTranscriptionService

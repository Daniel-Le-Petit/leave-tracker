// Service de transcription avec OpenAI Whisper et correction intelligente

import { TranscriptionSegment, Speaker, CorrectionSuggestion } from '../types'

class TranscriptionService {
  private static instance: TranscriptionService
  private isProcessing = false
  private currentSession: string | null = null
  private speakers: Map<string, Speaker> = new Map()
  private correctionHistory: Map<string, string[]> = new Map()

  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService()
    }
    return TranscriptionService.instance
  }

  // Initialiser une session de transcription
  async initializeSession(sessionId: string, settings: any): Promise<boolean> {
    try {
      this.currentSession = sessionId
      this.speakers.clear()
      this.correctionHistory.clear()
      
      console.log(`Session de transcription initialisée: ${sessionId}`)
      return true
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error)
      return false
    }
  }

  // Transcrire un segment audio
  async transcribeAudio(audioBlob: Blob, timestamp: number): Promise<TranscriptionSegment | null> {
    if (this.isProcessing) {
      console.warn('Transcription en cours, segment ignoré')
      return null
    }

    this.isProcessing = true

    try {
      // Simuler la transcription (remplacer par OpenAI Whisper en production)
      const transcription = await this.simulateTranscription(audioBlob)
      
      const segment: TranscriptionSegment = {
        id: this.generateSegmentId(),
        text: transcription.text,
        startTime: timestamp,
        endTime: timestamp + transcription.duration,
        confidence: transcription.confidence,
        speakerId: transcription.speakerId,
        speakerName: transcription.speakerName,
        isCorrected: false
      }

      // Identifier le locuteur si possible
      if (transcription.speakerId) {
        await this.identifySpeaker(segment)
      }

      return segment
    } catch (error) {
      console.error('Erreur de transcription:', error)
      return null
    } finally {
      this.isProcessing = false
    }
  }

  // Corriger un segment de transcription
  async correctSegment(segmentId: string, correctedText: string): Promise<TranscriptionSegment | null> {
    try {
      // Simuler la correction (en production, sauvegarder en base)
      const segment = await this.getSegmentById(segmentId)
      if (!segment) return null

      const correctedSegment: TranscriptionSegment = {
        ...segment,
        text: correctedText,
        isCorrected: true,
        originalText: segment.text
      }

      // Apprendre de la correction pour améliorer les futures transcriptions
      await this.learnFromCorrection(segment.text, correctedText)

      return correctedSegment
    } catch (error) {
      console.error('Erreur lors de la correction:', error)
      return null
    }
  }

  // Obtenir des suggestions de correction
  async getCorrectionSuggestions(text: string): Promise<CorrectionSuggestion[]> {
    try {
      // Simuler des suggestions (en production, utiliser un modèle de correction)
      const suggestions: CorrectionSuggestion[] = []

      // Vérifier l'historique des corrections
      const history = this.correctionHistory.get(text.toLowerCase())
      if (history && history.length > 0) {
        suggestions.push({
          original: text,
          suggested: history[0],
          confidence: 0.9,
          context: 'Correction précédente'
        })
      }

      // Suggestions basées sur des patterns communs
      const commonCorrections = this.getCommonCorrections(text)
      suggestions.push(...commonCorrections)

      return suggestions.slice(0, 3) // Limiter à 3 suggestions
    } catch (error) {
      console.error('Erreur lors de la génération de suggestions:', error)
      return []
    }
  }

  // Identifier un locuteur
  private async identifySpeaker(segment: TranscriptionSegment): Promise<void> {
    try {
      // Simuler l'identification de locuteur (en production, utiliser Speaker Diarization)
      if (!segment.speakerId) return

      let speaker = this.speakers.get(segment.speakerId)
      if (!speaker) {
        speaker = {
          id: segment.speakerId,
          name: `Locuteur ${this.speakers.size + 1}`,
          voiceProfile: {
            pitch: Math.random() * 200 + 100, // Simulé
            speed: Math.random() * 50 + 150,  // Simulé
            accent: 'français' // Simulé
          },
          isActive: true,
          lastSeen: new Date()
        }
        this.speakers.set(segment.speakerId, speaker)
      } else {
        speaker.lastSeen = new Date()
        speaker.isActive = true
      }

      segment.speakerName = speaker.name
    } catch (error) {
      console.error('Erreur lors de l\'identification du locuteur:', error)
    }
  }

  // Apprendre d'une correction
  private async learnFromCorrection(original: string, corrected: string): Promise<void> {
    try {
      const key = original.toLowerCase()
      const history = this.correctionHistory.get(key) || []
      
      // Ajouter la correction à l'historique
      if (!history.includes(corrected)) {
        history.unshift(corrected)
        // Garder seulement les 5 dernières corrections
        this.correctionHistory.set(key, history.slice(0, 5))
      }
    } catch (error) {
      console.error('Erreur lors de l\'apprentissage:', error)
    }
  }

  // Simuler la transcription (remplacer par OpenAI Whisper)
  private async simulateTranscription(audioBlob: Blob): Promise<any> {
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Textes de démonstration
    const sampleTexts = [
      "Bonjour tout le monde, bienvenue à cette réunion",
      "Je pense qu'on devrait discuter du budget pour le prochain trimestre",
      "D'accord, qu'est-ce que vous en pensez ?",
      "Je suis d'accord avec cette proposition",
      "Parfait, on peut passer au point suivant",
      "Avez-vous des questions sur ce sujet ?",
      "Non, tout est clair pour moi",
      "Très bien, on peut clôturer cette réunion"
    ]

    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)]
    const speakerId = `speaker_${Math.floor(Math.random() * 3) + 1}`

    return {
      text: randomText,
      confidence: 0.85 + Math.random() * 0.1,
      duration: 2000 + Math.random() * 3000,
      speakerId,
      speakerName: `Locuteur ${speakerId.split('_')[1]}`
    }
  }

  // Obtenir les corrections communes
  private getCommonCorrections(text: string): CorrectionSuggestion[] {
    const corrections: CorrectionSuggestion[] = []

    // Corrections typiques
    const commonMistakes: { [key: string]: string } = {
      'bonjour': 'Bonjour',
      'merci': 'Merci',
      'daccord': 'D\'accord',
      'quest-ce': 'Qu\'est-ce',
      'nest-ce': 'N\'est-ce',
      'sil': 'S\'il',
      'quil': 'Qu\'il'
    }

    Object.entries(commonMistakes).forEach(([mistake, correction]) => {
      if (text.toLowerCase().includes(mistake)) {
        corrections.push({
          original: text,
          suggested: text.replace(new RegExp(mistake, 'gi'), correction),
          confidence: 0.8,
          context: 'Correction typographique'
        })
      }
    })

    return corrections
  }

  // Obtenir un segment par ID (simulé)
  private async getSegmentById(segmentId: string): Promise<TranscriptionSegment | null> {
    // En production, récupérer depuis la base de données
    return {
      id: segmentId,
      text: 'Texte simulé',
      startTime: Date.now() - 5000,
      endTime: Date.now() - 3000,
      confidence: 0.9,
      isCorrected: false
    }
  }

  // Générer un ID de segment unique
  private generateSegmentId(): string {
    return `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Obtenir les locuteurs actifs
  getActiveSpeakers(): Speaker[] {
    return Array.from(this.speakers.values()).filter(speaker => speaker.isActive)
  }

  // Arrêter la session
  async stopSession(): Promise<void> {
    this.currentSession = null
    this.speakers.clear()
    this.isProcessing = false
    console.log('Session de transcription arrêtée')
  }

  // Obtenir les statistiques
  getStats(): any {
    return {
      activeSpeakers: this.speakers.size,
      correctionsLearned: this.correctionHistory.size,
      isProcessing: this.isProcessing,
      currentSession: this.currentSession
    }
  }
}

export default TranscriptionService












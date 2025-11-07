// Gestionnaire de consentement RGPD pour le transcripteur

export interface ConsentData {
  recording: boolean
  transcription: boolean
  storage: boolean
  sharing: boolean
  retentionDays: number
  timestamp: string
  sessionId: string
}

export interface ParticipantConsent {
  participantId: string
  participantName: string
  consent: ConsentData
  timestamp: string
}

class ConsentManager {
  private static instance: ConsentManager
  private currentConsent: ConsentData | null = null
  private participantsConsent: Map<string, ParticipantConsent> = new Map()

  static getInstance(): ConsentManager {
    if (!ConsentManager.instance) {
      ConsentManager.instance = new ConsentManager()
    }
    return ConsentManager.instance
  }

  // Vérifier si le consentement est valide
  isValidConsent(consent: ConsentData): boolean {
    if (!consent.transcription) return false
    
    // Vérifier que le consentement n'est pas trop ancien (24h max)
    const consentTime = new Date(consent.timestamp)
    const now = new Date()
    const hoursDiff = (now.getTime() - consentTime.getTime()) / (1000 * 60 * 60)
    
    return hoursDiff < 24
  }

  // Enregistrer le consentement de l'utilisateur principal
  setUserConsent(consent: ConsentData): void {
    this.currentConsent = {
      ...consent,
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId()
    }
    
    // Sauvegarder dans localStorage (chiffré)
    this.saveConsentToStorage('userConsent', this.currentConsent)
  }

  // Obtenir le consentement actuel
  getUserConsent(): ConsentData | null {
    if (this.currentConsent && this.isValidConsent(this.currentConsent)) {
      return this.currentConsent
    }
    
    // Essayer de charger depuis le stockage
    const stored = this.loadConsentFromStorage('userConsent')
    if (stored && this.isValidConsent(stored)) {
      this.currentConsent = stored
      return stored
    }
    
    return null
  }

  // Ajouter le consentement d'un participant
  addParticipantConsent(participantId: string, participantName: string, consent: ConsentData): void {
    const participantConsent: ParticipantConsent = {
      participantId,
      participantName,
      consent: {
        ...consent,
        timestamp: new Date().toISOString(),
        sessionId: this.currentConsent?.sessionId || this.generateSessionId()
      },
      timestamp: new Date().toISOString()
    }
    
    this.participantsConsent.set(participantId, participantConsent)
    this.saveConsentToStorage(`participant_${participantId}`, participantConsent)
  }

  // Vérifier si tous les participants ont consenti
  allParticipantsConsented(): boolean {
    if (!this.currentConsent) return false
    
    // Pour une réunion, tous les participants doivent avoir consenti
    return this.participantsConsent.size > 0 && 
           Array.from(this.participantsConsent.values()).every(p => 
             this.isValidConsent(p.consent)
           )
  }

  // Obtenir la liste des participants ayant consenti
  getConsentedParticipants(): ParticipantConsent[] {
    return Array.from(this.participantsConsent.values()).filter(p => 
      this.isValidConsent(p.consent)
    )
  }

  // Révoquer le consentement
  revokeConsent(): void {
    this.currentConsent = null
    this.participantsConsent.clear()
    
    // Supprimer du stockage
    localStorage.removeItem('userConsent')
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('participant_')) {
        localStorage.removeItem(key)
      }
    })
  }

  // Générer un ID de session unique
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Sauvegarder le consentement (chiffré)
  private saveConsentToStorage(key: string, data: any): void {
    try {
      const encrypted = this.encrypt(JSON.stringify(data))
      localStorage.setItem(key, encrypted)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du consentement:', error)
    }
  }

  // Charger le consentement (déchiffré)
  private loadConsentFromStorage(key: string): any {
    try {
      const encrypted = localStorage.getItem(key)
      if (!encrypted) return null
      
      const decrypted = this.decrypt(encrypted)
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Erreur lors du chargement du consentement:', error)
      return null
    }
  }

  // Chiffrement simple (en production, utiliser une librairie dédiée)
  private encrypt(text: string): string {
    // Implémentation basique - à remplacer par un vrai chiffrement
    return btoa(text)
  }

  private decrypt(encrypted: string): string {
    // Implémentation basique - à remplacer par un vrai déchiffrement
    return atob(encrypted)
  }

  // Vérifier la conformité RGPD
  isGDPRCompliant(): boolean {
    const userConsent = this.getUserConsent()
    if (!userConsent) return false
    
    // Vérifications de base
    return (
      userConsent.transcription && // Au minimum la transcription doit être autorisée
      userConsent.timestamp && // Timestamp présent
      this.isValidConsent(userConsent) // Consentement valide
    )
  }

  // Générer un rapport de conformité
  generateComplianceReport(): any {
    return {
      userConsent: this.currentConsent,
      participantsCount: this.participantsConsent.size,
      consentedParticipants: this.getConsentedParticipants().length,
      isCompliant: this.isGDPRCompliant(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentConsent?.sessionId
    }
  }
}

export default ConsentManager












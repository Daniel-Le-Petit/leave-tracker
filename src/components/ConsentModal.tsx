'use client'

import { useState } from 'react'
import { X, Mic, MicOff, Shield, Eye, EyeOff } from 'lucide-react'

interface ConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onConsent: (consent: ConsentData) => void
}

interface ConsentData {
  recording: boolean
  transcription: boolean
  storage: boolean
  sharing: boolean
  retentionDays: number
}

export default function ConsentModal({ isOpen, onClose, onConsent }: ConsentModalProps) {
  const [consent, setConsent] = useState<ConsentData>({
    recording: false,
    transcription: true,
    storage: false,
    sharing: false,
    retentionDays: 7
  })

  const [showDetails, setShowDetails] = useState(false)

  if (!isOpen) return null

  const handleSubmit = () => {
    onConsent(consent)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Consentement pour l'Enregistrement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Important - Conformité Légale
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Vous devez obtenir le consentement de tous les participants avant d'enregistrer ou transcrire une conversation.
                </p>
              </div>
            </div>
          </div>

          {/* Consent Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Que souhaitez-vous autoriser ?
            </h3>

            {/* Transcription */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mic className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Transcription en temps réel
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Conversion de la parole en texte (recommandé)
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent.transcription}
                  onChange={(e) => setConsent({...consent, transcription: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Recording */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <MicOff className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Enregistrement audio
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sauvegarde de l'audio (optionnel)
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent.recording}
                  onChange={(e) => setConsent({...consent, recording: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Storage */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Stockage des données
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Conservation des transcriptions
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent.storage}
                  onChange={(e) => setConsent({...consent, storage: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Retention Period */}
            {consent.storage && (
              <div className="ml-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durée de conservation (jours)
                </label>
                <select
                  value={consent.retentionDays}
                  onChange={(e) => setConsent({...consent, retentionDays: parseInt(e.target.value)})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={1}>1 jour</option>
                  <option value={7}>7 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={90}>90 jours</option>
                  <option value={365}>1 an</option>
                </select>
              </div>
            )}
          </div>

          {/* Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {showDetails ? 'Masquer' : 'Afficher'} les détails légaux
            </span>
          </button>

          {/* Legal Details */}
          {showDetails && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p><strong>Base légale :</strong> Consentement explicite (RGPD Art. 6.1.a)</p>
              <p><strong>Finalité :</strong> Transcription et amélioration du service</p>
              <p><strong>Droits :</strong> Accès, rectification, effacement, portabilité</p>
              <p><strong>Sécurité :</strong> Chiffrement AES-256, accès limité</p>
              <p><strong>Contact DPO :</strong> dpo@transcripteur-ia.fr</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!consent.transcription}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Confirmer le Consentement
          </button>
        </div>
      </div>
    </div>
  )
}

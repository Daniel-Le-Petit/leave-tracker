'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle, Download, Eye, EyeOff } from 'lucide-react'
import ConsentManager from '../../utils/consentManager'

export default function LegalCompliancePage() {
  const [consentManager] = useState(() => ConsentManager.getInstance())
  const [complianceReport, setComplianceReport] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const report = consentManager.generateComplianceReport()
    setComplianceReport(report)
  }, [consentManager])

  const exportComplianceReport = () => {
    if (!complianceReport) return
    
    const dataStr = JSON.stringify(complianceReport, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!complianceReport) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Conformité Légale RGPD
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Vérifiez le statut de conformité de vos sessions d'enregistrement et de transcription.
          </p>
        </div>

        {/* Statut de Conformité */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Statut de Conformité
          </h2>
          
          <div className="flex items-center space-x-4">
            {complianceReport.isCompliant ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium">Conforme RGPD</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600">
                <XCircle className="w-6 h-6" />
                <span className="font-medium">Non Conforme</span>
              </div>
            )}
            
            <div className="flex-1"></div>
            
            <button
              onClick={exportComplianceReport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exporter le Rapport</span>
            </button>
          </div>
        </div>

        {/* Détails du Consentement */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Détails du Consentement
            </h2>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-sm">
                {showDetails ? 'Masquer' : 'Afficher'} les détails
              </span>
            </button>
          </div>

          {showDetails && complianceReport.userConsent && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">Autorisations</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Transcription</span>
                      <span className={`text-sm font-medium ${
                        complianceReport.userConsent.transcription ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {complianceReport.userConsent.transcription ? 'Autorisée' : 'Refusée'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Enregistrement</span>
                      <span className={`text-sm font-medium ${
                        complianceReport.userConsent.recording ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {complianceReport.userConsent.recording ? 'Autorisé' : 'Refusé'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Stockage</span>
                      <span className={`text-sm font-medium ${
                        complianceReport.userConsent.storage ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {complianceReport.userConsent.storage ? 'Autorisé' : 'Refusé'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">Informations</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Session ID</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white">
                        {complianceReport.userConsent.sessionId?.substring(0, 12)}...
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(complianceReport.userConsent.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Rétention</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {complianceReport.userConsent.retentionDays} jours
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Participants
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {complianceReport.participantsCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {complianceReport.consentedParticipants}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ayant Consenti
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {complianceReport.participantsCount - complianceReport.consentedParticipants}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                En Attente
              </div>
            </div>
          </div>
        </div>

        {/* Avertissements */}
        {!complianceReport.isCompliant && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  Attention - Non Conformité Détectée
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  Votre session n'est pas conforme aux exigences RGPD. Veuillez vérifier que :
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                  <li>Tous les participants ont donné leur consentement explicite</li>
                  <li>Le consentement est valide (moins de 24h)</li>
                  <li>Les finalités sont clairement définies</li>
                  <li>Les droits des participants sont respectés</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actions
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => consentManager.revokeConsent()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Révoquer le Consentement
            </button>
            
            <button
              onClick={exportComplianceReport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Exporter le Rapport
            </button>
            
            <a
              href="/legal/privacy-policy"
              target="_blank"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Politique de Confidentialité
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}












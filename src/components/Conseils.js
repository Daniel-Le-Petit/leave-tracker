import React, { useState } from 'react';
import { 
  CheckCircle, 
  Circle, 
  ExternalLink, 
  Phone, 
  FileText, 
  Clock,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';

const Conseils = ({ formData, calculations, onPrev, onReset }) => {
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const toggleStep = (stepId) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const steps = [
    {
      id: 'accord-employeur',
      title: 'Obtenir l\'accord de votre employeur',
      description: 'La retraite progressive nécessite l\'accord de votre employeur. Préparez votre demande avec des arguments solides.',
      details: [
        'Rédigez une lettre de demande formelle',
        'Préparez un argumentaire sur les bénéfices pour l\'entreprise',
        'Proposez un plan de transition pour votre poste',
        'Suggérez une période d\'essai de 3 mois'
      ],
      links: [
        { text: 'Modèle de lettre de demande', url: '#' }
      ]
    },
    {
      id: 'avenant-contrat',
      title: 'Signer un avenant au contrat de travail',
      description: 'Un avenant doit être signé pour modifier votre temps de travail et votre rémunération.',
      details: [
        'Négociez les modalités de la réduction de temps',
        'Définissez les jours de travail',
        'Précisez la durée de la retraite progressive',
        'Incluez les clauses de retour au temps plein'
      ],
      links: [
        { text: 'Modèle d\'avenant', url: '#' }
      ]
    },
    {
      id: 'dossier-carsat',
      title: 'Déposer votre dossier CARSAT',
      description: 'Vous devez déposer votre demande de retraite progressive auprès de la CARSAT.',
      details: [
        'Téléchargez le formulaire CERFA 12156*01',
        'Rassemblez les pièces justificatives',
        'Déposez votre dossier 6 mois avant la date souhaitée',
        'Conservez l\'accusé de réception'
      ],
      links: [
        { text: 'Formulaire CERFA 12156*01', url: 'https://www.service-public.fr/particuliers/vosdroits/R12345' },
        { text: 'Site CARSAT', url: 'https://www.carsat.fr' }
      ]
    },
    {
      id: 'verification-carriere',
      title: 'Vérifier votre relevé de carrière',
      description: 'Vérifiez que tous vos trimestres sont bien comptabilisés.',
      details: [
        'Connectez-vous sur info-retraite.fr',
        'Vérifiez tous vos trimestres cotisés',
        'Signalez les périodes manquantes',
        'Demandez des corrections si nécessaire'
      ],
      links: [
        { text: 'Info-retraite.fr', url: 'https://info-retraite.fr' }
      ]
    },
    {
      id: 'complementaire-retraite',
      title: 'Vérifier votre complémentaire retraite',
      description: 'Contactez votre organisme de complémentaire retraite (Agirc-Arrco, etc.).',
      details: [
        'Vérifiez les modalités de la retraite progressive',
        'Calculez l\'impact sur votre pension complémentaire',
        'Demandez une estimation personnalisée',
        'Adaptez vos cotisations si nécessaire'
      ],
      links: [
        { text: 'Agirc-Arrco', url: 'https://www.agirc-arrco.fr' }
      ]
    },
    {
      id: 'preparation-financiere',
      title: 'Préparer votre transition financière',
      description: 'Anticipez les changements dans votre budget mensuel.',
      details: [
        'Établissez un budget avec votre nouveau revenu',
        'Vérifiez vos assurances et mutuelles',
        'Adaptez vos épargnes et investissements',
        'Prévoyez un fonds de sécurité'
      ],
      links: []
    }
  ];

  const getStepIcon = (stepId) => {
    return completedSteps.has(stepId) ? (
      <CheckCircle size={24} color="#059669" />
    ) : (
      <Circle size={24} color="#6b7280" />
    );
  };

  const completedCount = completedSteps.size;
  const totalSteps = steps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  return (
    <div>
      {/* En-tête */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <CheckCircle size={48} color="#059669" style={{ marginBottom: '16px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
          Conseils et Démarches
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Suivez ces étapes pour mettre en place votre retraite progressive
        </p>
      </div>

      {/* Progression */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Votre progression
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ 
            flex: 1, 
            height: '12px', 
            background: '#e5e7eb', 
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>
            {completedCount}/{totalSteps}
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          {completedCount === 0 && 'Commencez par la première étape !'}
          {completedCount > 0 && completedCount < totalSteps && `Excellent ! ${totalSteps - completedCount} étapes restantes.`}
          {completedCount === totalSteps && 'Félicitations ! Vous avez terminé toutes les étapes.'}
        </p>
      </div>

      {/* Étapes détaillées */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className="card"
            style={{ 
              border: completedSteps.has(step.id) ? '2px solid #059669' : '2px solid #e5e7eb',
              background: completedSteps.has(step.id) ? '#f0fdf4' : 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <button
                onClick={() => toggleStep(step.id)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {getStepIcon(step.id)}
              </button>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#6b7280',
                    background: '#f3f4f6',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}>
                    Étape {index + 1}
                  </span>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: completedSteps.has(step.id) ? '#059669' : '#1f2937',
                    margin: 0
                  }}>
                    {step.title}
                  </h3>
                </div>
                
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  marginBottom: '16px',
                  lineHeight: '1.6'
                }}>
                  {step.description}
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Actions à réaliser :
                  </h4>
                  <ul style={{ marginLeft: '20px' }}>
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} style={{ 
                        fontSize: '14px', 
                        color: '#6b7280', 
                        marginBottom: '4px',
                        lineHeight: '1.5'
                      }}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {step.links.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Liens utiles :
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {step.links.map((link, linkIndex) => (
                        <a
                          key={linkIndex}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px',
                            textDecoration: 'none'
                          }}
                        >
                          <ExternalLink size={12} style={{ marginRight: '4px' }} />
                          {link.text}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Informations importantes */}
      <div className="alert alert-warning" style={{ marginTop: '24px' }}>
        <AlertTriangle size={20} style={{ marginRight: '12px' }} />
        <div>
          <h4 style={{ marginBottom: '8px' }}>⚠️ Points d'attention</h4>
          <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
            <li>La retraite progressive n'est pas un droit, elle nécessite l'accord de l'employeur</li>
            <li>Vous devez avoir au moins 5 ans d'ancienneté dans l'entreprise</li>
            <li>La durée minimale est de 1 an, la durée maximale de 5 ans</li>
            <li>Vous pouvez reprendre un temps plein à tout moment</li>
            <li>Votre pension définitive sera légèrement réduite</li>
          </ul>
        </div>
      </div>

      {/* Contact conseiller */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Phone size={32} color="#2563eb" />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
              Besoin d'aide ?
            </h3>
            <p style={{ fontSize: '14px', color: '#1e40af', marginBottom: '12px' }}>
              Un conseiller retraite peut vous accompagner dans vos démarches
            </p>
            <button className="btn btn-primary" style={{ fontSize: '14px', padding: '8px 16px' }}>
              <Phone size={16} style={{ marginRight: '8px' }} />
              Contacter un conseiller
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <button onClick={onPrev} className="btn btn-outline">
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Retour aux scénarios
        </button>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={onReset} className="btn btn-secondary">
            <RotateCcw size={16} style={{ marginRight: '8px' }} />
            Nouvelle simulation
          </button>
        </div>
      </div>
    </div>
  );
};

export default Conseils;










import React, { useState, useEffect, Suspense } from 'react';
import { Calculator, BarChart3, TrendingUp, CheckCircle } from 'lucide-react';

// Lazy load components for better performance
const Formulaire = React.lazy(() => import('./components/Formulaire'));
const Resultats = React.lazy(() => import('./components/Resultats'));
const Scenarios = React.lazy(() => import('./components/Scenarios'));
const Conseils = React.lazy(() => import('./components/Conseils'));

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    salaireBrut: '',
    salaireNet: '',
    pensionRetraite: '',
    quotiteTravail: 80,
    dureeProgressive: 2
  });
  const [calculations, setCalculations] = useState(null);
  const [savedSimulations, setSavedSimulations] = useState([]);

  // Charger les simulations sauvegardées au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('retraiteclair-simulations');
    if (saved) {
      setSavedSimulations(JSON.parse(saved));
    }
  }, []);

  // Sauvegarder une simulation
  const saveSimulation = (simulation) => {
    const newSimulation = {
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR'),
      ...simulation
    };
    const updatedSimulations = [...savedSimulations, newSimulation];
    setSavedSimulations(updatedSimulations);
    localStorage.setItem('retraiteclair-simulations', JSON.stringify(updatedSimulations));
  };

  // Calculer les résultats
  const calculateResults = (data) => {
    const salaireBrut = parseFloat(data.salaireBrut) || 0;
    const salaireNet = parseFloat(data.salaireNet) || 0;
    const pensionRetraite = parseFloat(data.pensionRetraite) || 0;
    const quotiteTravail = data.quotiteTravail / 100;

    const salairePartiel = salaireBrut * quotiteTravail;
    const pensionProgressive = pensionRetraite * (1 - quotiteTravail);
    const revenuTotal = salairePartiel + pensionProgressive;

    const salaireNetPartiel = salaireNet * quotiteTravail;
    const revenuNetTotal = salaireNetPartiel + pensionProgressive;

    const perteBrute = salaireBrut - revenuTotal;
    const perteNet = salaireNet - revenuNetTotal;
    const pourcentagePerte = (perteBrute / salaireBrut) * 100;

    return {
      salairePartiel,
      pensionProgressive,
      revenuTotal,
      revenuNetTotal,
      perteBrute,
      perteNet,
      pourcentagePerte,
      quotiteTravail: data.quotiteTravail
    };
  };

  const handleFormSubmit = (data) => {
    setFormData(data);
    const results = calculateResults(data);
    setCalculations(results);
    setCurrentStep(2);
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFormData({
      age: '',
      salaireBrut: '',
      salaireNet: '',
      pensionRetraite: '',
      quotiteTravail: 80,
      dureeProgressive: 2
    });
    setCalculations(null);
  };

  const steps = [
    { id: 1, name: 'Saisie', icon: Calculator },
    { id: 2, name: 'Résultats', icon: BarChart3 },
    { id: 3, name: 'Scénarios', icon: TrendingUp },
    { id: 4, name: 'Conseils', icon: CheckCircle }
  ];

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <h1 className="nav-title">RetraiteClair</h1>
          <div className="nav-steps">
            {steps.map((step) => {
              const Icon = step.icon;
              let stepClass = 'nav-step';
              if (step.id === currentStep) {
                stepClass += ' active';
              } else if (step.id < currentStep) {
                stepClass += ' completed';
              } else {
                stepClass += ' pending';
              }
              
              return (
                <div key={step.id} className={stepClass}>
                  <Icon size={16} style={{ marginRight: '8px' }} />
                  {step.name}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>}>
          {currentStep === 1 && (
            <Formulaire 
              formData={formData}
              onSubmit={handleFormSubmit}
            />
          )}
          
          {currentStep === 2 && calculations && (
            <Resultats 
              formData={formData}
              calculations={calculations}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              onSave={saveSimulation}
            />
          )}
          
          {currentStep === 3 && calculations && (
            <Scenarios 
              formData={formData}
              calculations={calculations}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              savedSimulations={savedSimulations}
            />
          )}
          
          {currentStep === 4 && (
            <Conseils 
              formData={formData}
              calculations={calculations}
              onPrev={handlePrevStep}
              onReset={handleReset}
            />
          )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '40px 20px', 
        color: 'white',
        background: 'rgba(0,0,0,0.1)',
        marginTop: '60px'
      }}>
        <p>RetraiteClair - Simulateur de retraite progressive</p>
        <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
          Cette application fournit des estimations indicatives. Consultez un conseiller pour des informations précises.
        </p>
      </footer>
    </div>
  );
}

export default App;








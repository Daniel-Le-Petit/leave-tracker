import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  TrendingUp, 
  ArrowLeft, 
  ArrowRight, 
  Download,
  RotateCcw,
  BarChart3
} from 'lucide-react';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Scenarios = ({ formData, calculations, onNext, onPrev, savedSimulations }) => {
  const [selectedQuotite, setSelectedQuotite] = useState(formData.quotiteTravail);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Générer différents scénarios de quotité
  const generateScenarios = () => {
    const scenarios = [];
    const quotites = [60, 70, 80, 90, 100];
    
    quotites.forEach(quotite => {
      const salaireBrut = parseFloat(formData.salaireBrut) || 0;
      const salaireNet = parseFloat(formData.salaireNet) || 0;
      const pensionRetraite = parseFloat(formData.pensionRetraite) || 0;
      const quotiteDecimal = quotite / 100;

      const salairePartiel = salaireBrut * quotiteDecimal;
      const pensionProgressive = pensionRetraite * (1 - quotiteDecimal);
      const revenuTotal = salairePartiel + pensionProgressive;
      const revenuNetTotal = (salaireNet * quotiteDecimal) + pensionProgressive;
      
      const perteBrute = salaireBrut - revenuTotal;
      const perteNet = salaireNet - revenuNetTotal;
      const pourcentagePerte = (perteBrute / salaireBrut) * 100;

      scenarios.push({
        quotite,
        salairePartiel,
        pensionProgressive,
        revenuTotal,
        revenuNetTotal,
        perteBrute,
        perteNet,
        pourcentagePerte,
        tempsLibre: 100 - quotite
      });
    });

    return scenarios;
  };

  const scenarios = generateScenarios();
  const currentScenario = scenarios.find(s => s.quotite === selectedQuotite);

  // Données pour le graphique en barres
  const barData = {
    labels: scenarios.map(s => `${s.quotite}%`),
    datasets: [
      {
        label: 'Revenu total mensuel',
        data: scenarios.map(s => s.revenuTotal),
        backgroundColor: '#2563eb',
        borderColor: '#1d4ed8',
        borderWidth: 2,
      },
      {
        label: 'Perte vs temps plein',
        data: scenarios.map(s => s.perteBrute),
        backgroundColor: '#dc2626',
        borderColor: '#b91c1c',
        borderWidth: 2,
      }
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Comparaison des scénarios de retraite progressive',
        font: {
          size: 16,
          weight: '600'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const handleExportPDF = () => {
    // Cette fonctionnalité sera implémentée avec jsPDF
    alert('Export PDF en cours de développement...');
  };

  const handleTestQuotite = (quotite) => {
    setSelectedQuotite(quotite);
  };

  return (
    <div>
      {/* En-tête */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <BarChart3 size={48} color="#2563eb" style={{ marginBottom: '16px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
          Scénarios Comparatifs
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Comparez différentes quotités de travail pour optimiser votre retraite progressive
        </p>
      </div>

      {/* Graphique comparatif */}
      <div className="chart-container">
        <Bar data={barData} options={barOptions} />
      </div>

      {/* Tableau comparatif */}
      <div className="card">
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '20px' }}>
          Tableau comparatif détaillé
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Quotité</th>
                <th>Revenu total</th>
                <th>Revenu net</th>
                <th>Perte brute</th>
                <th>Perte nette</th>
                <th>Temps libre</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario) => (
                <tr 
                  key={scenario.quotite}
                  style={{ 
                    backgroundColor: scenario.quotite === selectedQuotite ? '#dbeafe' : 'transparent'
                  }}
                >
                  <td style={{ fontWeight: '600' }}>{scenario.quotite}%</td>
                  <td style={{ fontWeight: '600', color: '#2563eb' }}>
                    {formatCurrency(scenario.revenuTotal)}
                  </td>
                  <td style={{ color: '#059669' }}>
                    {formatCurrency(scenario.revenuNetTotal)}
                  </td>
                  <td style={{ color: '#dc2626' }}>
                    {formatCurrency(scenario.perteBrute)}
                  </td>
                  <td style={{ color: '#dc2626' }}>
                    {formatCurrency(scenario.perteNet)}
                  </td>
                  <td style={{ color: '#7c3aed' }}>
                    {scenario.tempsLibre}%
                  </td>
                  <td>
                    <button
                      onClick={() => handleTestQuotite(scenario.quotite)}
                      className="btn btn-outline"
                      style={{ 
                        padding: '4px 12px', 
                        fontSize: '12px',
                        backgroundColor: scenario.quotite === selectedQuotite ? '#2563eb' : 'transparent',
                        color: scenario.quotite === selectedQuotite ? 'white' : '#2563eb'
                      }}
                    >
                      {scenario.quotite === selectedQuotite ? 'Sélectionné' : 'Tester'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scénario sélectionné */}
      {currentScenario && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e40af', marginBottom: '20px' }}>
            Scénario sélectionné : {currentScenario.quotite}% de temps de travail
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Revenu total</h4>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>
                {formatCurrency(currentScenario.revenuTotal)}
              </div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Revenu net</h4>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                {formatCurrency(currentScenario.revenuNetTotal)}
              </div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Temps libre</h4>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#7c3aed' }}>
                {currentScenario.tempsLibre}%
              </div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Perte nette</h4>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                {formatCurrency(currentScenario.perteNet)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulations sauvegardées */}
      {savedSimulations.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '20px' }}>
            Vos simulations sauvegardées
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {savedSimulations.slice(-3).map((sim, index) => (
              <div key={sim.id} style={{ 
                padding: '16px', 
                background: '#f8fafc', 
                borderRadius: '8px', 
                border: '2px solid #e2e8f0' 
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  Simulation {savedSimulations.length - index}
                </h4>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  {sim.date} - {sim.quotiteTravail}%
                </p>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                  {formatCurrency(sim.revenuTotal)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <button onClick={onPrev} className="btn btn-outline">
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Retour aux résultats
        </button>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleExportPDF} className="btn btn-outline">
            <Download size={16} style={{ marginRight: '8px' }} />
            Export PDF
          </button>
          <button onClick={onNext} className="btn btn-primary">
            Voir les conseils
            <ArrowRight size={16} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Scenarios;










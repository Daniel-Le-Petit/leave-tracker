import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  Percent, 
  ArrowRight, 
  Save,
  Download
} from 'lucide-react';

// Enregistrer les composants Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const Resultats = ({ formData, calculations, onNext, onPrev, onSave }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  // Données pour le graphique camembert
  const pieData = {
    labels: ['Salaire partiel', 'Pension progressive'],
    datasets: [
      {
        data: [calculations.salairePartiel, calculations.pensionProgressive],
        backgroundColor: [
          '#2563eb', // Bleu pour salaire partiel
          '#059669', // Vert pour pension progressive
        ],
        borderColor: [
          '#1d4ed8',
          '#047857',
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 14,
            weight: '600'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const handleSave = () => {
    const simulation = {
      ...formData,
      ...calculations,
      timestamp: new Date().toISOString()
    };
    onSave(simulation);
    alert('Simulation sauvegardée !');
  };

  const handleExportPDF = () => {
    // Cette fonctionnalité sera implémentée avec jsPDF
    alert('Export PDF en cours de développement...');
  };

  return (
    <div>
      {/* En-tête des résultats */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <TrendingUp size={48} color="#059669" style={{ marginBottom: '16px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
          Résultats de votre simulation
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Retraite progressive à {formData.quotiteTravail}% pendant {formData.dureeProgressive} an{formData.dureeProgressive > 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Revenu total mensuel */}
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}>
          <Euro size={32} color="#2563eb" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
            Revenu total mensuel
          </h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
            {formatCurrency(calculations.revenuTotal)}
          </div>
          <p style={{ fontSize: '14px', color: '#1e40af' }}>
            Net : {formatCurrency(calculations.revenuNetTotal)}
          </p>
        </div>

        {/* Comparaison avec temps plein */}
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
          <TrendingDown size={32} color="#d97706" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
            Perte par rapport au temps plein
          </h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
            {formatCurrency(calculations.perteBrute)}
          </div>
          <p style={{ fontSize: '14px', color: '#92400e' }}>
            {formatPercent(calculations.pourcentagePerte)} de perte
          </p>
        </div>

        {/* Temps libre gagné */}
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
          <Percent size={32} color="#059669" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
            Temps libre
          </h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#065f46', marginBottom: '4px' }}>
            {100 - formData.quotiteTravail}%
          </div>
          <p style={{ fontSize: '14px', color: '#065f46' }}>
            {Math.round((100 - formData.quotiteTravail) * 1.6)}h par semaine
          </p>
        </div>
      </div>

      {/* Graphique camembert */}
      <div className="chart-container">
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', textAlign: 'center' }}>
          Répartition du revenu mensuel
        </h3>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>

      {/* Détail des calculs */}
      <div className="card">
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '20px' }}>
          Détail des calculs
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          
          {/* Salaire partiel */}
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '2px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#2563eb', marginBottom: '8px' }}>
              Salaire partiel ({formData.quotiteTravail}%)
            </h4>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
              {formatCurrency(calculations.salairePartiel)}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Brut : {formatCurrency(calculations.salairePartiel)}<br/>
              Net : {formatCurrency(calculations.salairePartiel * (formData.salaireNet / formData.salaireBrut))}
            </p>
          </div>

          {/* Pension progressive */}
          <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '2px solid #bbf7d0' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#059669', marginBottom: '8px' }}>
              Pension progressive ({100 - formData.quotiteTravail}%)
            </h4>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#047857', marginBottom: '4px' }}>
              {formatCurrency(calculations.pensionProgressive)}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Montant net (pas d'impôt sur le revenu)
            </p>
          </div>
        </div>

        {/* Impact sur la retraite future */}
        <div className="alert alert-info" style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '8px' }}>⚠️ Impact sur votre retraite future</h4>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
            En prenant une retraite progressive, votre pension définitive sera légèrement réduite car 
            vous cotisez moins pendant cette période. Cependant, vous bénéficiez d'une pension progressive 
            immédiate qui compense partiellement cette perte.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <button onClick={onPrev} className="btn btn-outline">
          ← Retour au formulaire
        </button>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleSave} className="btn btn-secondary">
            <Save size={16} style={{ marginRight: '8px' }} />
            Sauvegarder
          </button>
          <button onClick={handleExportPDF} className="btn btn-outline">
            <Download size={16} style={{ marginRight: '8px' }} />
            Export PDF
          </button>
          <button onClick={onNext} className="btn btn-primary">
            Voir les scénarios
            <ArrowRight size={16} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Resultats;










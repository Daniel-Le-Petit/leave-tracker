import React, { useState } from 'react';
import { Calculator, Euro, Calendar, Percent, Clock, AlertCircle } from 'lucide-react';

const Formulaire = ({ formData, onSubmit }) => {
  const [data, setData] = useState(formData);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!data.age || data.age < 50 || data.age > 70) {
      newErrors.age = 'L\'âge doit être entre 50 et 70 ans';
    }

    if (!data.salaireBrut || data.salaireBrut <= 0) {
      newErrors.salaireBrut = 'Le salaire brut doit être supérieur à 0';
    }

    if (!data.salaireNet || data.salaireNet <= 0) {
      newErrors.salaireNet = 'Le salaire net doit être supérieur à 0';
    }

    if (!data.pensionRetraite || data.pensionRetraite <= 0) {
      newErrors.pensionRetraite = 'La pension retraite doit être supérieure à 0';
    }

    if (data.salaireNet >= data.salaireBrut) {
      newErrors.salaireNet = 'Le salaire net doit être inférieur au salaire brut';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(data);
    }
  };

  const handleInputChange = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="card">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Calculator size={48} color="#2563eb" style={{ marginBottom: '16px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
          Simulateur de Retraite Progressive
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Remplissez les informations ci-dessous pour obtenir une estimation de votre retraite progressive
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Âge actuel */}
          <div className="input-group">
            <label className="input-label">
              <Calendar size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Âge actuel
            </label>
            <input
              type="number"
              className="input-field"
              value={data.age}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || '')}
              placeholder="Ex: 58"
              min="50"
              max="70"
            />
            {errors.age && (
              <div className="alert alert-warning" style={{ marginTop: '8px', padding: '8px 12px' }}>
                <AlertCircle size={16} style={{ marginRight: '8px' }} />
                {errors.age}
              </div>
            )}
          </div>

          {/* Salaire brut actuel */}
          <div className="input-group">
            <label className="input-label">
              <Euro size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Salaire brut mensuel actuel
            </label>
            <input
              type="number"
              className="input-field"
              value={data.salaireBrut}
              onChange={(e) => handleInputChange('salaireBrut', parseFloat(e.target.value) || '')}
              placeholder="Ex: 3500"
              min="0"
              step="50"
            />
            {data.salaireBrut && (
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {formatCurrency(data.salaireBrut)}
              </p>
            )}
            {errors.salaireBrut && (
              <div className="alert alert-warning" style={{ marginTop: '8px', padding: '8px 12px' }}>
                <AlertCircle size={16} style={{ marginRight: '8px' }} />
                {errors.salaireBrut}
              </div>
            )}
          </div>

          {/* Salaire net actuel */}
          <div className="input-group">
            <label className="input-label">
              <Euro size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Salaire net mensuel actuel
            </label>
            <input
              type="number"
              className="input-field"
              value={data.salaireNet}
              onChange={(e) => handleInputChange('salaireNet', parseFloat(e.target.value) || '')}
              placeholder="Ex: 2800"
              min="0"
              step="50"
            />
            {data.salaireNet && (
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {formatCurrency(data.salaireNet)}
              </p>
            )}
            {errors.salaireNet && (
              <div className="alert alert-warning" style={{ marginTop: '8px', padding: '8px 12px' }}>
                <AlertCircle size={16} style={{ marginRight: '8px' }} />
                {errors.salaireNet}
              </div>
            )}
          </div>

          {/* Pension retraite estimée */}
          <div className="input-group">
            <label className="input-label">
              <Euro size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Pension retraite mensuelle estimée
            </label>
            <input
              type="number"
              className="input-field"
              value={data.pensionRetraite}
              onChange={(e) => handleInputChange('pensionRetraite', parseFloat(e.target.value) || '')}
              placeholder="Ex: 1200"
              min="0"
              step="50"
            />
            {data.pensionRetraite && (
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {formatCurrency(data.pensionRetraite)}
              </p>
            )}
            {errors.pensionRetraite && (
              <div className="alert alert-warning" style={{ marginTop: '8px', padding: '8px 12px' }}>
                <AlertCircle size={16} style={{ marginRight: '8px' }} />
                {errors.pensionRetraite}
              </div>
            )}
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              💡 Consultez votre relevé sur <a href="https://info-retraite.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>info-retraite.fr</a>
            </p>
          </div>
        </div>

        {/* Quotité de travail souhaitée */}
        <div className="input-group" style={{ marginTop: '32px' }}>
          <label className="input-label">
            <Percent size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Quotité de travail souhaitée
          </label>
          <div className="slider-container">
            <input
              type="range"
              min="60"
              max="100"
              value={data.quotiteTravail}
              onChange={(e) => handleInputChange('quotiteTravail', parseInt(e.target.value))}
              className="slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>60%</span>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#2563eb' }}>
                {data.quotiteTravail}%
              </span>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>100%</span>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
              Temps partiel : {100 - data.quotiteTravail}% de temps libre
            </p>
          </div>
        </div>

        {/* Durée envisagée */}
        <div className="input-group" style={{ marginTop: '32px' }}>
          <label className="input-label">
            <Clock size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Durée envisagée de la retraite progressive
          </label>
          <div className="slider-container">
            <input
              type="range"
              min="1"
              max="5"
              value={data.dureeProgressive}
              onChange={(e) => handleInputChange('dureeProgressive', parseInt(e.target.value))}
              className="slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>1 an</span>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#2563eb' }}>
                {data.dureeProgressive} an{data.dureeProgressive > 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>5 ans</span>
            </div>
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="alert alert-info" style={{ marginTop: '32px' }}>
          <h4 style={{ marginBottom: '8px' }}>ℹ️ Informations importantes</h4>
          <ul style={{ marginLeft: '20px', fontSize: '14px' }}>
            <li>La retraite progressive est possible à partir de 60 ans (ou 62 ans selon votre génération)</li>
            <li>Vous devez avoir au moins 5 ans d'ancienneté dans votre entreprise</li>
            <li>L'accord de votre employeur est nécessaire</li>
            <li>Cette simulation est indicative et ne remplace pas les conseils d'un expert</li>
          </ul>
        </div>

        {/* Bouton de soumission */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button type="submit" className="btn btn-primary" style={{ fontSize: '18px', padding: '16px 32px' }}>
            <Calculator size={20} style={{ marginRight: '8px' }} />
            Calculer ma simulation
          </button>
        </div>
      </form>
    </div>
  );
};

export default Formulaire;










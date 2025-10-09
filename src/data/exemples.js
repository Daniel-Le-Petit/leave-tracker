// Exemples de données pour le simulateur de retraite progressive

export const exemplesSimulations = [
  {
    id: 1,
    nom: "Marie Dubois - 60%",
    age: 58,
    salaireBrut: 3500,
    salaireNet: 2800,
    pensionRetraite: 1200,
    quotiteTravail: 60,
    dureeProgressive: 3,
    revenuTotal: 2600,
    revenuNetTotal: 2080,
    perteBrute: 900,
    perteNet: 720,
    pourcentagePerte: 25.7,
    date: "15/09/2025"
  },
  {
    id: 2,
    nom: "Jean Martin - 80%",
    age: 61,
    salaireBrut: 4200,
    salaireNet: 3360,
    pensionRetraite: 1500,
    quotiteTravail: 80,
    dureeProgressive: 2,
    revenuTotal: 3360,
    revenuNetTotal: 2688,
    perteBrute: 840,
    perteNet: 672,
    pourcentagePerte: 20.0,
    date: "10/09/2025"
  },
  {
    id: 3,
    nom: "Sophie Leroy - 70%",
    age: 59,
    salaireBrut: 3800,
    salaireNet: 3040,
    pensionRetraite: 1350,
    quotiteTravail: 70,
    dureeProgressive: 4,
    revenuTotal: 3010,
    revenuNetTotal: 2408,
    perteBrute: 790,
    perteNet: 632,
    pourcentagePerte: 20.8,
    date: "08/09/2025"
  }
];

export const conseilsGeneraux = [
  {
    titre: "Préparer sa demande",
    contenu: "Rédigez une lettre de demande claire et argumentée. Préparez un plan de transition pour votre poste et proposez une période d'essai.",
    icone: "📝"
  },
  {
    titre: "Négocier avec l'employeur",
    contenu: "Mettez en avant les bénéfices pour l'entreprise : transmission des compétences, réduction des coûts, maintien de l'expertise.",
    icone: "🤝"
  },
  {
    titre: "Anticiper financièrement",
    contenu: "Établissez un budget détaillé avec votre nouveau revenu. Prévoyez un fonds de sécurité pour les imprévus.",
    icone: "💰"
  },
  {
    titre: "Vérifier sa carrière",
    contenu: "Consultez votre relevé de carrière sur info-retraite.fr et signalez toute erreur avant de faire votre demande.",
    icone: "✅"
  }
];

export const liensUtiles = [
  {
    nom: "Info-retraite.fr",
    url: "https://info-retraite.fr",
    description: "Site officiel pour consulter votre carrière et estimer votre retraite"
  },
  {
    nom: "CARSAT",
    url: "https://www.carsat.fr",
    description: "Caisse d'assurance retraite et de la santé au travail"
  },
  {
    nom: "Agirc-Arrco",
    url: "https://www.agirc-arrco.fr",
    description: "Régime de retraite complémentaire des salariés du privé"
  },
  {
    nom: "Service Public",
    url: "https://www.service-public.fr/particuliers/vosdroits/F1204",
    description: "Informations officielles sur la retraite progressive"
  }
];

export const calculsExemples = {
  salaireBrut: 3500,
  salaireNet: 2800,
  pensionRetraite: 1200,
  quotites: [
    {
      quotite: 60,
      salairePartiel: 2100,
      pensionProgressive: 480,
      revenuTotal: 2580,
      tempsLibre: 40
    },
    {
      quotite: 70,
      salairePartiel: 2450,
      pensionProgressive: 360,
      revenuTotal: 2810,
      tempsLibre: 30
    },
    {
      quotite: 80,
      salairePartiel: 2800,
      pensionProgressive: 240,
      revenuTotal: 3040,
      tempsLibre: 20
    },
    {
      quotite: 90,
      salairePartiel: 3150,
      pensionProgressive: 120,
      revenuTotal: 3270,
      tempsLibre: 10
    },
    {
      quotite: 100,
      salairePartiel: 3500,
      pensionProgressive: 0,
      revenuTotal: 3500,
      tempsLibre: 0
    }
  ]
};










'use client';

import React from 'react';
import { X, Save } from 'lucide-react';

type OverrideMode = 'off' | 'working' | 'clear';

export default function WorkdayOverrideModal(props: {
  isOpen: boolean;
  date: Date | null;
  isDefaultOff: boolean;
  overrideValue: 'off' | 'working' | null;
  onClose: () => void;
  onSave: (mode: OverrideMode) => void;
}) {
  const { isOpen, date, isDefaultOff, overrideValue, onClose, onSave } = props;

  if (!isOpen || !date) return null;

  const dateLabel = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const currentStatus = (() => {
    if (overrideValue === 'off') return 'OFF (exception)';
    if (overrideValue === 'working') return 'Travaillé (exception)';
    return isDefaultOff ? 'OFF (par défaut)' : 'Travaillé (par défaut)';
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Planning de travail</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dateLabel}</h3>
            <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Statut actuel : <span className="font-semibold">{currentStatus}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Fermer"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => onSave('working')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="Forcer ce jour comme travaillé"
          >
            <Save className="h-4 w-4" />
            Marquer comme travaillé
          </button>

          <button
            type="button"
            onClick={() => onSave('off')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 transition-colors"
            title="Forcer ce jour comme OFF"
          >
            <Save className="h-4 w-4" />
            Marquer comme OFF
          </button>

          <button
            type="button"
            onClick={() => onSave('clear')}
            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Supprimer l'exception et revenir au statut par défaut"
          >
            Effacer l’exception (retour par défaut)
          </button>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Note : “par défaut” dépend des 2 jours OFF choisis dans Paramètres.
          </div>
        </div>
      </div>
    </div>
  );
}


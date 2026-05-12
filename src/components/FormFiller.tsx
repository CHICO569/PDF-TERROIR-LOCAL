import React, { useState } from 'react';
import { FileDown, Plus, Trash2 } from 'lucide-react';

export interface FormField {
  id: string;
  type: 'text' | 'checkbox' | 'signature';
  x: number;
  y: number;
  label: string;
  value?: string;
}

interface FormFillerProps {
  formFields: FormField[];
  setFormFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  onExport: (filledFields: FormField[]) => void;
  isExporting: boolean;
}

export const FormFiller: React.FC<FormFillerProps> = ({
  formFields,
  setFormFields,
  onExport,
  isExporting,
}) => {
  const [signatureMode, setSignatureMode] = useState(false);

  // Mettre à jour la valeur d'un champ
  const updateFieldValue = (id: string, value: string) => {
    setFormFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value } : f))
    );
  };

  // Cocher/décocher une case
  const toggleCheckbox = (id: string) => {
    setFormFields((prev) =>
      prev.map((f) =>
        f.id === id && f.type === 'checkbox'
          ? { ...f, value: f.value === 'checked' ? '' : 'checked' }
          : f
      )
    );
  };

  // Ajouter une zone de signature
  const addSignatureField = () => {
    const newField: FormField = {
      id: `sig_${Date.now()}`,
      type: 'signature',
      x: 50,
      y: 90,
      label: 'Signature',
      value: '',
    };
    setFormFields((prev) => [...prev, newField]);
    setSignatureMode(false);
  };

  // Supprimer un champ
  const deleteField = (id: string) => {
    setFormFields((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📝 Remplir le formulaire</h2>
        <div className="flex gap-2">
          <button
            onClick={addSignatureField}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition"
            title="Ajouter une zone de signature"
          >
            <Plus className="w-4 h-4" />
            Signature
          </button>
          <button
            onClick={() => onExport(formFields)}
            disabled={isExporting}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition font-semibold"
          >
            <FileDown className="w-4 h-4" />
            {isExporting ? 'Export en cours...' : 'Exporter PDF'}
          </button>
        </div>
      </div>

      {/* Champs à remplir */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {formFields.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun champ à remplir</p>
        ) : (
          formFields.map((field) => (
            <div key={field.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-gray-700">{field.label}</label>
                <button
                  onClick={() => deleteField(field.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Supprimer ce champ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {field.type === 'text' && (
                <input
                  type="text"
                  value={field.value || ''}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  placeholder={`Remplir ${field.label.toLowerCase()}`}
                  className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}

              {field.type === 'checkbox' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value === 'checked'}
                    onChange={() => toggleCheckbox(field.id)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span className="text-gray-600">{field.label}</span>
                </label>
              )}

              {field.type === 'signature' && (
                <div className="border-2 border-dashed border-purple-300 rounded p-3 bg-purple-50 text-center">
                  <input
                    type="text"
                    value={field.value || ''}
                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                    placeholder="Entrez votre signature ou nom"
                    className="w-full border border-purple-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-purple-600 mt-2">💡 Tapez votre nom ou signature numérique</p>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">Position: {field.x.toFixed(0)}%, {field.y.toFixed(0)}%</div>
            </div>
          ))
        )}
      </div>

      {/* Résumé */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ✅ {formFields.filter((f) => f.value).length} / {formFields.length} champs remplis
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { Trash2, Plus } from 'lucide-react';

interface FieldFiller {
  id: string;
  label: string;
  type: 'text' | 'checkbox' | 'signature';
  value?: string;
}

interface FormFillingPanelProps {
  fields: FieldFiller[];
  onFieldChange: (id: string, value: string) => void;
  onAddSignature: () => void;
  onDeleteField: (id: string) => void;
  onExport: () => void;
}

export const FormFillingPanel: React.FC<FormFillingPanelProps> = ({
  fields,
  onFieldChange,
  onAddSignature,
  onDeleteField,
  onExport,
}) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      <h4 className="text-sm font-bold text-gray-700">Remplir les champs</h4>
      
      <div className="flex-1 overflow-y-auto space-y-2 max-h-64">
        {fields.map((field) => (
          <div key={field.id} className="p-2 bg-gray-50 rounded border border-gray-200">
            <div className="flex justify-between items-start gap-2">
              <label className="text-xs font-semibold text-gray-600 flex-1">{field.label}</label>
              <button
                onClick={() => onDeleteField(field.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            
            {field.type === 'text' && (
              <input
                type="text"
                value={field.value || ''}
                onChange={(e) => onFieldChange(field.id, e.target.value)}
                placeholder={`Entrer ${field.label.toLowerCase()}`}
                className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
            
            {field.type === 'checkbox' && (
              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.value === 'checked'}
                  onChange={(e) => onFieldChange(field.id, e.target.checked ? 'checked' : '')}
                  className="w-3 h-3"
                />
                <span className="text-xs text-gray-600">{field.label}</span>
              </label>
            )}
            
            {field.type === 'signature' && (
              <input
                type="text"
                value={field.value || ''}
                onChange={(e) => onFieldChange(field.id, e.target.value)}
                placeholder="Signature"
                className="w-full mt-1 px-2 py-1 text-xs border border-purple-300 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 italic"
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onAddSignature}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-semibold transition"
        >
          <Plus className="w-3 h-3" />
          Signature
        </button>
        <button
          onClick={onExport}
          className="flex-1 px-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition"
        >
          Exporter PDF
        </button>
      </div>
    </div>
  );
};

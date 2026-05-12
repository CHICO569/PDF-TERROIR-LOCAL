import React, { useState, useRef, useEffect } from 'react';

export interface FormField {
  id: string;
  type: 'text' | 'checkbox';
  x: number; // percentage of width
  y: number; // percentage of height
  label: string;
}

interface FormBuilderProps {
  selectedFile: File | null;
  formFields: FormField[];
  setFormFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  fieldType: 'text' | 'checkbox';
  setFieldType: React.Dispatch<React.SetStateAction<'text' | 'checkbox'>>;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  selectedFile,
  formFields,
  setFormFields,
  fieldType,
  setFieldType,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFile]);

  // Add a new field at default position (10%,10%)
  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldType,
      x: 10,
      y: 10,
      label: fieldType === 'text' ? 'Texte' : 'Case à cocher',
    };
    setFormFields((prev) => [...prev, newField]);
    setError(null);
  };

  // Validation des champs requis
  const validateFields = () => {
    for (const field of formFields) {
      if (field.label.trim() === '') {
        setError('Tous les champs doivent être remplis avant l’export.');
        return false;
      }
    }
    setError(null);
    return true;
  };

  // Update field position based on click within preview container
  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - left;
    const clickY = e.clientY - top;
    const percentX = (clickX / width) * 100;
    const percentY = (clickY / height) * 100;

    // Update last field's position if it exists
    setFormFields((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updated = { ...last, x: percentX, y: percentY };
      return [...prev.slice(0, -1), updated];
    });
  };

  // Update label of a field
  const updateLabel = (id: string, newLabel: string) => {
    setFormFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, label: newLabel } : f))
    );
  };

  // Delete a field
  const deleteField = (id: string) => {
    setFormFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Appel à la validation avant export (à utiliser dans le parent lors de l’export)
  // Exemple : if (!validateFields()) return;

  return (
    <div className="flex gap-6">
      {/* Controls */}
      <div className="w-64 flex flex-col gap-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded text-sm mb-2 border border-red-300">
            {error}
          </div>
        )}
        <h2 className="text-xl font-bold">Créer des champs</h2>
        <div className="flex items-center gap-2">
          <label className="font-medium">Type:</label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as 'text' | 'checkbox')}
            className="border rounded px-2 py-1"
          >
            <option value="text">Texte</option>
            <option value="checkbox">Case à cocher</option>
          </select>
        </div>
        <button
          onClick={addField}
          className="bg-brand-red text-white py-2 rounded hover:bg-brand-red/80 transition"
        >
          Ajouter champ
        </button>
        <h3 className="mt-4 font-semibold">Liste des champs</h3>
        <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {formFields.map((field) => (
            <li key={field.id} className="border p-2 rounded bg-white">
              <div className="flex justify-between items-center">
                <span className="font-medium">{field.type === 'text' ? 'Texte' : 'Checkbox'}</span>
                <button
                  onClick={() => deleteField(field.id)}
                  className="text-rose-600 hover:underline"
                >
                  Supprimer
                </button>
              </div>
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateLabel(field.id, e.target.value)}
                className={`border rounded w-full mt-1 p-1 ${field.label.trim() === '' ? 'border-red-400 bg-red-50' : ''}`}
                placeholder="Libellé (obligatoire)"
              />
              <div className="text-xs text-gray-500 mt-1">
                Position: {field.x.toFixed(1)}% , {field.y.toFixed(1)}%
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* PDF preview */}
      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative flex-1 border rounded overflow-hidden cursor-crosshair"
      >
        {previewUrl ? (
          <object
            data={previewUrl}
            type="application/pdf"
            className="w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Aucun fichier sélectionné
          </div>
        )}
        {/* visual markers for fields */}
        {formFields.map((field) => (
          <div
            key={field.id}
            className={`absolute flex items-center justify-center shadow-lg border-2 ${field.type === 'checkbox' ? 'bg-white border-emerald-500' : 'bg-emerald-100 border-emerald-600'}`}
            style={{
              left: `${field.x}%`,
              top: `${field.y}%`,
              width: field.type === 'checkbox' ? '22px' : '160px',
              height: field.type === 'checkbox' ? '22px' : '28px',
              zIndex: 10,
            }}
          >
            {field.type === 'text' ? (
              <span className="text-xs text-emerald-900 font-semibold w-full text-center truncate px-1" style={{lineHeight: '1.7'}}>{field.label}</span>
            ) : (
              <span className="text-emerald-600 text-lg">&#10003;</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, onClear }) => {
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-zinc-300 rounded-2xl p-12 flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer relative overflow-hidden"
          >
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={onFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <Upload className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-medium text-zinc-900 mb-2">Téléchargez votre PDF</h3>
            <p className="text-zinc-500 text-sm text-center">
              Faites glisser votre fichier ici, ou cliquez pour parcourir.<br/>
              Taille max 20 Mo.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-zinc-200 rounded-2xl p-6 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-xl">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 truncate max-w-[200px]">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-zinc-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo • PDF
                </p>
              </div>
            </div>
            <button
              onClick={onClear}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React from 'react';
import { X, ChevronDown, FileText, Settings, Type, Image as ImageIcon, Layers, Scissors, RotateCcw, Droplets, Trash2, Globe, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSelect: (tool: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onToolSelect }) => {
  const [openCategory, setOpenCategory] = React.useState<string | null>(null);

  const handleLinkClick = (tool: string) => {
    onToolSelect(tool);
    onClose();
  };

  const toggleCategory = (category: string) => {
    setOpenCategory(prev => (prev === category ? null : category));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 bg-white z-50 overflow-y-auto"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-brand-red p-1.5 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">PDF Manager Pro</span>
              </div>
              <button 
                onClick={onClose} 
                id="close-sidebar"
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <NavItem 
                title="Convertisseur PDF" 
                icon={<RotateCcw className="w-4 h-4" />}
                isOpen={openCategory === 'converter'}
                onToggle={() => toggleCategory('converter')}
              >
                <div className="pl-6 pt-2 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Convertir depuis PDF</h4>
                    <ul className="space-y-2 text-sm text-zinc-600">
                      <li onClick={() => handleLinkClick("PDF vers Word")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">PDF vers Word</li>
                      <li onClick={() => handleLinkClick("PDF vers PPTX")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">PDF vers PPTX <span className="text-[10px] text-zinc-400">(à venir)</span></li>
                      <li onClick={() => handleLinkClick("PDF vers Excel")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">PDF vers Excel <span className="text-[10px] text-zinc-400">(à venir)</span></li>
                      <li onClick={() => handleLinkClick("PDF vers JPG")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">PDF vers JPG <span className="text-[10px] text-zinc-400">(à venir)</span></li>
                      <li onClick={() => handleLinkClick("PDF vers PNG")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">PDF vers PNG <span className="text-[10px] text-zinc-400">(à venir)</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Convertir en PDF</h4>
                    <ul className="space-y-2 text-sm text-zinc-600">
                      <li onClick={() => handleLinkClick("Word vers PDF")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Word vers PDF <span className="text-[10px] text-zinc-400">(à venir)</span></li>
                      <li onClick={() => handleLinkClick("Image vers PDF")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Image vers PDF</li>
                      <li className="hover:text-brand-red cursor-pointer font-bold mt-2">Voir tout</li>
                    </ul>
                  </div>
                </div>
              </NavItem>

              <NavItem 
                title="Éditeur PDF" 
                icon={<Settings className="w-4 h-4" />}
                isOpen={openCategory === 'editor'}
                onToggle={() => toggleCategory('editor')}
              >
                <ul className="pl-6 pt-2 space-y-3 text-sm text-zinc-600">
                  <li onClick={() => handleLinkClick("Éditer PDF")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Éditer PDF <span className="text-[10px] text-zinc-400">(à venir)</span></li>
                  <li onClick={() => handleLinkClick("Signer PDF")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Signer PDF</li>
                  <li onClick={() => handleLinkClick("Rotation PDF")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Rotation PDF</li>
                  <li onClick={() => handleLinkClick("Fusionner PDF")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Fusionner PDF</li>
                  <li onClick={() => handleLinkClick("Diviser PDF")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Diviser PDF</li>
                  <li onClick={() => handleLinkClick("Rogner PDF")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Rogner PDF <span className="text-[10px] text-zinc-400">(à venir)</span></li>
                  <li onClick={() => handleLinkClick("Filigrane")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Filigrane</li>
                  <li onClick={() => handleLinkClick("Compresser PDF")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Compresser PDF</li>
                  <li onClick={() => handleLinkClick("Supprimer pages")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Supprimer pages</li>
                  <li onClick={() => handleLinkClick("Scanner texte")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Scanner texte</li>
                  <li onClick={() => handleLinkClick("Protéger PDF")} className="hover:text-brand-red cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-zinc-50">Protéger PDF</li>
                </ul>
              </NavItem>

              <div className="pt-4 mt-4 border-t border-zinc-100">
                <button className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-colors font-medium text-zinc-700">
                  Formulaires
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                </button>
                <button className="w-full text-left p-3 hover:bg-zinc-50 rounded-xl transition-colors font-medium text-zinc-700">
                  Contactez-nous
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

const NavItem = ({ title, icon, children, isOpen, onToggle }: { title: string, icon: React.ReactNode, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) => {
  return (
    <div>
      <button 
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${isOpen ? 'bg-zinc-50 text-brand-red font-bold' : 'hover:bg-zinc-50 text-zinc-700 font-medium'}`}
      >
        <div className="flex items-center gap-3">
          <span className={isOpen ? 'text-brand-red' : 'text-zinc-500'}>{icon}</span>
          {title}
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Accordion } from './components/Accordion';
import { 
  Menu, Check, FileText, Upload, Settings, 
  ChevronRight, Globe, Trash2, MousePointer2, Scissors, 
  Layers, RotateCcw, Droplets, Type, Smartphone, Download, Search, Camera,
  ChevronDown, ChevronUp, Lock, ShieldCheck, CheckCircle2, X, PlusSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState("Éditer PDF");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [signature, setSignature] = useState<{ type: 'draw' | 'type' | 'upload', content: string } | null>(null);
  const [signatureTab, setSignatureTab] = useState<'type' | 'draw'>('type');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature({ type: 'draw', content: canvas.toDataURL() });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignature(null);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  const tabs = ["Éditer PDF", "Convertir depuis PDF", "Convertir en PDF", "Remplir et Signer"];
  
  const allTools = [
    { icon: <MousePointer2 className="text-blue-500" />, title: "Éditer PDF", category: "Éditer PDF" },
    { icon: <Lock className="text-orange-500" />, title: "Protéger PDF", category: "Éditer PDF" },
    { icon: <Type className="text-purple-500" />, title: "Signer PDF", category: "Remplir et Signer" },
    { icon: <Scissors className="text-red-500" />, title: "Compresser PDF", category: "Éditer PDF" },
    { icon: <Droplets className="text-orange-500" />, title: "Filigrane", category: "Éditer PDF" },
    { icon: <RotateCcw className="text-green-500" />, title: "Rotation PDF", category: "Éditer PDF" },
    { icon: <Layers className="text-blue-600" />, title: "Fusionner PDF", category: "Éditer PDF" },
    { icon: <Scissors className="text-indigo-500" />, title: "Diviser PDF", category: "Éditer PDF" },
    { icon: <Trash2 className="text-rose-500" />, title: "Supprimer pages", category: "Éditer PDF" },
    { icon: <FileText className="text-blue-400" />, title: "PDF vers Word", category: "Convertir depuis PDF" },
    { icon: <FileText className="text-orange-400" />, title: "PDF vers Excel", category: "Convertir depuis PDF" },
    { icon: <FileText className="text-red-400" />, title: "PDF vers PPTX", category: "Convertir depuis PDF" },
    { icon: <FileText className="text-yellow-500" />, title: "PDF vers JPG", category: "Convertir depuis PDF" },
    { icon: <FileText className="text-emerald-500" />, title: "PDF vers PNG", category: "Convertir depuis PDF" },
    { icon: <FileText className="text-blue-500" />, title: "Word vers PDF", category: "Convertir en PDF" },
    { icon: <FileText className="text-pink-500" />, title: "Image vers PDF", category: "Convertir en PDF" },
    { icon: <PlusSquare className="text-emerald-500" />, title: "Créer Formulaire", category: "Remplir et Signer" },
    { icon: <Search className="text-indigo-500" />, title: "Scanner texte", category: "Éditer PDF" },
  ];

  const filteredTools = allTools.filter(tool => tool.category === activeTab);

  const [pdfPassword, setPdfPassword] = useState("");
  const [pdfProtected, setPdfProtected] = useState(false);
  const [restrictions, setRestrictions] = useState({ noCopy: true, noPrint: false, noEdit: true, noAnnotate: false });

  const handleToolClick = (toolTitle: string) => {
    setActiveTool(toolTitle);
    setIsSuccess(false);
    setSelectedFile(null);
    setUploadProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [pageCount, setPageCount] = useState(1);
  const [targetPage, setTargetPage] = useState(1);
  const [signaturePos, setSignaturePos] = useState({ x: 50, y: 70 }); // Percentages
  const [deletedPages, setDeletedPages] = useState<number[]>([]);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [splitRange, setSplitRange] = useState("1");
  const [formFields, setFormFields] = useState<{ id: string; type: 'text' | 'checkbox'; x: number; y: number; label: string }[]>([]);
  const [fieldType, setFieldType] = useState<'text' | 'checkbox'>('text');

  const loadTemplate = async (templateName: string) => {
    setActiveTool("Créer Formulaire");
    setIsUploading(true);
    setProcessingStep("Chargement du modèle...");
    setUploadProgress(20);

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { height } = page.getSize();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      if (templateName === "Contrat de Travail") {
  page.drawText("CONTRAT DE TRAVAIL", { x: 50, y: height - 100, size: 24, font: helveticaFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("Lieu et date : ____________________________", { x: 50, y: height - 140, size: 11, font: standardFont });
  page.drawText("\nARTICLE 1 : IDENTIFICATION DES PARTIES", { x: 50, y: height - 170, size: 12, font: helveticaFont });
  page.drawText("L'Employeur : Raison sociale ____________________________", { x: 50, y: height - 200, size: 11, font: standardFont });
  page.drawText("Adresse : ____________________________", { x: 50, y: height - 220, size: 11, font: standardFont });
  page.drawText("\nLe Salarié : Nom ________ Prénom ________ Date de naissance ________", { x: 50, y: height - 250, size: 11, font: standardFont });
  page.drawText("Adresse : ____________________________", { x: 50, y: height - 270, size: 11, font: standardFont });
  page.drawText("\nARTICLE 2 : FONCTION ET QUALIFICATION", { x: 50, y: height - 300, size: 12, font: helveticaFont });
  page.drawText("Intitulé du poste : ____________________________", { x: 50, y: height - 330, size: 11, font: standardFont });
  page.drawText("Qualification : ____________________________", { x: 50, y: height - 350, size: 11, font: standardFont });
  page.drawText("\nARTICLE 3 : DATES ET DURÉE", { x: 50, y: height - 380, size: 12, font: helveticaFont });
  page.drawText("Date de début : ____________________________", { x: 50, y: height - 410, size: 11, font: standardFont });
  page.drawText("Durée du contrat : ____ mois / ____ ans", { x: 50, y: height - 430, size: 11, font: standardFont });
  page.drawText("\nARTICLE 4 : RÉMUNÉRATION", { x: 50, y: height - 460, size: 12, font: helveticaFont });
  page.drawText("Salaire brut mensuel : ______________ EUR", { x: 50, y: height - 490, size: 11, font: standardFont });
  page.drawText("\nSignatures :  Employeur _______________  Salarié _______________", { x: 50, y: height - 550, size: 11, font: standardFont });
} else if (templateName === "Facture") {
  page.drawText("FACTURE", { x: 50, y: height - 60, size: 28, font: helveticaFont, color: rgb(0, 0.2, 0.5) });
  page.drawText("═══════════════════════════════════════════════════════════════════════════════════════════", { x: 50, y: height - 75, size: 10, font: standardFont });
  page.drawText(`Facture N° : _______________  |  Date : ${new Date().toLocaleDateString()}  |  Échéance : ______________`, { x: 50, y: height - 110, size: 10, font: standardFont });
  page.drawText("\n📋 INFORMATIONS FOURNISSEUR", { x: 50, y: height - 140, size: 11, font: helveticaFont });
  page.drawText("Raison sociale : _________________________________  |  SIRET : ________________", { x: 50, y: height - 165, size: 10, font: standardFont });
  page.drawText("Adresse : ________________________________________________", { x: 50, y: height - 185, size: 10, font: standardFont });
  page.drawText("Tél : ___________________________  |  Email : ____________________________", { x: 50, y: height - 205, size: 10, font: standardFont });
  page.drawText("\n👤 FACTURÉ À (CLIENT)", { x: 50, y: height - 240, size: 11, font: helveticaFont });
  page.drawText("Raison sociale : _________________________________  |  SIRET : ________________", { x: 50, y: height - 265, size: 10, font: standardFont });
  page.drawText("Adresse : ________________________________________________", { x: 50, y: height - 285, size: 10, font: standardFont });
  page.drawText("Contact : ___________________________  |  Email : ____________________________", { x: 50, y: height - 305, size: 10, font: standardFont });
  page.drawText("\n📊 DÉTAIL DES SERVICES/ARTICLES", { x: 50, y: height - 335, size: 11, font: helveticaFont });
  page.drawText("───────────────────────────────────────────────────────────────────────────────────────────", { x: 50, y: height - 350, size: 10, font: standardFont });
  page.drawText("Qté  │  Description                              │  Prix Unit. (€)  │  Total (€)", { x: 50, y: height - 370, size: 9.5, font: standardFont });
  page.drawText("───────────────────────────────────────────────────────────────────────────────────────────", { x: 50, y: height - 385, size: 10, font: standardFont });
  page.drawText("___  │  ________________________________________  │  ______________  │  __________", { x: 50, y: height - 405, size: 9, font: standardFont });
  page.drawText("___  │  ________________________________________  │  ______________  │  __________", { x: 50, y: height - 420, size: 9, font: standardFont });
  page.drawText("___  │  ________________________________________  │  ______________  │  __________", { x: 50, y: height - 435, size: 9, font: standardFont });
  page.drawText("───────────────────────────────────────────────────────────────────────────────────────────", { x: 50, y: height - 450, size: 10, font: standardFont });
  page.drawText("                                                         Sous-total HT :  _____________ €", { x: 50, y: height - 470, size: 10, font: standardFont });
  page.drawText("                                                         TVA (20%) :      _____________ €", { x: 50, y: height - 490, size: 10, font: standardFont });
  page.drawText("                                                         TOTAL TTC :      _____________ €", { x: 50, y: height - 510, size: 11, font: helveticaFont, color: rgb(0, 0.2, 0.5) });
  page.drawText("\n💳 MODALITÉS DE PAIEMENT", { x: 50, y: height - 540, size: 11, font: helveticaFont });
  page.drawText("Mode : _________________________  |  Conditions : ____________________________________", { x: 50, y: height - 560, size: 10, font: standardFont });
  page.drawText("Compte bancaire : ___________________________  |  RIB/IBAN : ____________________________", { x: 50, y: height - 580, size: 10, font: standardFont });
} else if (templateName === "CV") {
  page.drawText("CURRICULUM VITAE", { x: 50, y: height - 60, size: 28, font: helveticaFont, color: rgb(0, 0.2, 0.5) });
  page.drawText("═══════════════════════════════════════════════════════════════════════════════════════════", { x: 50, y: height - 75, size: 10, font: standardFont });
  page.drawText("\n👤 INFORMATIONS PERSONNELLES", { x: 50, y: height - 105, size: 12, font: helveticaFont });
  page.drawText("Nom complet : ____________________________  |  Date de naissance : ____________________", { x: 50, y: height - 130, size: 10, font: standardFont });
  page.drawText("Adresse : ________________________________________________", { x: 50, y: height - 150, size: 10, font: standardFont });
  page.drawText("Téléphone : ___________________________  |  Email : ____________________________", { x: 50, y: height - 170, size: 10, font: standardFont });
  page.drawText("\n💼 EXPÉRIENCE PROFESSIONNELLE", { x: 50, y: height - 200, size: 12, font: helveticaFont });
  page.drawText("Poste 1 : ________________________  |  Entreprise : ________________________  |  Depuis : ________", { x: 50, y: height - 225, size: 9.5, font: standardFont });
  page.drawText("Responsabilités : ________________________________________________________________", { x: 70, y: height - 245, size: 9, font: standardFont });
  page.drawText("• ____________________________________________________________________________", { x: 80, y: height - 260, size: 9, font: standardFont });
  page.drawText("\nPoste 2 : ________________________  |  Entreprise : ________________________  |  De : _____ à : _____", { x: 50, y: height - 285, size: 9.5, font: standardFont });
  page.drawText("Responsabilités : ________________________________________________________________", { x: 70, y: height - 305, size: 9, font: standardFont });
  page.drawText("• ____________________________________________________________________________", { x: 80, y: height - 320, size: 9, font: standardFont });
  page.drawText("\n🎓 FORMATION", { x: 50, y: height - 345, size: 12, font: helveticaFont });
  page.drawText("Diplôme 1 : ________________________  |  École : ________________________  |  Année : ________", { x: 50, y: height - 370, size: 10, font: standardFont });
  page.drawText("Diplôme 2 : ________________________  |  École : ________________________  |  Année : ________", { x: 50, y: height - 390, size: 10, font: standardFont });
  page.drawText("\n🏆 COMPÉTENCES", { x: 50, y: height - 415, size: 12, font: helveticaFont });
  page.drawText("Langues : ____________________________  |  Niveau : Débutant ☐  Intermédiaire ☐  Avancé ☐", { x: 50, y: height - 440, size: 10, font: standardFont });
  page.drawText("Informatique : ____________________________  |  Niveau : Débutant ☐  Intermédiaire ☐  Avancé ☐", { x: 50, y: height - 460, size: 10, font: standardFont });
  page.drawText("Autres : ____________________________________________________________________", { x: 50, y: height - 480, size: 10, font: standardFont });
  page.drawText("\n✍️ AUTRES INFORMATIONS", { x: 50, y: height - 505, size: 12, font: helveticaFont });
  page.drawText("Permis de conduire : Oui ☐  Non ☐  |  Disponibilité : ____________________________", { x: 50, y: height - 530, size: 10, font: standardFont });
  page.drawText("Signature : ___________________________  |  Date : ____________________________", { x: 50, y: height - 555, size: 10, font: standardFont });
} else {
  page.drawText(templateName.toUpperCase(), {
    x: 50,
    y: height - 100,
    size: 24,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2),
  });
}

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const file = new File([blob], `${templateName.toLowerCase().replace(/ /g, '_')}.pdf`, { type: 'application/pdf' });
      
      setSelectedFile(file);
      setPageCount(1);
      
      // Prepopulate form fields based on template
      if (templateName === "Contrat de Travail") {
        setFormFields([
          { id: Math.random().toString(), type: 'text', x: 40, y: 16.6, label: "Lieu et date" },
          { id: Math.random().toString(), type: 'text', x: 55, y: 23.7, label: "Raison sociale" },
          { id: Math.random().toString(), type: 'text', x: 40, y: 26.1, label: "Adresse employeur" },
          { id: Math.random().toString(), type: 'text', x: 30, y: 29.7, label: "Nom" },
          { id: Math.random().toString(), type: 'text', x: 50, y: 29.7, label: "Prénom" },
          { id: Math.random().toString(), type: 'text', x: 75, y: 29.7, label: "Naissance" },
          { id: Math.random().toString(), type: 'text', x: 40, y: 32.0, label: "Adresse salarié" },
          { id: Math.random().toString(), type: 'text', x: 45, y: 39.2, label: "Intitulé du poste" },
          { id: Math.random().toString(), type: 'text', x: 45, y: 41.6, label: "Qualification" },
          { id: Math.random().toString(), type: 'text', x: 45, y: 48.7, label: "Date de début" },
          { id: Math.random().toString(), type: 'text', x: 45, y: 51.0, label: "Durée du contrat" },
          { id: Math.random().toString(), type: 'text', x: 50, y: 58.2, label: "Salaire brut" },
        ]);
      } else if (templateName === "Facture") {
        setFormFields([
          { id: Math.random().toString(), type: 'text', x: 30, y: 13.1, label: "Numéro facture" },
          { id: Math.random().toString(), type: 'text', x: 40, y: 19.6, label: "Raison sociale (Frn)" },
          { id: Math.random().toString(), type: 'text', x: 80, y: 19.6, label: "SIRET (Frn)" },
          { id: Math.random().toString(), type: 'text', x: 40, y: 22.0, label: "Adresse (Frn)" },
          { id: Math.random().toString(), type: 'text', x: 40, y: 31.5, label: "Raison sociale (Client)" },
          { id: Math.random().toString(), type: 'text', x: 40, y: 33.8, label: "Adresse (Client)" },
          { id: Math.random().toString(), type: 'text', x: 10, y: 48.1, label: "Qté" },
          { id: Math.random().toString(), type: 'text', x: 30, y: 48.1, label: "Description" },
          { id: Math.random().toString(), type: 'text', x: 65, y: 48.1, label: "Prix Unit." },
          { id: Math.random().toString(), type: 'text', x: 80, y: 48.1, label: "Total Ligne" },
          { id: Math.random().toString(), type: 'text', x: 75, y: 55.8, label: "Sous-total HT" },
          { id: Math.random().toString(), type: 'text', x: 75, y: 58.2, label: "TVA" },
          { id: Math.random().toString(), type: 'text', x: 75, y: 60.5, label: "TOTAL TTC" },
          { id: Math.random().toString(), type: 'text', x: 30, y: 66.5, label: "Mode paiement" },
        ]);
      } else if (templateName === "CV") {
        setFormFields([
          { id: Math.random().toString(), type: 'text', x: 35, y: 15.4, label: "Nom complet" },
          { id: Math.random().toString(), type: 'text', x: 80, y: 15.4, label: "Date de naissance" },
          { id: Math.random().toString(), type: 'text', x: 40, y: 17.8, label: "Adresse" },
          { id: Math.random().toString(), type: 'text', x: 35, y: 20.2, label: "Téléphone" },
          { id: Math.random().toString(), type: 'text', x: 80, y: 20.2, label: "Email" },
          { id: Math.random().toString(), type: 'text', x: 30, y: 26.7, label: "Poste 1" },
          { id: Math.random().toString(), type: 'text', x: 60, y: 26.7, label: "Entreprise 1" },
          { id: Math.random().toString(), type: 'text', x: 50, y: 29.1, label: "Responsabilités 1" },
          { id: Math.random().toString(), type: 'text', x: 30, y: 33.8, label: "Poste 2" },
          { id: Math.random().toString(), type: 'text', x: 60, y: 33.8, label: "Entreprise 2" },
          { id: Math.random().toString(), type: 'text', x: 50, y: 36.2, label: "Responsabilités 2" },
          { id: Math.random().toString(), type: 'text', x: 30, y: 43.9, label: "Diplôme 1" },
          { id: Math.random().toString(), type: 'text', x: 60, y: 43.9, label: "École 1" },
          { id: Math.random().toString(), type: 'text', x: 35, y: 52.3, label: "Langues" },
          { id: Math.random().toString(), type: 'checkbox', x: 56, y: 52.3, label: "Débutant (L)" },
          { id: Math.random().toString(), type: 'checkbox', x: 68, y: 52.3, label: "Intermédiaire (L)" },
          { id: Math.random().toString(), type: 'checkbox', x: 77, y: 52.3, label: "Avancé (L)" },
          { id: Math.random().toString(), type: 'text', x: 35, y: 54.6, label: "Informatique" },
          { id: Math.random().toString(), type: 'checkbox', x: 56, y: 54.6, label: "Débutant (I)" },
          { id: Math.random().toString(), type: 'checkbox', x: 68, y: 54.6, label: "Intermédiaire (I)" },
          { id: Math.random().toString(), type: 'checkbox', x: 77, y: 54.6, label: "Avancé (I)" },
          { id: Math.random().toString(), type: 'text', x: 50, y: 57.0, label: "Autres" },
          { id: Math.random().toString(), type: 'checkbox', x: 32, y: 62.9, label: "Permis Oui" },
          { id: Math.random().toString(), type: 'checkbox', x: 38, y: 62.9, label: "Permis Non" },
          { id: Math.random().toString(), type: 'text', x: 65, y: 62.9, label: "Disponibilité" },
        ]);
      } else {
        // Si aucun champ n'est défini pour ce template, ajouter des champs de test par défaut
        setFormFields([
          { id: Math.random().toString(), type: 'text', x: 20, y: 30, label: 'Champ texte 1' },
          { id: Math.random().toString(), type: 'checkbox', x: 60, y: 50, label: 'Case à cocher' }
        ]);
      }
      
      setTimeout(() => {
        setUploadProgress(100);
        setIsUploading(false);
        setShowWorkspace(true);
      }, 500);
    } catch (err) {
      console.error("Error loading template:", err);
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: FileList | null = null;
    if ('dataTransfer' in e) {
      e.preventDefault();
      files = e.dataTransfer.files;
    } else {
      files = (e as React.ChangeEvent<HTMLInputElement>).target.files;
    }

    if (!files || files.length === 0) return;

    const currentFile = files[0];
    
    // Try to get actual page count if it's a PDF
    if (currentFile.type === 'application/pdf') {
       try {
         const fileArrayBuffer = await currentFile.arrayBuffer();
         const pdfDoc = await PDFDocument.load(fileArrayBuffer);
         setPageCount(pdfDoc.getPageCount());
       } catch (err) {
         console.error("Erreur lors du chargement du PDF:", err);
         setPageCount(1);
       }
    } else {
      setPageCount(files.length > 1 ? files.length : 1);
    }

    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 50 * 1024 * 1024) {
        showError(`Le fichier ${files[i].name} est trop volumineux (max 50 Mo).`);
        return;
      }
    }

    const isMergeTool = activeTool === "Fusionner PDF";
    const isCompressTool = activeTool === "Compresser PDF";

    if ((isMergeTool || isCompressTool) || (showWorkspace && (isMergeTool || isCompressTool))) {
      const validFiles = Array.from(files).filter(f => f.type === 'application/pdf');
      if (validFiles.length === 0) {
        showError("Veuillez sélectionner des fichiers PDF.");
        return;
      }
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setShowWorkspace(true);
      return;
    }
    
    const fileFromSelection = files[0];
    const isImageTool = activeTool?.includes('Image vers PDF');
    const isWordTool = activeTool?.includes('Word vers');
    const isPdftool = !isImageTool && !isWordTool;

    if (isPdftool && fileFromSelection.type !== 'application/pdf') {
      showError("Veuillez sélectionner un fichier PDF.");
      return;
    }
    
    setSelectedFile(fileFromSelection);
    setIsUploading(true);
    setUploadProgress(0);
    setProcessingStep("Analyse du fichier...");

    const isBackendTool = activeTool === "Scanner texte" || activeTool === "PDF vers Word";

    if (isBackendTool) {
      const endpoint = activeTool === "Scanner texte" ? "http://localhost:3001/api/ocr" : "http://localhost:3001/api/convert/pdf-to-word";
      const formData = new FormData();
      formData.append('file', fileFromSelection);

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev > 90) return 90;
          if (prev > 70) setProcessingStep(activeTool === "Scanner texte" ? "Extraction OCR du texte..." : "Conversion du document en cours...");
          else if (prev > 40) setProcessingStep("Envoi au serveur CORBA...");
          else if (prev > 20) setProcessingStep("Analyse des données...");
          return prev + Math.random() * 15;
        });
      }, 300);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        clearInterval(interval);
        if (!response.ok) throw new Error("Erreur de traitement sur le serveur");

        setUploadProgress(100);
        setIsUploading(false);
        setIsSuccess(true);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const extension = ".docx";
        const suffix = activeTool === "Scanner texte" ? "_scanned" : "_converted";
        link.download = fileFromSelection.name.split('.')[0] + suffix + extension;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        clearInterval(interval);
        setIsUploading(false);
        showError("Le serveur backend n'est pas disponible ou une erreur s'est produite.");
      }
      return;
    }

    // Simulate upload and processing steps
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // For interactive tools, show workspace. For others, show success.
          const interactiveTools = ["Signer PDF", "Éditer PDF", "Fusionner PDF", "Supprimer pages", "Rotation PDF", "Diviser PDF", "Compresser PDF", "Protéger PDF", "Créer Formulaire"];
          if (activeTool && interactiveTools.includes(activeTool)) {
            setShowWorkspace(true);
          } else {
            setIsSuccess(true);
          }
          return 100;
        }

        if (prev > 70) setProcessingStep(activeTool === "Scanner texte" ? "Finalisation du document Word..." : "Finalisation...");
        else if (prev > 40) setProcessingStep(activeTool === "Scanner texte" ? "Extraction OCR du texte..." : `Conversion vers ${activeTool?.split(' vers ')[1] || 'Format'}...`);
        else if (prev > 20) setProcessingStep(activeTool === "Scanner texte" ? "Numérisation du document..." : "Extraction des données...");
        
        return prev + Math.random() * 15;
      });
    }, 300);
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...selectedFiles];
    const newPos = direction === 'up' ? index - 1 : index + 1;
    if (newPos < 0 || newPos >= newFiles.length) return;
    [newFiles[index], newFiles[newPos]] = [newFiles[newPos], newFiles[index]];
    setSelectedFiles(newFiles);
  };

    // Simulate download with correct extension based on tool
  const handleDownload = async () => {
    if (!selectedFile) return;
    
    let extension = '.pdf';
    let suffix = 'processed';

    if (activeTool) {
      suffix = activeTool.toLowerCase().replace(/ /g, '_');
      if (activeTool.includes('vers Word')) extension = '.docx';
      else if (activeTool.includes('vers Excel')) extension = '.xlsx';
      else if (activeTool.includes('vers PPTX')) extension = '.pptx';
      else if (activeTool.includes('vers JPG')) extension = '.jpg';
      else if (activeTool.includes('vers PNG')) extension = '.png';
      else if (activeTool.includes('vers PDF')) extension = '.pdf';
    }
      
    if (activeTool === "Scanner texte") {
      extension = '.docx';
      suffix = 'scanned';
    }

    const fileName = selectedFile.name.split('.')[0] + `_${suffix}${extension}`;
    
    // Real PDF processing for specific tools
    try {
      if (activeTool === "Signer PDF" && signature && selectedFile) {
        const fileArrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileArrayBuffer);
        const pages = pdfDoc.getPages();
        const pageIdx = Math.min(targetPage - 1, pages.length - 1);
        const page = pages[pageIdx];
        const { width, height } = page.getSize();
        const sigWidth = 150;
        const sigHeight = 60;
        const x = (signaturePos.x / 100) * width - (sigWidth / 2);
        const y = (1 - (signaturePos.y / 100)) * height - (sigHeight / 2);

        if (signature.type === 'type') {
          const helvetica = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
          page.drawText(signature.content, {
            x: Math.max(0, x),
            y: Math.max(0, y),
            size: 30,
            font: helvetica,
            color: rgb(0.8, 0, 0),
          });
        } else if (signature.type === 'draw') {
          const pngImage = await pdfDoc.embedPng(signature.content);
          page.drawImage(pngImage, {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: sigWidth,
            height: sigHeight,
          });
        }
        const pdfBytes = await pdfDoc.save();
        downloadBlob(pdfBytes, fileName);
        return;
      }

      if (activeTool === "Supprimer pages" && selectedFile) {
        const pdfBytes = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const delPdf = await PDFDocument.create();
        const indices = pdfDoc.getPageIndices().filter(i => !deletedPages.includes(i + 1));
        const copiedPages = await delPdf.copyPages(pdfDoc, indices);
        copiedPages.forEach(p => delPdf.addPage(p));
        const finalPdfBytes = await delPdf.save();
        downloadBlob(finalPdfBytes, fileName);
        return;
      }

      if (activeTool === "Fusionner PDF" && selectedFiles.length > 0) {
        const mergedPdf = await PDFDocument.create();
        for (const file of selectedFiles) {
          const pdfBytes = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        downloadBlob(pdfBytes, fileName);
        return;
      }

      if (activeTool === "Rotation PDF" && selectedFile && Object.keys(pageRotations).length > 0) {
        const pdfBytes = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        Object.entries(pageRotations).forEach(([pageIdxStr, rot]) => {
          const idx = parseInt(pageIdxStr) - 1;
          if (pages[idx]) {
            const currentRotation = pages[idx].getRotation().angle;
            pages[idx].setRotation(degrees((currentRotation + (rot as number)) % 360));
          }
        });
        const finalPdfBytes = await pdfDoc.save();
        downloadBlob(finalPdfBytes, fileName);
        return;
      }

      if (activeTool === "Éditer PDF" && selectedFile) {
        const pdfBytes = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        // Basic "edit" just re-saves for now
        const finalPdfBytes = await pdfDoc.save();
        downloadBlob(finalPdfBytes, fileName);
        return;
      }

      if (activeTool === "Créer Formulaire" && selectedFile) {
        const pdfBytes = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const pages = pdfDoc.getPages();
        const page = pages[targetPage - 1] || pages[0];
        const { width, height } = page.getSize();

        for (let idx = 0; idx < formFields.length; idx++) {
          const field = formFields[idx];
          const x = (field.x / 100) * width;
          const y = (field.y / 100) * height;

          if (field.type === 'text') {
            const textField = form.createTextField(`field_${idx}`);
            const fieldValue = (field as any).value || '';
            textField.setText(fieldValue);
            // x and y from UI are the center of the element.
            // PDF fields are positioned from bottom-left corner.
            textField.addToPage(page, { x: x - 50, y: height - y - 8, width: 100, height: 16 });
          } else if (field.type === 'checkbox') {
            const checkBox = form.createCheckBox(`check_${idx}`);
            if ((field as any).value === 'checked') {
              checkBox.check();
            }
            checkBox.addToPage(page, { x: x - 7.5, y: height - y - 7.5, width: 15, height: 15 });
          } else if (field.type === 'signature') {
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
            const signatureText = (field as any).value || '';
            page.drawText(signatureText, {
              x: x - 40,
              y: height - y - 6,
              size: 18,
              font: helveticaBold,
              color: rgb(0.8, 0, 0),
            });
          }
        }

        const finalPdfBytes = await pdfDoc.save();
        downloadBlob(finalPdfBytes, fileName);
        return;
      }

      if (activeTool === "Diviser PDF" && selectedFile && splitRange) {
        const pdfBytes = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const splitPdf = await PDFDocument.create();
        
        // Parse range: e.g. "1-3, 5"
        const pagesToKeep: number[] = [];
        const parts = splitRange.split(',').map(p => p.trim());
        parts.forEach(part => {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) pagesToKeep.push(i - 1);
            }
          } else {
            const num = Number(part);
            if (!isNaN(num)) pagesToKeep.push(num - 1);
          }
        });

        // Unique and valid indices
        const validIndices = Array.from(new Set(pagesToKeep))
          .filter(idx => idx >= 0 && idx < pdfDoc.getPageCount())
          .sort((a, b) => a - b);

        if (validIndices.length > 0) {
          const copiedPages = await splitPdf.copyPages(pdfDoc, validIndices);
          copiedPages.forEach(p => splitPdf.addPage(p));
          const finalPdfBytes = await splitPdf.save();
          downloadBlob(finalPdfBytes, fileName);
          return;
        }
      }

      if (activeTool === "Compresser PDF" && selectedFiles.length > 0) {
        const mergedPdf = await PDFDocument.create();
        for (const file of selectedFiles) {
          const pdfBytes = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        // Advanced compression simulation using object streams
        const finalPdfBytes = await mergedPdf.save({ useObjectStreams: true });
        downloadBlob(finalPdfBytes, fileName);
        return;
      }

      if (activeTool === "Image vers PDF" && selectedFile) {
        if (selectedFile.type.startsWith('image/')) {
          const pdfDoc = await PDFDocument.create();
          const imgBytes = await selectedFile.arrayBuffer();
          let img;
          if (selectedFile.type === 'image/png') {
            img = await pdfDoc.embedPng(imgBytes);
          } else {
            img = await pdfDoc.embedJpg(imgBytes);
          }
          const page = pdfDoc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          const finalPdfBytes = await pdfDoc.save();
          downloadBlob(finalPdfBytes, fileName);
          return;
        }
      }

      if (activeTool === "Protéger PDF" && selectedFile) {
        setIsProcessing(true);
        setProcessingStep("Sécurisation du PDF...");
        try {
          const inputBytes = new Uint8Array(await selectedFile.arrayBuffer());
          
          // Configurer l'emplacement du WASM avant l'import pour aider MuPDF
          if (!globalThis.$libmupdf_wasm_Module) {
            globalThis.$libmupdf_wasm_Module = {
              locateFile: (path: string) => `https://unpkg.com/mupdf@1.27.0/dist/${path}`
            };
          }

          // Load MuPDF globally from CDN via ES Module import to bypass Vite bundling issues
          const mupdf = await import('https://unpkg.com/mupdf@1.27.0/dist/mupdf.js' as any);
          
          if (!mupdf || !mupdf.Document) {
            throw new Error("Bibliothèque de protection non chargée depuis le CDN.");
          }

          console.log("Opening document for protection...");
          const mupdfDoc = mupdf.Document.openDocument(inputBytes, "application/pdf");
          const pdfDoc = mupdfDoc.asPDF();
          
          if (!pdfDoc) {
            throw new Error("Impossible de traiter ce fichier comme un PDF.");
          }

          // PDF standard permissions bitmask
          // Bits are 1-indexed in PDF spec: 
          // 3: Print (4), 4: Modify (8), 5: Copy (16), 6: Annotate (32)
          let perms = 0xFFFFFFFC; // Par défaut : Tout autorisé
          if (restrictions.noPrint) perms &= ~4;
          if (restrictions.noEdit) perms &= ~8;
          if (restrictions.noCopy) perms &= ~16;
          if (restrictions.noAnnotate) perms &= ~32;
          
          const options = {
            "encrypt": "aes-256",
            "user-password": pdfPassword || "",
            "owner-password": pdfPassword || "owner-" + Math.random().toString(36).substring(7),
            "permissions": perms.toString()
          };

          console.log("Protecting PDF...", options);
          const buffer = pdfDoc.saveToBuffer(options);
          const outputBytes = buffer.asUint8Array();
          
          if (!outputBytes || outputBytes.length < 100) {
            throw new Error("Erreur lors de la génération du fichier protégé.");
          }

          downloadBlob(outputBytes, fileName);
          setPdfProtected(true);
          setIsProcessing(false);
          return;
        } catch (error) {
          console.error("MuPDF Protection Error:", error);
          alert("Erreur de protection : " + (error instanceof Error ? error.message : "Erreur fatale de bibliothèque"));
          setIsProcessing(false);
          return;
        }
      }
    } catch (err) {
      console.error("Erreur lors du traitement PDF:", err);
    }

    const url = URL.createObjectURL(selectedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadBlob = (bytes: Uint8Array, name: string) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetTool = () => {
    setActiveTool(null);
    setSelectedFile(null);
    setSelectedFiles([]);
    setIsUploading(false);
    setIsSuccess(false);
    setShowWorkspace(false);
    setSignature(null);
    setTargetPage(1);
    setDeletedPages([]);
    setPageRotations({});
    setSplitRange("1");
    setPdfPassword("");
    setPdfProtected(false);
    setIsProcessing(false);
    setRestrictions({ noCopy: true, noPrint: false, noEdit: true, noAnnotate: false });
  };

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleGlobalDragEnter = (e: React.DragEvent) => {
    preventDefaults(e);
    setIsDraggingGlobal(true);
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    preventDefaults(e);
    // Only set dragging false if we leave the window
    if (!e.relatedTarget) setIsDraggingGlobal(false);
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    preventDefaults(e);
    setIsDraggingGlobal(false);
    if (!activeTool) setActiveTool("Éditer PDF");
    handleFileSelect(e);
  };

  return (
    <div 
      className="min-h-screen bg-white font-sans text-brand-dark overflow-x-hidden relative"
      onDragEnter={handleGlobalDragEnter}
      onDragOver={preventDefaults}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      <AnimatePresence>
        {isDraggingGlobal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-brand-red/90 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="w-48 h-48 border-4 border-dashed border-white/50 rounded-full flex items-center justify-center mb-8 animate-pulse">
              <Upload className="w-20 h-20 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">Déposez vos fichiers ici</h2>
            <p className="text-white/70 mt-4 text-xl">Lâchez pour commencer le traitement instantané</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[100] bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <div className="bg-rose-500 p-1.5 rounded-lg">
              <X className="w-4 h-4" />
            </div>
            <p className="font-bold text-sm">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onToolSelect={handleToolClick} 
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={resetTool}>
          <div className="bg-brand-red p-1.5 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tighter">Terroir Local PDF</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors active:scale-95"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <main>
        {activeTool ? (
          <section className="bg-brand-cream px-6 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={resetTool}
                className="mb-8 text-zinc-500 hover:text-brand-red transition-colors flex items-center gap-2 mx-auto font-semibold text-sm"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Retour aux outils
              </motion.button>
              
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight"
              >
                {activeTool}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-zinc-500 mb-12"
              >
                Le moyen le plus simple et rapide pour {activeTool.toLowerCase()} vos documents en ligne.
              </motion.p>

              <AnimatePresence mode="wait">
                {!selectedFile ? (
                  <motion.div
                    key="dropzone"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onDragOver={preventDefaults}
                    onDragEnter={preventDefaults}
                    onDrop={handleFileSelect}
                    className="border-4 border-dashed border-zinc-200 rounded-[32px] p-16 bg-white pdf-shadow cursor-pointer hover:border-brand-red/30 transition-all relative group overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept={
                        activeTool === "Scanner texte" ? "image/*, .pdf, .doc, .docx" :
                        activeTool?.includes('Image vers PDF') ? "image/*" :
                        activeTool?.includes('Word vers') ? ".doc,.docx" :
                        ".pdf"
                      }
                      capture={activeTool === "Scanner texte" ? "environment" : undefined}
                      onChange={handleFileSelect} 
                    />
                    <div className="bg-zinc-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      {activeTool === "Scanner texte" ? <Camera className="w-10 h-10 text-brand-red" /> : <Upload className="w-10 h-10 text-brand-red" />}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                       {activeTool === "Scanner texte" ? "Prendre une photo ou importer" : "Choisir un fichier"}
                    </h3>
                    <p className="text-zinc-400">ou glissez-déposez ici</p>
                    <div className="absolute inset-0 bg-brand-red/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ) : isUploading ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-12 rounded-[32px] pdf-shadow"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-brand-red/10 p-3 rounded-xl">
                          <FileText className="w-8 h-8 text-brand-red" />
                        </div>
                        <div className="text-left font-bold">
                          <p className="text-lg truncate max-w-[200px]">{selectedFile.name}</p>
                          <p className="text-sm text-brand-red animate-pulse">{processingStep}</p>
                        </div>
                      </div>
                      <span className="text-3xl font-black text-brand-red">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="progress-bar h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="progress-fill h-full bg-brand-red transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </motion.div>
                ) : showWorkspace && activeTool === "Signer PDF" ? (
                  <motion.div
                    key="sign-workspace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] pdf-shadow overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-zinc-100"
                  >
                    {/* Left Panel: Preview */}
                    <div className="flex-1 bg-zinc-200/50 p-4 md:p-12 flex flex-col items-center gap-8 overflow-y-auto max-h-[70vh] md:max-h-none scroll-smooth" ref={scrollContainerRef}>
                       {Array.from({ length: pageCount }).map((_, i) => {
                        const pageIdx = i + 1;
                        return (
                          <div 
                            key={pageIdx}
                            ref={pageIdx === targetPage ? documentRef : null}
                            className="w-full max-w-lg aspect-[1/1.41] bg-white shadow-2xl rounded-sm p-12 flex flex-col gap-4 relative origin-top shrink-0"
                          >
                             <div className="absolute top-4 left-4 text-[10px] font-black text-zinc-200 uppercase tracking-widest">Page {pageIdx}</div>
                             <div className="h-4 w-3/4 bg-zinc-50 rounded" />
                             <div className="h-4 w-full bg-zinc-50 rounded" />
                             <div className="h-4 w-5/6 bg-zinc-100 rounded" />
                             <div className="h-4 w-full bg-zinc-50 rounded" />
                             <div className="h-4 w-1/3 bg-zinc-100 rounded mb-12" />
                             
                             {pageIdx === targetPage && (
                               <div className="mt-auto h-40 w-full border-2 border-dashed border-brand-red/10 rounded-2xl flex items-center justify-center text-zinc-300 italic text-sm relative group">
                                 {signature && signature.content ? (
                                   <motion.div 
                                     drag
                                     dragConstraints={documentRef}
                                     dragElastic={0}
                                     dragMomentum={false}
                                     onDragEnd={(_, info) => {
                                       if (documentRef.current) {
                                          const rect = documentRef.current.getBoundingClientRect();
                                          // Calculate relative position in percentage
                                          const x = ((info.point.x - rect.left) / rect.width) * 100;
                                          const y = ((info.point.y - rect.top) / rect.height) * 100;
                                          setSignaturePos({ x, y });
                                       }
                                     }}
                                     whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 50 }}
                                     className="absolute cursor-grab p-6 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border-2 border-brand-red/40 z-10 min-w-[200px] text-center flex items-center justify-center translate-x-[-50%] translate-y-[-50%]"
                                     style={{ left: `${signaturePos.x}%`, top: `${signaturePos.y}%` }}
                                   >
                                      {signature.type === 'type' ? (
                                        <span className="text-5xl font-cursive text-brand-dark select-none pointer-events-none">{signature.content}</span>
                                      ) : (
                                        <img src={signature.content} alt="Signature" className="max-h-24 pointer-events-none mx-auto" />
                                      )}
                                     <div className="absolute -top-3 -right-3 bg-brand-red text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                       <MousePointer2 className="w-3 h-3" />
                                     </div>
                                   </motion.div>
                                 ) : (
                                   <div className="flex flex-col items-center gap-3">
                                     <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100">
                                        <Type className="w-6 h-6 text-brand-red opacity-20" />
                                     </div>
                                     <span className="font-bold text-zinc-400">Positionnez votre signature ici</span>
                                   </div>
                                 )}
  
                                 {/* Signature Line Overlay */}
                                 <div className="absolute bottom-10 left-10 right-10 border-t border-zinc-200 flex justify-between pt-2">
                                   <span className="text-[8px] text-zinc-300 font-bold uppercase tracking-widest text-left">Signature du titulaire</span>
                                   <span className="text-[8px] text-zinc-300 font-bold uppercase tracking-widest text-right">Fait à Paris le {new Date().toLocaleDateString()}</span>
                                 </div>
                               </div>
                             )}
  
                             {pageIdx !== targetPage && (
                               <div className="flex-1 flex flex-col gap-4">
                                  <div className="h-4 w-full bg-zinc-50 rounded" />
                                  <div className="h-4 w-5/6 bg-zinc-50 rounded" />
                                  <div className="h-4 w-full bg-zinc-100 rounded" />
                                  <div className="h-4 w-2/3 bg-zinc-50 rounded" />
                               </div>
                             )}
                             
                             <div className="absolute bottom-4 right-12 text-[10px] text-zinc-300 font-bold uppercase tracking-widest">Page {pageIdx} / {pageCount}</div>
                          </div>
                         );
                       })}
                    </div>

                      {/* Right Panel: Tools */}
                      <div className="w-full md:w-96 border-l border-zinc-100 p-8 bg-white flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="bg-brand-red/10 p-2 rounded-lg">
                            <Type className="w-5 h-5 text-brand-red" />
                          </div>
                          <h3 className="text-xl font-bold">Signer le PDF</h3>
                        </div>

                        <div className="mb-6">
                           <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Étape 1 : Choisir la page à signer</h4>
                           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              {Array.from({ length: pageCount }).map((_, i) => {
                                const p = i + 1;
                                return (
                                  <button 
                                    key={p} 
                                    onClick={() => {
                                      setTargetPage(p);
                                      const container = scrollContainerRef.current;
                                      if (container) {
                                        const pageHeight = container.scrollHeight / pageCount;
                                        container.scrollTo({ top: (p - 1) * pageHeight, behavior: 'smooth' });
                                      }
                                    }}
                                    className={`flex-shrink-0 w-14 aspect-[1/1.4] rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden ${p === targetPage ? 'border-brand-red bg-white shadow-md' : 'border-zinc-200 bg-white/50'}`}
                                  >
                                    <span className={`text-[10px] font-bold relative z-10 ${p === targetPage ? 'text-brand-red' : 'text-zinc-400'}`}>{p}</span>
                                    {p === targetPage && <div className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full shadow-sm" />}
                                  </button>
                                );
                              })}
                           </div>
                        </div>
                        
                        <div className="flex-1 space-y-6">
                           <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Étape 2 : Créer votre signature</h4>
                           <div className="flex bg-zinc-100 p-1.5 rounded-2xl">
                          <button 
                            onClick={() => setSignatureTab('type')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${signatureTab === 'type' ? 'bg-white shadow-sm text-brand-dark' : 'text-zinc-500 hover:text-brand-red'}`}
                          >
                            Taper
                          </button>
                          <button 
                            onClick={() => setSignatureTab('draw')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${signatureTab === 'draw' ? 'bg-white shadow-sm text-brand-dark' : 'text-zinc-500 hover:text-brand-red'}`}
                          >
                            Dessiner
                          </button>
                        </div>

                        {signatureTab === 'type' ? (
                          <div className="space-y-4">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Écrivez votre signature</label>
                            <input 
                              type="text" 
                              placeholder="Ex: Jean Terroir"
                              className="w-full py-4 px-5 bg-zinc-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all text-lg font-medium"
                              onChange={(e) => setSignature({ type: 'type', content: e.target.value })}
                            />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tracez votre signature</label>
                              <button onClick={clearCanvas} className="text-[10px] font-bold text-brand-red uppercase underline">Effacer</button>
                            </div>
                            <div className="relative bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl overflow-hidden touch-none h-48">
                              <canvas 
                                ref={canvasRef}
                                width={300}
                                height={180}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="w-full h-full cursor-crosshair"
                              />
                            </div>
                          </div>
                        )}

                        {signature && signature.content && (
                          <div className="p-6 bg-brand-red/5 rounded-2xl border border-brand-red/10 text-center shadow-inner">
                            <p className="text-[10px] font-bold text-brand-red uppercase mb-4 tracking-widest">Aperçu du style</p>
                            <div className="flex items-center justify-center min-h-[60px]">
                              {signature.type === 'type' ? (
                                <span className="text-5xl font-cursive text-brand-dark block py-2">{signature.content}</span>
                              ) : (
                                <img src={signature.content} alt="Signature" className="max-h-20" />
                              )}
                            </div>
                          </div>
                        )}

                        <div className="bg-zinc-50 p-4 rounded-2xl text-[10px] text-zinc-400 leading-relaxed italic border border-zinc-100">
                          "Faites glisser la signature sur le document pour la positionner. Elle sera intégrée techniquement au PDF final."
                        </div>
                      </div>

                      <div className="pt-8 space-y-3">
                        <button 
                          onClick={() => {
                          setIsUploading(true);
                          setProcessingStep("Application de la signature...");
                          setUploadProgress(50);
                          
                          handleDownload().then(() => {
                            setIsUploading(false);
                            setShowWorkspace(false);
                            setIsSuccess(true);
                          }).catch(err => {
                            console.error("Erreur de signature:", err);
                            setIsUploading(false);
                          });
                        }}
                          disabled={!signature || !signature.content}
                          className={`w-full py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-lg ${signature && signature.content ? 'bg-brand-red text-white pdf-shadow hover:scale-[1.02]' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
                        >
                          <Check className="w-6 h-6" />
                          Valider et Signer
                        </button>
                        <button 
                          onClick={resetTool}
                          className="w-full py-3 text-zinc-400 hover:text-brand-red font-bold transition-colors text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : showWorkspace && activeTool === "Créer Formulaire" ? (
                  <motion.div
                    key="form-workspace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] pdf-shadow overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-zinc-100"
                  >
                    {/* Left Panel: Preview */}
                    <div className="flex-1 bg-zinc-200/50 p-4 md:p-12 flex flex-col items-center gap-8 overflow-y-auto max-h-[70vh] md:max-h-none scroll-smooth" ref={scrollContainerRef}>
                       {Array.from({ length: pageCount }).map((_, i) => {
                        const pageIdx = i + 1;
                        return (
                          <div 
                            key={pageIdx}
                            ref={pageIdx === targetPage ? documentRef : null}
                            className="w-full max-w-lg aspect-[1/1.41] bg-white shadow-2xl rounded-sm p-12 flex flex-col gap-4 relative origin-top shrink-0"
                            onDragOver={preventDefaults}
                            onDrop={(e) => {
                              if (pageIdx !== targetPage) return;
                              if (documentRef.current) {
                                const rect = documentRef.current.getBoundingClientRect();
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                setFormFields(prev => [...prev, { id: Math.random().toString(), type: fieldType, x, y, label: fieldType === 'text' ? 'Champ texte' : 'Case à cocher' }]);
                              }
                            }}
                          >
                             <div className="absolute top-4 left-4 text-[10px] font-black text-zinc-200 uppercase tracking-widest">Page {pageIdx}</div>
                             
                             {/* Render Form Fields for this page */}
                             {pageIdx === targetPage && formFields.map((field) => (
                               <motion.div
                                 key={field.id}
                                 drag
                                 dragConstraints={documentRef}
                                 dragElastic={0}
                                 dragMomentum={false}
                                 onDragEnd={(_, info) => {
                                   if (documentRef.current) {
                                      const rect = documentRef.current.getBoundingClientRect();
                                      const x = ((info.point.x - rect.left) / rect.width) * 100;
                                      const y = ((info.point.y - rect.top) / rect.height) * 100;
                                      setFormFields(prev => prev.map(f => f.id === field.id ? { ...f, x, y } : f));
                                   }
                                 }}
                                 className={`absolute cursor-grab active:cursor-grabbing border-2 border-dashed border-brand-red/40 bg-brand-red/5 flex items-center justify-center text-xs font-bold text-brand-red p-2 min-w-[100px] shadow-sm z-10 translate-x-[-50%] translate-y-[-50%]`}
                                 style={{ left: `${field.x}%`, top: `${field.y}%` }}
                               >
                                 {field.type === 'text' ? <Type className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                 {field.label}
                                 <button onClick={() => setFormFields(prev => prev.filter(f => f.id !== field.id))} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                 </button>
                               </motion.div>
                             ))}

                             <div className="absolute bottom-4 right-12 text-[10px] text-zinc-300 font-bold uppercase tracking-widest">Page {pageIdx} / {pageCount}</div>
                          </div>
                         );
                       })}
                    </div>

                    {/* Right Panel: Tools */}
                    <div className="w-full md:w-96 border-l border-zinc-100 p-8 bg-white flex flex-col">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="bg-brand-red/10 p-2 rounded-lg">
                          <PlusSquare className="w-5 h-5 text-brand-red" />
                        </div>
                        <h3 className="text-xl font-bold">Créer Formulaire</h3>
                      </div>

                      <div className="mb-6">
                         <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Étape 1 : Choisir la page</h4>
                         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {Array.from({ length: pageCount }).map((_, i) => {
                              const p = i + 1;
                              return (
                                <button 
                                  key={p} 
                                  onClick={() => {
                                    setTargetPage(p);
                                    const container = scrollContainerRef.current;
                                    if (container) {
                                      const pageHeight = container.scrollHeight / pageCount;
                                      container.scrollTo({ top: (p - 1) * pageHeight, behavior: 'smooth' });
                                    }
                                  }}
                                  className={`flex-shrink-0 w-14 aspect-[1/1.4] rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden ${p === targetPage ? 'border-brand-red bg-white shadow-md' : 'border-zinc-200 bg-white/50'}`}
                                >
                                  <span className={`text-[10px] font-bold relative z-10 ${p === targetPage ? 'text-brand-red' : 'text-zinc-400'}`}>{p}</span>
                                </button>
                              );
                            })}
                         </div>
                      </div>
                      
                      <div className="flex-1 space-y-6">
                         <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Étape 2 : Ajouter des champs</h4>
                         <div className="flex flex-col gap-3">
                           <div 
                             draggable 
                             onDragStart={() => setFieldType('text')}
                             className="p-4 border-2 border-dashed border-zinc-200 bg-zinc-50 rounded-xl flex items-center gap-3 cursor-grab hover:border-brand-red/30 transition-all text-sm font-bold text-zinc-600"
                           >
                             <Type className="w-5 h-5 text-zinc-400" />
                             Champ Texte
                           </div>
                           <div 
                             draggable 
                             onDragStart={() => setFieldType('checkbox')}
                             className="p-4 border-2 border-dashed border-zinc-200 bg-zinc-50 rounded-xl flex items-center gap-3 cursor-grab hover:border-brand-red/30 transition-all text-sm font-bold text-zinc-600"
                           >
                             <CheckCircle2 className="w-5 h-5 text-zinc-400" />
                             Case à cocher
                           </div>
                         </div>
                         <div className="bg-zinc-50 p-4 rounded-2xl text-[10px] text-zinc-400 leading-relaxed italic border border-zinc-100">
                           "Glissez un élément ci-dessus et déposez-le sur la page du PDF pour l'ajouter."
                         </div>
                      </div>

                      <div className="pt-8 space-y-3">
                        <button 
                          onClick={() => {
                          setIsUploading(true);
                          setProcessingStep("Génération du formulaire...");
                          setUploadProgress(50);
                          
                          handleDownload().then(() => {
                            setIsUploading(false);
                            setShowWorkspace(false);
                            setIsSuccess(true);
                          }).catch(err => {
                            console.error("Erreur de génération:", err);
                            setIsUploading(false);
                          });
                        }}
                          className={`w-full py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-lg bg-brand-red text-white pdf-shadow hover:scale-[1.02]`}
                        >
                          <Check className="w-6 h-6" />
                          Générer le PDF
                        </button>
                        <button 
                          onClick={resetTool}
                          className="w-full py-3 text-zinc-400 hover:text-brand-red font-bold transition-colors text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </motion.div>
                 ) : showWorkspace && activeTool === "Éditer PDF" ? (
                   <motion.div
                     key="edit-workspace"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-white rounded-[32px] pdf-shadow p-8 flex flex-col border border-zinc-100 min-h-[500px]"
                   >
                     <div className="flex items-center justify-between mb-8">
                        <div className="text-left">
                          <h2 className="text-2xl font-bold mb-1">Édition Rapide</h2>
                          <p className="text-zinc-500 text-sm italic">Parcourez les pages et finalisez les modifications.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 mb-10 overflow-y-auto p-4 bg-zinc-50 rounded-[32px] border border-zinc-100">
                        {Array.from({ length: pageCount }).map((_, i) => (
                           <div key={i} className="bg-white shadow-sm p-4 rounded-xl flex flex-col gap-2">
                              <div className="h-2 w-full bg-zinc-50 rounded" />
                              <div className="h-2 w-full bg-zinc-100 rounded" />
                              <div className="h-2 w-3/4 bg-zinc-50 rounded" />
                              <div className="mt-auto pt-2 flex justify-between items-center border-t border-zinc-50">
                                 <span className="text-[10px] font-bold text-zinc-300">PAGE {i+1}</span>
                              </div>
                           </div>
                        ))}
                     </div>

                      <button 
                        onClick={() => {
                          setIsUploading(true);
                          setProcessingStep("Enregistrement des modifications...");
                          setUploadProgress(50);
                          
                          handleDownload().then(() => {
                             setIsUploading(false); 
                             setShowWorkspace(false);
                             setIsSuccess(true); 
                          }).catch(err => {
                             console.error("Erreur d'édition:", err);
                             setIsUploading(false);
                          });
                        }}
                       className="w-full bg-brand-red text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg pdf-shadow hover:scale-[1.01] transition-all"
                     >
                       <Check className="w-6 h-6" />
                       Enregistrer et Télécharger
                     </button>
                   </motion.div>
                 ) : showWorkspace && activeTool === "Protéger PDF" ? (
                  <motion.div
                    key="protect-workspace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] pdf-shadow p-8 flex flex-col border border-zinc-100 min-h-[500px]"
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div className="text-left">
                         <h2 className="text-2xl font-bold mb-1 text-orange-600">Protéger le document</h2>
                         <p className="text-zinc-500 text-sm italic">Ajoutez une couche de sécurité à votre fichier PDF.</p>
                       </div>
                       <Lock className="w-10 h-10 text-orange-500 opacity-20" />
                    </div>

                    <div className="flex-1 space-y-8">
                       <div className="bg-orange-50/50 p-8 rounded-[32px] border border-orange-100">
                          <label className="block text-xs font-black text-orange-600 uppercase tracking-widest mb-4">Mot de passe du document</label>
                          <div className="relative">
                             <input 
                               type="password" 
                               value={pdfPassword}
                               onChange={(e) => setPdfPassword(e.target.value)}
                               placeholder="Définir un mot de passe fort..."
                               className="w-full bg-white border-2 border-orange-100 rounded-2xl px-6 py-4 text-xl font-bold focus:border-orange-300 focus:outline-none transition-all shadow-inner"
                             />
                             <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-orange-200 w-6 h-6" />
                          </div>
                          <p className="mt-4 text-[10px] text-orange-400 font-bold uppercase tracking-tight">Ce mot de passe sera requis pour ouvrir le fichier PDF.</p>
                       </div>

                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Choix des restrictions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <button 
                               onClick={() => setRestrictions(prev => ({ ...prev, noCopy: !prev.noCopy }))}
                               className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${restrictions.noCopy ? 'border-orange-500 bg-orange-50' : 'border-zinc-100 bg-white hover:border-orange-200'}`}
                             >
                                <div className={`p-3 rounded-xl ${restrictions.noCopy ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                   <X className="w-5 h-5" />
                                </div>
                                <div>
                                   <h4 className="font-bold text-sm">Interdire la copie</h4>
                                   <p className="text-[10px] text-zinc-400">Extraction de texte/images</p>
                                </div>
                                {restrictions.noCopy && <CheckCircle2 className="ml-auto w-5 h-5 text-orange-500" />}
                             </button>
   
                             <button 
                               onClick={() => setRestrictions(prev => ({ ...prev, noPrint: !prev.noPrint }))}
                               className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${restrictions.noPrint ? 'border-orange-500 bg-orange-50' : 'border-zinc-100 bg-white hover:border-orange-200'}`}
                             >
                                <div className={`p-3 rounded-xl ${restrictions.noPrint ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                   <X className="w-5 h-5" />
                                </div>
                                <div>
                                   <h4 className="font-bold text-sm">Interdire l'impression</h4>
                                   <p className="text-[10px] text-zinc-400">Bloquer l'impression matériel</p>
                                </div>
                                {restrictions.noPrint && <CheckCircle2 className="ml-auto w-5 h-5 text-orange-500" />}
                             </button>
   
                             <button 
                               onClick={() => setRestrictions(prev => ({ ...prev, noEdit: !prev.noEdit }))}
                               className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${restrictions.noEdit ? 'border-orange-500 bg-orange-50' : 'border-zinc-100 bg-white hover:border-orange-200'}`}
                             >
                                <div className={`p-3 rounded-xl ${restrictions.noEdit ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                   <Scissors className="w-5 h-5" />
                                </div>
                                <div>
                                   <h4 className="font-bold text-sm">Interdire l'édition</h4>
                                   <p className="text-[10px] text-zinc-400">Bloquer toute modification</p>
                                </div>
                                {restrictions.noEdit && <CheckCircle2 className="ml-auto w-5 h-5 text-orange-500" />}
                             </button>
   
                             <button 
                               onClick={() => setRestrictions(prev => ({ ...prev, noAnnotate: !prev.noAnnotate }))}
                               className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${restrictions.noAnnotate ? 'border-orange-500 bg-orange-50' : 'border-zinc-100 bg-white hover:border-orange-200'}`}
                             >
                                <div className={`p-3 rounded-xl ${restrictions.noAnnotate ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                   <Type className="w-5 h-5" />
                                </div>
                                <div>
                                   <h4 className="font-bold text-sm">Interdire l'annotation</h4>
                                   <p className="text-[10px] text-zinc-400">Bloquer les commentaires</p>
                                </div>
                                {restrictions.noAnnotate && <CheckCircle2 className="ml-auto w-5 h-5 text-orange-500" />}
                             </button>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={() => {
                        setIsUploading(true);
                        setProcessingStep("Sécurisation du document...");
                        setUploadProgress(50);
                        
                        handleDownload().then(() => {
                           setIsUploading(false); 
                           setShowWorkspace(false);
                           setIsSuccess(true); 
                        }).catch(err => {
                           console.error("Erreur de protection:", err);
                           setIsUploading(false);
                           alert("Une erreur est survenue lors de la protection du PDF.");
                        });
                      }}
                      className="w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg transition-all bg-orange-600 text-white pdf-shadow hover:scale-[1.01] active:scale-95"
                    >
                      <ShieldCheck className="w-6 h-6" />
                      Appliquer la protection
                    </button>
                  </motion.div>
                 ) : showWorkspace && activeTool === "Fusionner PDF" ? (
                  <motion.div
                    key="merge-workspace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] pdf-shadow p-8 flex flex-col border border-zinc-100 min-h-[500px]"
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div className="text-left">
                         <h2 className="text-2xl font-bold mb-1">Fusionner vos PDF</h2>
                         <p className="text-zinc-500 text-sm italic">Ajoutez d'autres fichiers ou réorganisez-les ci-dessous.</p>
                       </div>
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 px-5 py-2.5 rounded-xl font-bold transition-all text-sm"
                       >
                         <Upload className="w-4 h-4" />
                         Ajouter plus
                       </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 flex-1 mb-8 overflow-y-auto p-2">
                       {selectedFiles.map((file, i) => (
                         <div key={i} className="group relative bg-zinc-50 rounded-2xl aspect-[1/1.4] p-4 flex flex-col items-center justify-center gap-4 border border-zinc-100 hover:border-brand-red/30 hover:bg-white transition-all pdf-shadow-sm">
                            <div className="absolute top-2 left-2 w-6 h-6 bg-brand-red text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">{i + 1}</div>
                            
                            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                className="p-1.5 bg-white text-rose-500 rounded-lg shadow-sm hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="flex flex-col bg-white rounded-lg shadow-sm border border-zinc-100 p-0.5 mt-1">
                                <button 
                                  onClick={() => moveFile(i, 'up')}
                                  disabled={i === 0}
                                  className="p-1 text-zinc-400 hover:text-brand-red disabled:opacity-20 transition-colors"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => moveFile(i, 'down')}
                                  disabled={i === selectedFiles.length - 1}
                                  className="p-1 text-zinc-400 hover:text-brand-red disabled:opacity-20 transition-colors"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <FileText className="w-12 h-12 text-zinc-300 group-hover:text-brand-red transition-colors" />
                            <p className="text-[10px] font-bold text-center px-4 truncate w-full text-zinc-500">{file.name}</p>
                         </div>
                       ))}
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-400 hover:border-brand-red/20 hover:text-brand-red transition-all group aspect-[1/1.4]"
                       >
                         <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-bold uppercase tracking-widest italic">Nouveau</span>
                       </button>
                    </div>

                    <button 
                      onClick={() => {
                        setIsUploading(true);
                        setProcessingStep("Fusion des documents...");
                        setUploadProgress(50);
                        
                        handleDownload().then(() => {
                           setIsUploading(false); 
                           setShowWorkspace(false);
                           setIsSuccess(true); 
                        }).catch(err => {
                           console.error("Erreur de fusion:", err);
                           setIsUploading(false);
                        });
                      }}
                      disabled={selectedFiles.length < 2}
                      className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg transition-all ${selectedFiles.length >= 2 ? 'bg-brand-red text-white pdf-shadow hover:scale-[1.01] active:scale-95' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
                    >
                      <Layers className="w-6 h-6" />
                      {selectedFiles.length < 2 ? "Ajoutez au moins 2 fichiers" : "Fusionner maintenant"}
                    </button>
                  </motion.div>
                ) : showWorkspace && activeTool === "Compresser PDF" ? (
                  <motion.div
                    key="compress-workspace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] pdf-shadow p-8 flex flex-col border border-zinc-100 min-h-[500px]"
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div className="text-left">
                         <h2 className="text-2xl font-bold mb-1">Compresser PDF</h2>
                         <p className="text-zinc-500 text-sm italic">Fusionnez et compressez vos fichiers (Minimum 2).</p>
                       </div>
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 px-5 py-2.5 rounded-xl font-bold transition-all text-sm"
                       >
                         <Upload className="w-4 h-4" />
                         Ajouter
                       </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1 mb-8 overflow-y-auto">
                       {selectedFiles.map((file, i) => (
                         <div key={i} className="group relative bg-zinc-50 rounded-2xl aspect-[1/1.4] p-4 flex flex-col items-center justify-center gap-2 border border-zinc-100 hover:border-brand-red/30 transition-all">
                            <FileText className="w-10 h-10 text-zinc-300" />
                            <p className="text-[10px] font-bold text-center truncate w-full">{file.name}</p>
                            <button 
                              onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-2 -right-2 p-1.5 bg-white text-rose-500 rounded-full shadow-md hover:bg-rose-50 transition-colors border border-zinc-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                         </div>
                       ))}
                    </div>

                    <button 
                      onClick={() => {
                        setIsUploading(true);
                        setProcessingStep("Compression optimisée...");
                        setUploadProgress(50);
                        
                        handleDownload().then(() => {
                           setIsUploading(false); 
                           setShowWorkspace(false);
                           setIsSuccess(true); 
                        }).catch(err => {
                           console.error("Erreur de compression:", err);
                           setIsUploading(false);
                        });
                      }}
                      disabled={selectedFiles.length < 2}
                      className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg transition-all ${selectedFiles.length >= 2 ? 'bg-indigo-600 text-white pdf-shadow hover:scale-[1.01] active:scale-95' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
                    >
                      <Scissors className="w-6 h-6" />
                      {selectedFiles.length < 2 ? "Ajoutez au moins 2 fichiers" : "Compresser maintenant"}
                    </button>
                  </motion.div>
                                 ) : showWorkspace && activeTool === "Créer Formulaire" ? (
                  <motion.div
                    key="form-workspace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] pdf-shadow p-8 flex flex-col border border-zinc-100 min-h-[500px]"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                       <div className="text-left">
                         <h2 className="text-2xl font-bold mb-1">Créer un formulaire</h2>
                         <p className="text-zinc-500 text-sm italic">Ajoutez des champs interactifs à remplir sur votre document.</p>
                       </div>
                       <div className="flex bg-zinc-100 p-1 rounded-2xl">
                         <button 
                           onClick={() => setFieldType('text')}
                           className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${fieldType === 'text' ? 'bg-white shadow-md text-brand-red' : 'text-zinc-400 hover:text-zinc-600'}`}
                         >
                           Champ Texte
                         </button>
                         <button 
                           onClick={() => setFieldType('checkbox')}
                           className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${fieldType === 'checkbox' ? 'bg-white shadow-md text-brand-red' : 'text-zinc-400 hover:text-zinc-600'}`}
                         >
                           Case à cocher
                         </button>
                       </div>
                    </div>

                    <div className="flex-1 bg-zinc-50 rounded-[32px] border border-zinc-100 p-4 mb-8 overflow-y-auto relative min-h-[500px] flex justify-center">
                       <div 
                         onClick={(e) => {
                           const rect = e.currentTarget.getBoundingClientRect();
                           const x = ((e.clientX - rect.left) / rect.width) * 100;
                           const y = ((e.clientY - rect.top) / rect.height) * 100;
                           setFormFields([...formFields, { id: Math.random().toString(), type: fieldType, x, y, label: fieldType === 'text' ? 'Nouveau champ' : '' }]);
                         }}
                         className="w-full max-w-xl aspect-[1/1.41] bg-white shadow-2xl rounded-sm p-12 relative cursor-crosshair overflow-hidden group"
                       >
                          <div className="absolute inset-0 bg-zinc-50/50 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-xs font-black text-brand-red/30 tracking-widest uppercase">Cliquez pour ajouter un champ</span>
                          </div>
                          {formFields.map(field => (
                            <div 
                              key={field.id}
                              style={{ left: `${field.x}%`, top: `${field.y}%` }}
                              className="absolute -translate-x-1/2 -translate-y-1/2"
                              onClick={(e) => e.stopPropagation()}
                            >
                               <div className="relative group/field">
                                  {field.type === 'text' ? (
                                    <div className="w-32 h-6 border-2 border-brand-red/30 bg-brand-red/5 rounded flex items-center px-1 text-[8px] italic text-brand-red">Champ texte...</div>
                                  ) : (
                                    <div className="w-4 h-4 border-2 border-brand-red/30 bg-brand-red/5 rounded flex items-center justify-center">
                                       <div className="w-2 h-2 bg-brand-red rounded-sm" />
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => setFormFields(prev => prev.filter(f => f.id !== field.id))}
                                    className="absolute -top-4 -right-4 w-6 h-6 bg-white text-rose-500 rounded-full shadow-lg border border-zinc-100 flex items-center justify-center opacity-0 group-hover/field:opacity-100 transition-opacity hover:bg-rose-50"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <button 
                      onClick={() => {
                        setIsUploading(true);
                        setProcessingStep("Génération du formulaire...");
                        setUploadProgress(50);
                        
                        handleDownload().then(() => {
                           setIsUploading(false); 
                           setShowWorkspace(false);
                           setIsSuccess(true); 
                        }).catch(err => {
                           console.error("Erreur formulaire:", err);
                           setIsUploading(false);
                        });
                      }}
                      className="w-full bg-brand-red text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg pdf-shadow hover:scale-[1.01] transition-all"
                    >
                      <Check className="w-6 h-6" />
                      Générer le PDF remplissable
                    </button>
                  </motion.div>
                ) : showWorkspace && activeTool === "Rotation PDF" ? (
                  <motion.div
                    key="rotation-workspace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] pdf-shadow p-8 flex flex-col border border-zinc-100 min-h-[500px]"
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div className="text-left">
                         <h2 className="text-2xl font-bold mb-1">Rotation des pages</h2>
                         <p className="text-zinc-500 text-sm italic">Cliquez sur une page pour la faire pivoter ou utilisez les boutons globaux.</p>
                       </div>
                       <div className="flex gap-2">
                         <button 
                           onClick={() => {
                             const newRots: Record<number, number> = {};
                             for(let i=1; i<=pageCount; i++) newRots[i] = ((pageRotations[i] || 0) + 90) % 360;
                             setPageRotations(newRots);
                           }}
                           className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-bold transition-all text-xs flex items-center gap-2"
                         >
                           <RotateCcw className="w-4 h-4" />
                           Tout pivoter
                         </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 flex-1 mb-10 overflow-y-auto p-4">
                       {Array.from({ length: pageCount }).map((_, i) => {
                         const p = i + 1;
                         const rotation = pageRotations[p] || 0;
                         return (
                          <div 
                            key={i} 
                            onClick={() => setPageRotations(prev => ({ ...prev, [p]: (rotation + 90) % 360 }))}
                            className="group relative bg-zinc-50 rounded-2xl aspect-[1/1.4] p-4 flex flex-col items-center justify-center gap-3 border border-zinc-100 hover:border-brand-red/30 transition-all cursor-pointer overflow-hidden"
                          >
                             <div className="absolute top-2 left-2 text-[10px] font-black text-zinc-300">PAGE {p}</div>
                             <motion.div 
                                animate={{ rotate: rotation }}
                                className="relative z-10"
                             >
                                <FileText className="w-12 h-12 text-brand-red opacity-20" />
                                <RotateCcw className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-brand-red" />
                             </motion.div>
                             <div className="absolute inset-0 bg-brand-red/0 group-hover:bg-brand-red/5 transition-colors" />
                             <div className="absolute bottom-2 font-bold text-[10px] text-zinc-400">{rotation}°</div>
                          </div>
                         );
                       })}
                    </div>

                    <button 
                      onClick={() => {
                        setIsUploading(true);
                        setProcessingStep("Rotation des pages...");
                        setUploadProgress(50);
                        
                        handleDownload().then(() => {
                           setIsUploading(false); 
                           setShowWorkspace(false);
                           setIsSuccess(true); 
                        }).catch(err => {
                           console.error("Erreur de rotation:", err);
                           setIsUploading(false);
                        });
                      }}
                      className="w-full bg-brand-red text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg pdf-shadow hover:scale-[1.01] transition-all"
                    >
                      <RotateCcw className="w-6 h-6" />
                      Valider la rotation
                    </button>
                  </motion.div>
                ) : showWorkspace && activeTool === "Diviser PDF" ? (
                  <motion.div
                    key="split-workspace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] pdf-shadow p-8 flex flex-col border border-zinc-100 min-h-[500px]"
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div className="text-left">
                         <h2 className="text-2xl font-bold mb-1">Diviser le PDF</h2>
                         <p className="text-zinc-500 text-sm italic">Spécifiez les pages ou la plage de pages à extraire (ex: 1-5, 8, 11-13).</p>
                       </div>
                    </div>

                    <div className="mb-10 p-8 bg-zinc-50 rounded-[32px] border border-zinc-100">
                       <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Plage d'extraction</label>
                       <input 
                         type="text" 
                         value={splitRange}
                         onChange={(e) => setSplitRange(e.target.value)}
                         placeholder="Ex: 1-3 ou 1, 4, 8"
                         className="w-full bg-white border-2 border-zinc-100 rounded-2xl px-6 py-4 text-xl font-bold focus:border-brand-red/30 focus:outline-none transition-all shadow-inner"
                       />
                       <div className="mt-6 flex flex-wrap gap-2">
                          <button onClick={() => setSplitRange("1")} className="px-3 py-1 bg-zinc-200 rounded-lg text-[10px] font-bold hover:bg-zinc-300 transition-colors">PAGE 1 SEULE</button>
                          <button onClick={() => setSplitRange(`1-${pageCount}`)} className="px-3 py-1 bg-zinc-200 rounded-lg text-[10px] font-bold hover:bg-zinc-300 transition-colors">TOUTES LES PAGES ({pageCount})</button>
                       </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 flex-1 mb-10 overflow-y-auto">
                       {Array.from({ length: pageCount }).map((_, i) => {
                         const p = i + 1;
                         const isInRange = splitRange.includes(String(p)); 
                         // Note: Simplistic check for demo, real regex would be better
                         return (
                           <div 
                             key={i} 
                             className={`aspect-[1/1.4] rounded-lg border-2 flex items-center justify-center text-[10px] font-black transition-all ${isInRange ? 'border-brand-red bg-brand-red/5 text-brand-red' : 'border-zinc-100 bg-zinc-50 text-zinc-300'}`}
                           >
                             {p}
                           </div>
                         );
                       })}
                    </div>

                    <button 
                      onClick={() => {
                        setIsUploading(true);
                        setProcessingStep("Extraction des pages...");
                        setUploadProgress(50);
                        
                        handleDownload().then(() => {
                           setIsUploading(false); 
                           setShowWorkspace(false);
                           setIsSuccess(true); 
                        }).catch(err => {
                           console.error("Erreur d'extraction:", err);
                           setIsUploading(false);
                        });
                      }}
                      className="w-full bg-brand-red text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg pdf-shadow hover:scale-[1.01] transition-all"
                    >
                      <Scissors className="w-6 h-6" />
                      Extraire ces pages
                    </button>
                  </motion.div>
                ) : showWorkspace && activeTool === "Supprimer pages" ? (
                  <motion.div
                    key="delete-workspace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] pdf-shadow p-8 flex flex-col border border-zinc-100 min-h-[500px]"
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div className="text-left">
                         <h2 className="text-2xl font-bold mb-1">Supprimer des pages</h2>
                         <p className="text-zinc-500 text-sm italic">Cliquez sur les pages que vous souhaitez retirer du document final.</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 flex-1 mb-10 overflow-y-auto">
                       {Array.from({ length: pageCount }).map((_, i) => {
                         const p = i + 1;
                         const isDeleted = deletedPages.includes(p);
                         return (
                          <div 
                            key={i} 
                            onClick={() => {
                              if (isDeleted) setDeletedPages(prev => prev.filter(pg => pg !== p));
                              else setDeletedPages(prev => [...prev, p]);
                            }}
                            className={`group relative rounded-2xl aspect-[1/1.4] p-4 flex flex-col items-center justify-center gap-3 border transition-all cursor-pointer ${isDeleted ? 'bg-rose-50 border-rose-200' : 'bg-zinc-50 border-zinc-100 hover:border-brand-red/30'}`}
                          >
                             <div className={`absolute top-2 left-2 text-[10px] font-black ${isDeleted ? 'text-rose-400' : 'text-zinc-300'}`}>PAGE {p}</div>
                             <FileText className={`w-8 h-8 ${isDeleted ? 'text-rose-200 line-through' : 'text-zinc-200'}`} />
                             {isDeleted && (
                               <div className="absolute flex items-center justify-center">
                                 <Trash2 className="w-8 h-8 text-rose-500" />
                               </div>
                             )}
                             <div className="absolute inset-0 bg-rose-500/0 hover:bg-rose-500/5 transition-colors rounded-2xl" />
                          </div>
                         );
                       })}
                    </div>

                    <button 
                      onClick={() => {
                        setIsUploading(true);
                        setProcessingStep("Suppression des pages...");
                        setUploadProgress(50);
                        
                        handleDownload().then(() => {
                           setIsUploading(false); 
                           setShowWorkspace(false);
                           setIsSuccess(true); 
                        }).catch(err => {
                           console.error("Erreur de suppression:", err);
                           setIsUploading(false);
                        });
                      }}
                      className="w-full bg-brand-red text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg pdf-shadow hover:scale-[1.01] active:scale-95 transition-all"
                    >
                      <Scissors className="w-6 h-6" />
                      Appliquer les modifications
                    </button>
                  </motion.div>
                ) : isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[32px] pdf-shadow p-12 text-center border border-zinc-100 max-w-2xl mx-auto"
                  >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                       <Check className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Traitement terminé !</h2>
                    <p className="text-zinc-500 mb-10 text-lg">Votre fichier "{selectedFile?.name}" a été traité avec succès.</p>
                    
                    {activeTool === "Signer PDF" && signature && (
                      <div className="mb-10 p-4 bg-zinc-50 rounded-[32px] border border-zinc-100 inline-block relative group">
                        <div className="w-40 md:w-64 aspect-[1/1.41] bg-white shadow-2xl rounded-sm p-6 relative overflow-hidden flex flex-col gap-2">
                          <div className="h-2 w-full bg-zinc-100 rounded" />
                          <div className="h-2 w-3/4 bg-zinc-50 rounded" />
                          <div className="h-2 w-full bg-zinc-100 rounded" />
                          <div className="h-2 w-5/6 bg-zinc-50 rounded" />
                          <div className="mt-auto border-t-2 border-dashed border-zinc-100 pt-4 flex flex-col items-center">
                            <span className="text-[6px] text-zinc-300 font-bold uppercase mb-2">Signature validée</span>
                            {signature.type === 'type' ? (
                              <span className="text-xl md:text-3xl font-cursive text-brand-red animate-in fade-in zoom-in duration-500">{signature.content}</span>
                            ) : (
                              <img src={signature.content} alt="Sign" className="max-h-12 md:max-h-20 animate-in fade-in zoom-in duration-500" />
                            )}
                          </div>
                        </div>
                        <div className="absolute -bottom-3 -right-3 bg-brand-success text-white p-3 rounded-full shadow-xl border-4 border-white">
                          <Check className="w-5 h-5" />
                        </div>
                      </div>
                    )}

                    {activeTool === "Scanner texte" && (
                      <div className="mb-10 p-4 bg-zinc-50 rounded-[32px] border border-zinc-100 inline-block">
                        <div className="w-40 md:w-64 aspect-[1/1.41] bg-white shadow-2xl rounded-sm p-8 flex flex-col gap-3">
                           <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                              <FileText className="w-6 h-6 text-white" />
                           </div>
                           <div className="h-3 w-full bg-zinc-100 rounded" />
                           <div className="h-3 w-5/6 bg-zinc-50 rounded" />
                           <div className="h-3 w-full bg-zinc-100 rounded" />
                           <div className="h-3 w-2/3 bg-zinc-50 rounded" />
                           <div className="mt-auto flex justify-between items-center border-t border-zinc-100 pt-4">
                              <span className="text-[8px] font-bold text-blue-500 uppercase">Document Word (.docx)</span>
                              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm" />
                           </div>
                        </div>
                      </div>
                    )}

                    {activeTool === "Protéger PDF" && (
                      <div className="mb-10 relative">
                        <div className="w-48 aspect-[1/1.41] bg-white shadow-2xl rounded-xl p-6 border border-orange-100 flex flex-col gap-3">
                           <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-2">
                              <Lock className="w-5 h-5 text-white" />
                           </div>
                           <div className="h-2 w-full bg-zinc-50 rounded" />
                           <div className="h-2 w-full bg-zinc-100 rounded" />
                           <div className="h-2 w-3/4 bg-zinc-50 rounded" />
                           
                           <div className="mt-auto pt-4 border-t border-zinc-50 space-y-2 text-left">
                              {restrictions.noCopy && <div className="flex items-center gap-2 text-[8px] font-bold text-orange-500 uppercase"><Lock className="w-2 h-2" /> Pas de copie</div>}
                              {restrictions.noPrint && <div className="flex items-center gap-2 text-[8px] font-bold text-orange-500 uppercase"><Lock className="w-2 h-2" /> Pas d'impression</div>}
                              {restrictions.noEdit && <div className="flex items-center gap-2 text-[8px] font-bold text-orange-500 uppercase"><Lock className="w-2 h-2" /> Pas d'édition</div>}
                              {restrictions.noAnnotate && <div className="flex items-center gap-2 text-[8px] font-bold text-orange-500 uppercase"><Lock className="w-2 h-2" /> Pas d'annotation</div>}
                           </div>
                        </div>
                        <div className="absolute -top-4 -right-4 bg-emerald-500 text-white p-3 rounded-full shadow-lg border-4 border-white animate-bounce">
                           <ShieldCheck className="w-6 h-6" />
                        </div>
                        {pdfProtected && (
                          <div className="absolute -bottom-6 left-0 right-0 text-center">
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Protection appliquée avec succès</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button 
                        onClick={handleDownload}
                        className="w-full sm:w-auto bg-brand-red hover:bg-brand-red/90 text-white font-bold py-5 px-12 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl pdf-shadow active:scale-[0.98]"
                      >
                        <Download className="w-7 h-7" />
                        Télécharger
                      </button>
                      <button 
                        onClick={resetTool}
                        className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold py-5 px-12 rounded-2xl transition-all text-xl"
                      >
                        Nouveau
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </section>
        ) : (
          <>
            {/* Hero Section */}
            <section className="bg-brand-cream px-6 py-16 md:py-24 text-center">
              <div className="max-w-4xl mx-auto">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-6xl font-extrabold mb-8 leading-[1.1] tracking-tight"
                >
                  Votre éditeur PDF tout-en-un <br className="hidden md:block" /> et convertisseur PDF
                </motion.h1>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center gap-4 mb-10 max-w-sm mx-auto text-left"
                >
                  {[
                    "Fonctionne sur tout appareil, partout",
                    "Aucune installation requise",
                    "Sûr, privé et sécurisé",
                    "Préserve la mise en page originale",
                    "Supporte tous les types de fichiers populaires"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 w-full">
                      <div className="bg-brand-red/10 p-1 rounded-full">
                        <Check className="w-3 h-3 text-brand-red stroke-[3]" />
                      </div>
                      <span className="text-zinc-700 font-medium">{text}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative inline-block group"
                >
                  <button 
                    onClick={() => handleToolClick("Éditer PDF")}
                    className="bg-brand-red hover:bg-brand-red/90 text-white font-bold py-5 px-12 rounded-2xl cursor-pointer transition-all flex items-center gap-3 text-lg pdf-shadow active:scale-[0.98]"
                  >
                    <Upload className="w-6 h-6" />
                    Télécharger pour éditer
                  </button>
                  <p className="mt-4 text-zinc-500 text-sm">Téléchargez des documents jusqu'à 100 Mo</p>
                </motion.div>
              </div>
            </section>

            {/* Quick Tools Grid */}
            <section className="px-6 py-20 max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Accès illimité à plus de 50 outils PDF gratuits</h2>
                <p className="text-zinc-500">Des outils rapides, sécurisés et faciles à utiliser pour gérer vos documents en ligne.</p>
              </div>

              <div className="flex justify-center gap-3 mb-10 overflow-x-auto pb-4 scrollbar-hide">
                 {tabs.map((tab, i) => (
                   <button 
                    key={i} 
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap px-6 py-3 rounded-full font-bold transition-all text-sm ${activeTab === tab ? 'bg-brand-red text-white shadow-xl shadow-brand-red/20 translate-y-[-2px]' : 'bg-brand-gray-light text-zinc-600 hover:bg-brand-gray-mid'}`}
                   >
                     {tab}
                   </button>
                 ))}
              </div>

              <motion.div 
                layout
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredTools.map((tool) => (
                    <motion.div
                      key={tool.title}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ToolCard 
                        icon={tool.icon} 
                        title={tool.title} 
                        onClick={() => handleToolClick(tool.title)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>

            {/* Templates Carousel */}
            <section className="px-6 py-24 bg-brand-cream/50 overflow-hidden">
              <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">Faites vos démarches en quelques minutes</h2>
                <p className="text-zinc-500 mb-12 text-lg">Utilisez nos modèles de documents pré-remplis pour gagner du temps.</p>
                
                <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide snap-x px-4">
                  {[
                    { title: "Formulaire W-9", color: "bg-blue-50" },
                    { title: "Contrat de Travail", color: "bg-green-50" },
                    { title: "Facture Standard", color: "bg-purple-50" },
                    { title: "CV Moderne", color: "bg-orange-50" },
                  ].map((template, i) => (
                    <div 
                      key={i} 
                      onClick={() => loadTemplate(template.title)}
                      className="snap-center shrink-0 w-72 bg-white rounded-3xl p-8 pdf-shadow flex flex-col items-center justify-center gap-8 border border-zinc-50 group hover:-translate-y-3 transition-all duration-500 cursor-pointer"
                    >
                      <div className={`w-full aspect-[4/5] ${template.color} rounded-2xl flex items-center justify-center p-6 shadow-inner`}>
                        <FileText className="w-20 h-20 text-zinc-300 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h4 className="font-bold text-xl text-zinc-800">{template.title}</h4>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center gap-2 mb-10">
                  <div className="w-3 h-1.5 rounded-full bg-brand-red transition-all"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
                </div>

                <button 
                  onClick={() => handleToolClick("Créer Formulaire")}
                  className="bg-brand-red text-white font-bold py-4 px-10 rounded-2xl hover:bg-brand-red/90 transition-all pdf-shadow active:scale-95"
                >
                  Voir tous les formulaires
                </button>
              </div>
            </section>
          </>
        )}

        {/* Value Proposition */}
        <section className="px-6 py-24 bg-brand-gray-light">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-center tracking-tight">Pourquoi Terroir Local PDF est différent</h2>
            <div className="space-y-6 mt-16">
              <ValueCard 
                icon={<Settings className="w-7 h-7 text-white" />} 
                title="Plus de 50 outils d'édition PDF gratuits"
                desc="De la compression à la fusion, en passant par l'édition et la signature, nous offrons tout ce dont vous avez besoin en un seul endroit sans frais cachés."
              />
              <ValueCard 
                icon={<Globe className="w-7 h-7 text-white" />} 
                title="Travaillez avec vos PDF en ligne"
                desc="Accédez à nos outils sécurisés depuis n'importe quel appareil, partout dans le monde. Pas besoin d'installer de logiciels lourds."
              />
              <ValueCard 
                icon={<Smartphone className="w-7 h-7 text-white" />} 
                title="Interface intuitive et ergonomique"
                desc="Une conception centrée sur l'utilisateur pour une fluidité totale, que vous soyez sur mobile ou sur ordinateur."
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-6 py-24 max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">Des questions ?</h2>
            <p className="text-zinc-500 italic text-lg">Tout ce que vous devez savoir pour démarrer.</p>
          </div>
          <div className="space-y-4">
            <Accordion 
              question="Qu'est-ce que Terroir Local PDF ?" 
              answer="Terroir Local PDF est une suite d'outils en ligne gratuite et sécurisée conçue pour simplifier la gestion de vos documents PDF : édition, conversion, signature et plus encore."
            />
            <Accordion 
              question="Terroir Local PDF est-il sûr et sécurisé ?" 
              answer="Absolument. La sécurité est notre priorité. Vos fichiers sont chiffrés et automatiquement supprimés de nos serveurs après traitement."
            />
            <Accordion 
              question="Puis-je l'utiliser sur mon téléphone ?" 
              answer="Oui ! Notre plateforme est entièrement responsive et optimisée pour une utilisation fluide sur smartphones et tablettes."
            />
          </div>
        </section>

        <footer className="bg-white py-24 px-6 border-t border-zinc-100">
           <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-12">
             <div className="flex items-center gap-2">
               <div className="bg-brand-red p-2 rounded-xl">
                 <FileText className="w-6 h-6 text-white" />
               </div>
               <span className="font-bold text-2xl tracking-tighter">Terroir Local PDF</span>
             </div>

             <div className="flex flex-wrap justify-center gap-12">
                <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                  <ShieldCheck className="w-10 h-10 text-brand-red" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">SSL Secure</span>
                </div>
                <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                   <Lock className="w-10 h-10 text-brand-red" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">GDPR Compliant</span>
                </div>
                <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                   <CheckCircle2 className="w-10 h-10 text-brand-red" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">Norton Verified</span>
                </div>
             </div>

             <div className="text-zinc-400 text-sm font-medium">
               &copy; 2026 Terroir Local PDF. Tous droits réservés. Propulsé par l'innovation locale.
             </div>
           </div>
        </footer>
      </main>
      {isProcessing && (
        <div className="fixed inset-0 z-[60] bg-zinc-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] p-12 max-w-sm w-full text-center shadow-2xl"
          >
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-8 border-zinc-100 rounded-full" />
              <div className="absolute inset-0 border-8 border-brand-red rounded-full border-t-transparent animate-spin" />
              <ShieldCheck className="absolute inset-0 m-auto w-10 h-10 text-brand-red" />
            </div>
            <h3 className="text-2xl font-black mb-3">{processingStep || "Traitement en cours"}</h3>
            <p className="text-zinc-500 font-medium leading-relaxed">Nous sécurisons votre document avec un chiffrement AES 256-bit...</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const ToolCard = ({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className="bg-white border border-zinc-200/60 rounded-3xl p-6 hover:border-brand-red/40 hover:shadow-2xl hover:shadow-brand-red/5 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center gap-4 active:scale-[0.97]"
  >
    <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm border border-zinc-100/50 group-hover:bg-white">
      {icon}
    </div>
    <span className="font-bold text-[15px] tracking-tight text-zinc-800">{title}</span>
  </div>
);

const ValueCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex flex-col md:flex-row gap-6 p-8 bg-white rounded-[32px] border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
    <div className="w-14 h-14 shrink-0 bg-brand-red rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-red/30 group-hover:rotate-6 transition-transform duration-500">
      {icon}
    </div>
    <div>
      <h3 className="text-2xl font-extrabold mb-3 tracking-tight text-zinc-900">{title}</h3>
      <p className="text-zinc-500 text-base leading-relaxed font-medium">{desc}</p>
    </div>
  </div>
);

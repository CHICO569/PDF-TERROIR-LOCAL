# Vérification CORBA/IDL Configuration

## Vue d'ensemble

Le système utilise **CORBA (Common Object Request Broker Architecture)** avec **omniORB** pour gérer les services de conversion PDF.

### Architecture CORBA

```
┌─────────────────────────────────────────────────────────┐
│                  API Gateway Flask                      │
│              (port 3001 - api_gateway.py)              │
│                                                         │
│  - Reçoit les requêtes HTTP du frontend               │
│  - Communique avec le service CORBA                    │
│  - Retourne les résultats en HTTP                      │
└─────────────────────────────────────────────────────────┘
                          ↓
            CORBA NameService (port 2809)
                 (omniNames server)
                          ↓
┌─────────────────────────────────────────────────────────┐
│           CORBA Conversion Server                       │
│              (corba_server.py)                          │
│                                                         │
│  - Implémente l'interface Conversion (IDL)             │
│  - Traite les fichiers PDF                             │
│  - Retourne les résultats au client CORBA              │
└─────────────────────────────────────────────────────────┘
```

## Fichiers clés

### 1. IDL Definition - `backend/idl/ConversionService.idl`
- Définit l'interface CORBA `Conversion`
- Définit les structs: `ProtectionOptions`, `RotationEntry`, `FormField`, `SignatureData`
- Spécifie les méthodes: `protectPdf`, `convertPdfToWord`, `mergePdfs`, etc.

### 2. Stubs CORBA générés
Généré par `omniidl -bpython`:
- `backend/ConversionService_idl.py` - Stubs client/serveur
- `backend/pdfservice/__init__.py` - Module interface (client)
- `backend/pdfservice__POA/__init__.py` - Module POA (serveur)

### 3. Serveur CORBA - `backend/corba_server.py`
- Implémente `ConversionImpl` héritant de `pdfservice__POA.Conversion`
- Enregistre le service auprès du NameService
- Traite les requêtes CORBA

### 4. Passerelle API - `backend/api_gateway.py`
- Flask server exposant les endpoints HTTP
- Récupère le service CORBA via `get_conversion_service()`
- Convertit les requêtes HTTP en appels CORBA

## Flux de traitement - Exemple: Protection PDF

```
1. Frontend (JavaScript)
   └─> POST /api/pdf/protect + fichier PDF + options

2. API Gateway (Flask)
   ├─> Récupère le fichier
   ├─> Crée ProtectionOptions CORBA
   └─> Appelle service.protectPdf()

3. CORBA Client (omniORB)
   └─> Envoie la requête au NameService
   └─> Localise le service ConversionService

4. CORBA Server
   ├─> Reçoit l'appel CORBA
   ├─> Exécute protectPdf() dans ConversionImpl
   ├─> Encrypte le PDF avec pypdf
   └─> Retourne le PDF protégé

5. API Gateway
   └─> Retourne le fichier au client HTTP

6. Frontend
   └─> Affiche "Protection appliquée avec succès"
```

## Vérifications effectuées

✅ **Backend/Dockerfile**
- Installe omniORB et omniORBpy
- Compile les stubs IDL au démarrage
- Configure le Python path

✅ **Backend/start.sh**
- Compile les stubs avec `omniidl -bpython -C/app`
- Démarre omniNames sur le port 2809
- Démarre le serveur CORBA
- Démarre l'API Gateway Flask

✅ **Modules pdfservice et pdfservice__POA**
- Gestion des imports avec error handling
- Ajout automatique du répertoire parent au sys.path
- Logging des erreurs d'import

✅ **ConversionImpl**
- Hérite correctement de `pdfservice__POA.Conversion`
- Implémente toutes les méthodes de l'interface IDL
- Gestion des erreurs avec logging

✅ **API Gateway**
- Récupère le service CORBA correctement
- Crée les structs CORBA (ProtectionOptions, etc.)
- Logging détaillé pour le debug

✅ **Frontend**
- Affiche le message de succès après protection PDF
- Timeout après 3 secondes

## Test de configuration

Exécuter le script de test:
```bash
cd backend
python3 test_corba_setup.py
```

Cela vérifiera:
- ✓ Version Python
- ✓ Installation d'omniORB
- ✓ Module CosNaming
- ✓ Stubs ConversionService_idl
- ✓ Module pdfservice
- ✓ Module pdfservice__POA
- ✓ Interface Conversion
- ✓ POA Conversion
- ✓ Struct ProtectionOptions
- ✓ Dépendances Python

## Dépannage

### Erreur: "Failed to connect to CORBA service"
- Vérifier que omniNames est en cours d'exécution sur le port 2809
- Vérifier les logs du backend pour "Successfully bound to NameService"

### Erreur: "Could not import ConversionService_idl"
- Vérifier que les stubs ont été générés: `ls backend/ConversionService_idl.py`
- Vérifier que omniidl est installé: `omniidl --version`

### Erreur: "Protection failed on backend"
- Vérifier les logs du serveur CORBA pour le message d'erreur
- Vérifier que pypdf est installé: `pip show pypdf`

### Erreur: "CORBA backend not available (503)"
- Le serveur n'a pas enregistré le service auprès du NameService
- Redémarrer le backend: `docker-compose down && docker-compose up --build`

## Configuration déployée

✅ **Netlify**: Frontend React déployé
✅ **GitHub**: Code source synchronisé
✅ **Docker**: Backend CORBA configuré
✅ **omniORB**: Serveurs CORBA en place

## Prochaines étapes

1. ✓ Vérifier la configuration CORBA avec `test_corba_setup.py`
2. ✓ Redémarrer le backend: `docker-compose up --build`
3. ✓ Vérifier les logs pour confirmer:
   - omniNames démarre sur le port 2809
   - Serveur CORBA enregistre le service
   - API Gateway se connecte au service CORBA
4. ✓ Tester la protection PDF via le frontend

---

**Dernière mise à jour**: 24 mai 2026
**Configuration vérifiée**: ✓ CORBA + omniORB + omniORBpy

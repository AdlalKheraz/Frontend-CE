# ChronoExplorer

ChronoExplorer est une application Angular interactive dédiée à l'exploration de l'histoire et des civilisations à travers le temps. Cette application permet aux utilisateurs de découvrir des événements historiques, de gérer leurs favoris et aux administrateurs de créer et gérer du contenu éducatif.

## 🚀 Fonctionnalités principales

- **Exploration historique** : Parcourez les événements et civilisations historiques
- **Système de favoris** : Sauvegardez vos événements et civilisations préférés avec statistiques détaillées
- **Interface d'administration** : Créez et gérez des événements avec support multimédia
- **Gestion des médias** : Upload d'images, vidéos et intégration YouTube
- **Interface responsive** : Design adaptatif pour tous les appareils

## 📋 Prérequis

Avant d'installer le projet, assurez-vous d'avoir :

- [Bun](https://bun.sh/) version 1.0 ou supérieure
- [Node.js](https://nodejs.org/) version 18 ou supérieure (pour la compatibilité)
- [Git](https://git-scm.com/) pour le contrôle de version

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone <url-du-repository>
cd "Chrono Explorer/chrono_explorer"
```

### 2. Installer les dépendances avec Bun

```bash
bun install
```

Cette commande utilise le fichier `bun.lock` pour installer exactement les mêmes versions des dépendances.

### 3. Configuration (optionnelle)

Si nécessaire, configurez les variables d'environnement ou les fichiers de configuration selon votre backend.

## 🚀 Lancement du projet

### Serveur de développement

Pour démarrer le serveur de développement avec Bun :

```bash
bun run start
# ou
bun run dev
```

L'application sera accessible sur `http://localhost:4200/`. Les modifications du code source rechargent automatiquement l'application.

### Serveur de développement avec proxy

Si vous utilisez un backend local, utilisez la configuration proxy :

```bash
bun run start -- --proxy-config proxy.conf.json
```

## 🏗️ Scripts disponibles

### Développement
```bash
bun run start          # Démarre le serveur de développement
bun run dev            # Alias pour start
bun run serve          # Serveur de développement alternatif
```

### Construction
```bash
bun run build          # Build de production optimisé
bun run build:prod     # Build de production avec optimisations avancées
```

### Tests
```bash
bun run test           # Tests unitaires avec Karma
bun run test:watch     # Tests en mode surveillance
bun run e2e            # Tests end-to-end
```

### Qualité du code
```bash
bun run lint           # Vérification du code avec ESLint
bun run lint:fix       # Correction automatique des erreurs de linting
```

## 📁 Structure du projet

```
chrono_explorer/
├── src/
│   ├── app/
│   │   ├── Home/
│   │   │   └── Favorites/           # Gestion des favoris utilisateur
│   │   ├── admin/
│   │   │   └── NewEvent/            # Interface de création d'événements
│   │   └── core/
│   │       └── services/            # Services Angular (MediaService, etc.)
│   ├── assets/                      # Ressources statiques
│   └── environments/                # Configuration d'environnement
├── public/                          # Fichiers publics et images
├── .angular/                        # Cache Angular CLI
└── configuration files...
```

## 🎯 Fonctionnalités détaillées

### Système de Favoris
Le composant [`Favorites`](src/app/Home/Favorites/Favorites.component.html) offre :
- Affichage du nombre total de favoris
- Statistiques par civilisation
- Filtres rapides par type de civilisation
- Interface intuitive de gestion

### Interface d'Administration
Le composant [`NewEvent`](src/app/admin/NewEvent/NewEvent.component.ts) permet :
- Création d'événements historiques en plusieurs étapes
- Upload de médias multiples (images, vidéos)
- Intégration YouTube avec URLs sécurisées
- Gestion des civilisations (création et sélection)
- Validation de formulaires avancée

### Service de Médias
Le [`MediaService`](src/app/core/services/media.service.ts) gère :
- Upload de fichiers multiples
- Gestion des types de médias (IMAGE, VIDEO)
- Association des médias aux événements

## 🔧 Configuration avancée

### Proxy pour le développement
Le fichier `proxy.conf.json` configure le proxy pour les appels API backend :

```json
{
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": true,
    "changeOrigin": true
  }
}
```

### Variables d'environnement
Configurez vos environnements dans `src/environments/` :
- `environment.ts` : Développement
- `environment.prod.ts` : Production

## 🚀 Déploiement

### Build de production avec Bun
```bash
bun run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`.

### Serveur de production
```bash
bun run start:prod
```

## 🛠️ Technologies utilisées

- **Framework** : Angular 19.2.12
- **Runtime** : Bun (gestionnaire de paquets et runtime)
- **Styling** : SCSS + PostCSS
- **Formulaires** : Angular Reactive Forms
- **Tests** : Karma + Jasmine
- **Build** : Angular CLI + Bun

## 📝 Bonnes pratiques

### Composants
- Utilisation de `standalone: true` pour les composants
- `ChangeDetectionStrategy.OnPush` pour les performances
- Imports spécifiques (`CommonModule`, `ReactiveFormsModule`)

### Services
- Injection de dépendances avec `providedIn: 'root'`
- Gestion d'erreurs avec try/catch
- Observables pour les opérations asynchrones

### Gestion d'état
- FormGroups pour les formulaires complexes
- Services pour partager les données entre composants
- Gestion des états de chargement et d'erreur

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de dépendances**
   ```bash
   rm -rf node_modules bun.lock
   bun install
   ```

2. **Port déjà utilisé**
   ```bash
   bun run start -- --port 4201
   ```

3. **Erreurs de build**
   ```bash
   bun run lint:fix
   bun run build
   ```

## 📚 Ressources supplémentaires

- [Documentation Angular](https://angular.dev)
- [Guide Bun](https://bun.sh/docs)
- [Angular CLI Reference](https://angular.dev/tools/cli)
- [Design System du projet](DESIGN_SYSTEM.md)

## 🤝 Contribution

1. Forkez le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Pushez la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).

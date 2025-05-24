# Système de Design - Frontend CE

## 🎨 Palette de Couleurs Harmonisée

Ce document décrit le système de couleurs harmonisé mis en place pour assurer une cohérence visuelle dans toute l'application.

### Couleurs Principales

#### Primary (Indigo)
- **Usage** : Boutons principaux, liens, éléments interactifs primaires
- **Variables** : `--primary-50` à `--primary-950`
- **Sémantique** : `--app-primary`, `--app-primary-hover`, `--app-primary-light`

```css
/* Exemples d'utilisation */
.btn-primary { background-color: var(--app-primary); }
.text-primary { color: var(--app-primary); }
.border-primary { border-color: var(--app-primary); }
```

#### Secondary (Violet/Pourpre)
- **Usage** : Éléments secondaires, accents, badges
- **Variables** : `--secondary-50` à `--secondary-950`
- **Sémantique** : `--app-secondary`, `--app-secondary-hover`

#### Accent (Cyan/Teal)
- **Usage** : Highlights, notifications, éléments d'attention
- **Variables** : `--accent-50` à `--accent-950`
- **Sémantique** : `--app-accent`, `--app-accent-hover`

### Couleurs de Statut

#### Success (Vert)
- **Usage** : Messages de succès, validations, états positifs
- **Variable principale** : `--app-success`

#### Warning (Orange)
- **Usage** : Avertissements, états d'attention
- **Variable principale** : `--app-warning`

#### Error (Rouge)
- **Usage** : Erreurs, suppressions, états négatifs
- **Variable principale** : `--app-error`

### Couleurs Neutres

#### Texte
- `--text-primary` : Texte principal (très sombre)
- `--text-secondary` : Texte secondaire (moyen)
- `--text-muted` : Texte atténué (clair)
- `--text-light` : Texte très clair (placeholders)
- `--text-inverse` : Texte inversé (blanc sur fond sombre)

#### Fonds
- `--bg-primary` : Fond principal (très clair)
- `--bg-secondary` : Fond secondaire (clair)
- `--bg-tertiary` : Fond tertiaire (moyen)
- `--bg-inverse` : Fond inversé (très sombre)

#### Surfaces Sombres (pour overlays, modals)
- `--surface-dark-primary` : Surface sombre principale
- `--surface-dark-secondary` : Surface sombre secondaire
- `--surface-dark-tertiary` : Surface sombre tertiaire

#### Bordures
- `--border-light` : Bordures claires
- `--border-medium` : Bordures moyennes
- `--border-dark` : Bordures sombres
- `--border-inverse` : Bordures inversées (pour fonds sombres)

## 🌟 Ombres Harmonisées

### Ombres Standard
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Ombres Colorées
```css
--shadow-primary: 0 4px 14px 0 rgba(99, 102, 241, 0.25);
--shadow-secondary: 0 4px 14px 0 rgba(168, 85, 247, 0.25);
--shadow-accent: 0 4px 14px 0 rgba(6, 182, 212, 0.25);
--shadow-success: 0 4px 14px 0 rgba(34, 197, 94, 0.25);
--shadow-warning: 0 4px 14px 0 rgba(245, 158, 11, 0.25);
--shadow-error: 0 4px 14px 0 rgba(239, 68, 68, 0.25);
```

## 📐 Rayons de Bordure

```css
--radius-xs: 0.25rem;    /* 4px */
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-3xl: 2rem;      /* 32px */
--radius-full: 9999px;   /* Cercle parfait */
```

## ⚡ Transitions

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: 600ms cubic-bezier(0.16, 1, 0.3, 1);
```

## 📏 Espacements

```css
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
--space-3xl: 4rem;     /* 64px */
```

## 🔢 Z-Index Scale

```css
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
--z-toast: 1080;
```

## 🎯 Classes Utilitaires

### Couleurs de Texte
```css
.text-primary    /* Couleur primaire */
.text-secondary  /* Couleur secondaire */
.text-accent     /* Couleur d'accent */
.text-success    /* Couleur de succès */
.text-warning    /* Couleur d'avertissement */
.text-error      /* Couleur d'erreur */
.text-muted      /* Texte atténué */
```

### Couleurs de Fond
```css
.bg-primary         /* Fond primaire */
.bg-primary-light   /* Fond primaire clair */
.bg-secondary       /* Fond secondaire */
.bg-secondary-light /* Fond secondaire clair */
.bg-accent          /* Fond d'accent */
.bg-accent-light    /* Fond d'accent clair */
```

### Ombres
```css
.shadow-primary    /* Ombre colorée primaire */
.shadow-secondary  /* Ombre colorée secondaire */
.shadow-accent     /* Ombre colorée d'accent */
.shadow-success    /* Ombre colorée de succès */
.shadow-warning    /* Ombre colorée d'avertissement */
.shadow-error      /* Ombre colorée d'erreur */
```

### Transitions
```css
.transition-fast    /* Transition rapide */
.transition-normal  /* Transition normale */
.transition-slow    /* Transition lente */
.transition-bounce  /* Transition avec rebond */
```

## 🧩 Composants Harmonisés

### Boutons
```html
<button class="btn btn-primary">Bouton Principal</button>
<button class="btn btn-secondary">Bouton Secondaire</button>
<button class="btn btn-accent">Bouton d'Accent</button>
<button class="btn btn-outline">Bouton Contour</button>
<button class="btn btn-ghost">Bouton Fantôme</button>
```

### Inputs
```html
<input class="input" type="text" placeholder="Texte...">
<input class="input input-error" type="text" placeholder="Avec erreur...">
```

### Cartes
```html
<div class="card">
  <div class="card-header">En-tête</div>
  <div class="card-body">Contenu</div>
  <div class="card-footer">Pied de page</div>
</div>
```

## 🎬 Animations

### Classes d'Animation
```css
.animate-fade-in     /* Apparition en fondu */
.animate-slide-up    /* Glissement vers le haut */
.animate-slide-down  /* Glissement vers le bas */
.animate-scale-in    /* Agrandissement */
```

## 📱 Responsive Design

Le système de couleurs est entièrement responsive et s'adapte automatiquement aux différentes tailles d'écran grâce aux variables CSS.

## 🔧 Migration

Pour migrer un composant existant vers le nouveau système :

1. **Remplacer les couleurs hardcodées** par les variables CSS appropriées
2. **Utiliser les classes utilitaires** quand c'est possible
3. **Appliquer les transitions harmonisées** pour la cohérence
4. **Utiliser les rayons de bordure standardisés**
5. **Appliquer les ombres appropriées** selon le contexte

### Exemple de Migration

**Avant :**
```scss
.my-button {
  background-color: #5e68f1;
  border-radius: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(94, 104, 241, 0.3);
  
  &:hover {
    background-color: #4a54d1;
  }
}
```

**Après :**
```scss
.my-button {
  background-color: var(--app-primary);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-primary);
  
  &:hover {
    background-color: var(--app-primary-hover);
  }
}
```

## 🎨 Personnalisation

Pour personnaliser les couleurs, modifiez les variables dans `src/styles.css` :

```css
:root {
  --app-primary: #your-color;
  --app-primary-hover: #your-hover-color;
  /* etc. */
}
```

## 📋 Checklist de Cohérence

- [ ] Utilisation des variables CSS au lieu de couleurs hardcodées
- [ ] Application des transitions harmonisées
- [ ] Utilisation des rayons de bordure standardisés
- [ ] Application des ombres appropriées
- [ ] Respect de la hiérarchie des couleurs
- [ ] Test sur différentes tailles d'écran
- [ ] Vérification de l'accessibilité des contrastes

---

Ce système de design assure une cohérence visuelle parfaite dans toute l'application tout en facilitant la maintenance et les futures évolutions. 
# Créati'Clo — Site vitrine

Site vitrine pour **Créati'Clo**, atelier de couture artisanale basé à Tramolé (Isère).

## 🧵 À propos

Créati'Clo propose des services de couture sur mesure, retouches et réparations de vêtements et accessoires. Ce site présente l'atelier, les services proposés et une galerie des réalisations.

## 🚀 Stack technique

- **Framework** : [Astro](https://astro.build) (SSR)
- **CSS** : [TailwindCSS v4](https://tailwindcss.com)
- **Hébergement** : [Netlify](https://netlify.com)
- **Email** : [Resend](https://resend.com)
- **Tests** : [Playwright](https://playwright.dev)
- **CI/CD** : GitHub Actions

## 📁 Structure du projet
```text
src/
├── components/        # Composants Astro réutilisables
├── data/
│   └── gallery.json   # Source de vérité des images de la galerie
├── layouts/
│   ├── Layout.astro   # Layout public
│   └── AdminLayout.astro # Layout admin
├── lib/
│   └── github.ts      # Utilitaires API GitHub
├── pages/
│   ├── index.astro    # Page d'accueil
│   ├── gallery.astro  # Page galerie complète
│   ├── admin/         # Console d'administration
│   └── api/           # Endpoints SSR
└── styles/
    └── global.css     # Styles globaux + thème Tailwind
```

## ⚙️ Installation
```bash
npm install
```

Crée un fichier `.env` à la racine :
```env
RESEND_API_KEY=        # Clé API Resend pour les emails
ADMIN_PASSWORD=        # Mot de passe de la console admin
GH_TOKEN=              # Token GitHub (fine-grained, repo creaticlo uniquement)
GH_REPO=               # Ex: tonuser/creaticlo
GH_BRANCH=             # Branche cible pour l'admin (netlify-staging ou netlify-prod)
```

## 🧞 Commandes

| Commande         | Action                                    |
| :--------------- | :---------------------------------------- |
| `npm run dev`    | Démarre le serveur de développement       |
| `npm run build`  | Build le site en production               |
| `npm run preview`| Prévisualise le build en local            |

## 🧪 Tests
```bash
# Lancer tous les tests en local
npx playwright test

# Lancer les tests sur un navigateur spécifique
npx playwright test --project=chromium

# Voir le rapport HTML
npx playwright show-report
```

Les tests couvrent 6 navigateurs : Chromium, Firefox, WebKit, Edge, Mobile Chrome (Galaxy S20 Ultra) et Mobile Safari (iPhone 16).

## 🔄 Workflow CI/CD
```
dev (développement)
    ↓ merge manuel
netlify-staging → CI : build + tests e2e sur le vrai site staging
    ↓ merge automatique si tout est vert
main (sauvegarde) + netlify-prod (production)
    ↓
Netlify déploie automatiquement
```

Les tests CI ne se déclenchent pas sur les modifications de `gallery.json` et des images (gérées par la console admin).

## 🖼️ Console d'administration

Accessible sur `/admin` — protégée par mot de passe.

Fonctionnalités :
- Upload de photos avec recadrage (ratio 3/4 forcé)
- Modification du titre, description et statut "vedette"
- Suppression de photos
- Toggle "mise en vedette" depuis la grille

Les modifications sont commitées directement sur GitHub via l'API, ce qui déclenche un redéploiement automatique Netlify.

## 🌐 Déploiement

- **Production** : [creaticlo.netlify.app](https://creaticlo.netlify.app)
- **Staging** : [netlify-staging--creaticlo.netlify.app](https://netlify-staging--creaticlo.netlify.app)
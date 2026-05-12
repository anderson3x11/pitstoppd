# Pitstoppd — Roadmap

---

## v0.1 — Fondations (1er – 5 mars 2026)

- [x] Setup React 19 + Vite + Tailwind CSS v4
- [x] Structure des pages (Home, GP, Pilotes, Saisons, Profil, Settings, Login, Register)
- [x] Navbar, Footer, routing complet (React Router v7)
- [x] Setup Supabase (client, base de données PostgreSQL)
- [x] Connexion API F1 — récupération des courses, pilotes, résultats
- [x] Script de seed pour peupler la BDD
- [x] Authentification (inscription, connexion, sessions)
- [x] Système de notes (étoiles 0.5 → 5) et reviews sur les GPs

---

## v0.2 — Identité visuelle & Social (9 – 11 mars 2026)

- [x] Photos pilotes via Wikipedia API (script de récupération)
- [x] Posters de GP par saison (scripts + CSV)
- [x] Drapeaux des pays
- [x] Déploiement Vercel
- [x] Refonte visuelle des pages GP, Pilote, Profil
- [x] Couleurs d'équipe, logos officiels, titres WDC
- [x] Page reviews du profil (historique complet)
- [x] Settings (équipe favorite, bio, avatar)
- [x] Système de follows + feed amis
- [x] Tests avec faux utilisateurs

---

## v0.3 — Contenu historique & Sprints (15 mars 2026)

- [x] Support des courses sprint (données, posters, affichage distinct)
- [x] Page Review dédiée (lien partageable)
- [x] Page Saison enrichie (standings pilotes et constructeurs)
- [x] Extension des données de 2020 → **2000** (seed historique, +200 pilotes, +500 GPs)
- [x] Optimisations de performance

---

## v0.4 — Recherche & Optimisations (20 – 22 mars 2026)

- [x] Recherche d'utilisateurs
- [x] Auth optimisée (chargement plus rapide)
- [x] Refactoring — composants réutilisables (ReviewCard, StarDisplay)
- [x] Utilitaires extraits (dateUtils, ratingUtils, constants)
- [x] Fix infinite loading au premier chargement

---

## v0.5 — Polish (avril – mai 2026)

- [x] Fix posters manquants et GPs annulés
- [x] Fix Google Fonts (migration CSS → HTML pour compatibilité Tailwind v4)
- [x] Skeleton loaders
- [x] Ajout automatique des résultats de course
- [x] Countdown prochain GP sur la page d'accueil
- [x] Filtre par saison sur la page Grands Prix
- [x] Stats améliorées sur le profil

---

## v0.6 — En cours

- [x] Photos pilotes historiques (2000–2019) — ~200 pilotes sans photo
- [ ] Followers/Following cliquables → page dédiée
- [ ] "Membre depuis" dans le hero du profil

---

## v1.0 — Objectifs

- [ ] Récap vidéo officiel F1 par GP (YouTube embed)
- [ ] Hero dynamique (image de fond selon le circuit)
- [ ] Spoiler toggle (masquer classement/qualifs)
- [ ] Préférences spoilers dans les settings
- [ ] Compte privé (reviews visibles uniquement par les abonnés)
- [ ] Page 404 propre
- [ ] Responsive mobile complet

---

## v1.x — Long terme

- [ ] Notifications (likes, follows)
- [ ] Icône cloche dans la navbar

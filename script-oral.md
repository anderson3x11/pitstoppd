# Pitstoppd — Script oral

---

## Slide 1 — Pitstoppd

Pitstoppd, c'est un projet que j'ai construit de A à Z, seul, dans le cadre de mon portfolio.

L'idée de départ est simple : Letterboxd est une application qui permet aux cinéphiles de noter des films, écrire des critiques, suivre leurs amis. J'ai voulu transposer exactement ce concept à la Formule 1.

C'est une application full-stack, desktop-first, avec de vraies données F1 depuis l'an 2000.

---

## Slide 2 — Le concept

Pour ceux qui ne connaissent pas Letterboxd : c'est un réseau social autour du cinéma. Tu notes les films que t'as vus, tu écris des critiques, tu suis tes amis et tu vois ce qu'ils regardent.

Sur Pitstoppd, chaque Grand Prix fonctionne comme un film : tu lui donnes une note de 0,5 à 5 étoiles, tu peux écrire une review, et tu vois dans ton feed ce que les gens que tu suis ont noté.

Plus de 500 Grands Prix disponibles, sprints inclus, de 2000 à aujourd'hui.

---

## Slide 3 — Organisation et évolution

J'ai commencé les Ydays en septembre avec un autre projet. En décembre j'ai décidé de changer pour Pitstoppd, un projet perso qui me motivait beaucoup plus.

J'ai travaillé en autonomie, à la fois pendant les Ydays et chez moi. L'avantage de bosser seul c'est qu'on va vite, l'inconvénient c'est qu'on doit tout gérer soi-même — le design, le code, les données, les tests.

Pour m'organiser j'ai utilisé un fichier Markdown comme roadmap, versionné avec le code. Chaque version correspond à une phase du projet : v0.1 les fondations, v0.2 le visuel et le social, v0.3 le contenu historique, et ainsi de suite jusqu'à la v0.5 actuelle. Ça me permet de savoir exactement où j'en suis et ce qu'il reste à faire.

---

## Slide 4 — Stack technique

Trois outils principaux.

**React 19** : toute l'UI est construite en composants React. C'est une SPA — tout le routing se fait côté client avec React Router v7. J'ai choisi React parce que c'est le framework le plus utilisé dans l'industrie et celui que je voulais approfondir.

**Vite** : le bundler. Ce qui m'intéresse ici c'est surtout le HMR instantané en développement — ça change vraiment la vitesse à laquelle on itère.

**Supabase** : le cœur du backend. En un seul outil j'ai l'authentification, une base PostgreSQL, et le stockage de fichiers pour les avatars. J'ai choisi Supabase plutôt que Firebase parce que c'est open-source, basé sur Postgres — donc du vrai SQL — et le système de Row Level Security permet de sécuriser les données directement au niveau de la base.

---

## Slide 5 — Fonctionnalités principales

**Page d'accueil** : en arrivant sur le site tu vois le dernier Grand Prix en hero, un countdown jusqu'à la prochaine course, et si tu es connecté un feed avec les notes et reviews des gens que tu suis.

**Page Grand Prix** : chaque GP a sa propre page avec le classement de course complet, les qualifications, et la section communautaire où on peut noter et écrire une review.

**Profil utilisateur** : chaque compte a une page publique avec ses stats de notation, ses GPs favoris, et son historique complet de critiques.

---

## Slide 6 — Architecture & Base de données

La base de données c'est du PostgreSQL hébergé sur Supabase.

Ce qui est important à noter c'est le **RLS — Row Level Security**. C'est un système de sécurité au niveau des lignes : chaque policy définit précisément qui peut lire, créer ou modifier quelle donnée. Par exemple un utilisateur peut modifier ses propres ratings mais pas ceux des autres, même avec la clé publique exposée côté client.

Les tables clés : `profiles` pour les utilisateurs, `races` pour les GPs, `drivers` pour les pilotes, `ratings` et `reviews` pour le contenu communautaire, `likes` et `follows` pour le social.

L'auth utilise Supabase Auth avec un trigger SQL : à chaque inscription, une fonction crée automatiquement le profil en base à partir des métadonnées de l'utilisateur.

---

## Slide 7 — Difficultés et imprévus

**Problèmes de chargement** : au début l'application avait des temps de chargement longs et un bug d'infinite loading au premier accès. Le problème venait de la gestion de la session Supabase. J'ai dû réécrire le auth handler pour que la session soit vérifiée correctement au démarrage.

**Posters** : chaque GP a un poster, mais il n'existe pas d'API pour les récupérer automatiquement. J'ai dû créer des fichiers CSV par saison et un script qui les associe aux bonnes courses en base.

**Fonctions sociales** : le problème quand on développe une app sociale seul, c'est qu'on ne peut pas tester les follows et le feed. J'ai écrit un script qui crée de faux utilisateurs avec des notes et reviews pour pouvoir vérifier que tout fonctionne.

**Automatisation** : au départ je devais relancer manuellement un script de seed après chaque GP pour mettre à jour les résultats. J'ai fini par automatiser ça — maintenant le site récupère les résultats tout seul.

---

## DEMO — Script complet

**Avant de commencer** : être connecté avec ton compte perso, avoir des follows sur quelques fake users pour que le feed soit vivant.

### 1. Home non connectée
- Montrer le hero avec le dernier GP et la date
- Montrer le countdown du prochain GP
- Montrer la grille Latest Races avec les cartes
- Montrer le bloc "Join the community" qui invite à s'inscrire

### 2. Connexion
- Cliquer Sign in, se connecter
- Le feed amis apparaît avec les notes et reviews des gens suivis
- Souligner que c'est en temps réel depuis Supabase, pas de refresh manuel

### 3. Page Grands Prix
- Aller sur /gps
- Montrer le filtre par saison, changer entre 2026 et 2010 par exemple
- Montrer que les notes moyennes s'affichent sur les cartes

### 4. Page d'un Grand Prix
- Ouvrir un GP récent (Miami 2026 par exemple)
- Montrer le header : poster, infos, bloc "Mon activité"
- Donner une note en live (cliquer sur les étoiles)
- Montrer le classement de course et les qualifications
- Montrer les reviews communautaires avec les notes
- Ouvrir une review avec spoiler pour montrer le flag

### 5. Page Saisons
- Aller sur /saisons
- Montrer la grille des saisons avec les couleurs par équipe championne
- Ouvrir une saison (ex: 2021), montrer le standing pilotes et constructeurs

### 6. Page Pilotes
- Aller sur /pilotes
- Ouvrir une fiche pilote, montrer les stats et l'historique de carrière

### 7. Profil utilisateur
- Aller sur son propre profil
- Montrer les stats (nombre de notes, moyenne, etc.)
- Montrer l'historique des critiques
- Ouvrir le profil d'un fake user pour montrer que c'est public sans compte

---

## Slide 8 — Roadmap

Trois choses que je veux ajouter.

**Vidéos récap** : intégrer les résumés officiels F1 en YouTube embed directement sur la page de chaque GP. Feature évidente qui enrichit vraiment l'expérience.

**Hero dynamique** : en ce moment le hero de la home est statique. L'idée c'est une image de fond qui change selon le circuit du dernier GP disputé.

**Spoiler toggle** : permettre de masquer le classement et les qualifications pour les utilisateurs qui n'ont pas encore vu la course.

---

## Slide 9 — Merci

Le site est en ligne, vous pouvez créer un compte, noter des GPs, écrire des reviews.

Questions ?

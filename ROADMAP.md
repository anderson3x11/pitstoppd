# Pitstoppd — Roadmap

## En cours / prioritaire

### Page review individuelle
Quand un user clique sur un GP noté dans le feed "Following" de la home, il devrait atterrir sur la review spécifique de la personne qu'il follow (pas juste la page GP).
- Route : `/:username/reviews/:raceSlug` ou modal overlay sur la page GP
- Lier les FeedCards de la home vers cette page

### Refaire la page Seasons
La page saison actuelle est basique. À retravailler :
- Vue d'ensemble de la saison (champion, équipe championne, stats clés)
- Liste des GPs avec notes moyennes et résultats
- Classement pilotes / constructeurs de la saison

---

## Fonctionnalités à venir

### Profil
- Followers/Following cliquables → page dédiée avec liste des users
- "Membre depuis" dans le hero du profil

### Page GP
- Section "You might also like" → GPs similaires (même circuit, même saison)
- Pouvoir supprimer une note (actuellement on peut modifier mais pas supprimer)

### Settings
- Préférences spoilers (toujours masquer / toujours afficher par défaut)
- Compte privé (reviews/ratings visibles uniquement par les abonnés)

### Notifications (long terme)
- Notif quand quelqu'un like ta review
- Notif quand quelqu'un te follow

---

## Dette technique / polish

- Page 404 propre
- Responsive mobile à vérifier sur toutes les pages
- Skeleton loaders à la place des "Loading…" textuels
- Saison page Pilotes : filtrer par saison active

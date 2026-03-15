# Pitstoppd — Roadmap

## En cours / prioritaire

### Photos pilotes historiques (2000–2019)
Le seed historique a ajouté ~200+ pilotes sans photos. Récupérer les portraits via Wikipedia API ou autre source, puis mettre à jour `photo_url` dans la table `drivers`.

---

## Fonctionnalités à venir

### Profil
- Followers/Following cliquables → page dédiée avec liste des users
- "Membre depuis" dans le hero du profil

### Page GP
- Section "You might also like" → GPs similaires (même circuit, même saison)
- Récap vidéo officiel F1 du GP (YouTube embed)

### Settings
- Sélection top 3 pilotes à améliorer (autocomplete)
- Préférences spoilers (toujours masquer / toujours afficher par défaut)
- Compte privé (reviews/ratings visibles uniquement par les abonnés)

### Notifications (long terme)
- Notif quand quelqu'un like ta review
- Notif quand quelqu'un te follow

---

## Done

- ~~Page review individuelle~~ → `/gps/:saison/:slug/review/:username`
- ~~Refaire la page Seasons~~ → cards avec gradient champion, standings live
- ~~Supprimer une note~~ → bouton Remove sur la page GP
- ~~Extension saisons 2000–2019~~ → seed-historical.js, dropdown saisons, stats hors sprints, card champion dorée

---

## Dette technique / polish

- Page 404 propre
- Responsive mobile à vérifier sur toutes les pages
- Skeleton loaders à la place des "Loading…" textuels
- Home hero : trouver une image de fond

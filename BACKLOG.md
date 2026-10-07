# Backlog

Ajoutez ici les idées et fonctionnalités à prendre en compte pour les prochaines
évolutions du projet. Avant de commencer une nouvelle feature, consulter ce
backlog pour repérer les dépendances, les interactions et les décisions à
préserver, puis le mettre à jour si la portée ou le statut des éléments change.

## Priorités proposées

Les priorités ci-dessous privilégient d'abord les améliorations compatibles
avec la progression actuelle, puis les fonctionnalités qui élargissent les
mécaniques ou demandent des choix de conception.

1. **Invocation individuelle ou groupée** — Implémenté. Le joueur peut
   invoquer un seul compagnon ou dépenser les ressources disponibles au coût
   croissant pour effectuer autant d'invocations que possible, dans la limite
   des compagnons encore améliorables.
2. **Aperçu des compagnons et de leurs bonus** — Implémenté. Les bonus de
   chaque niveau, le niveau actuel et le prochain niveau sont visibles dans le
   panneau de recrutement. Garder l'affichage lisible à côté de la future
   distinction entre ressources ordinaires, ressources à effet immédiat et
   monnaies alternatives.
3. **Tutoriel intégré léger** — Implémenté : indications non bloquantes sur le
   déplacement, la première collecte et l'invocation. Chaque étape avance après
   l'action correspondante, le tutoriel peut être masqué et ne couvre pas les
   futures ressources ou actions, qui pourront ajouter leurs propres indications.
4. **Compagnons créant des ressources à effet actif** — Implémenté avec le
   Crabe trou noir : il fait apparaître un jeton aspirant par niveau (jusqu'à
   trois). Récupérer un jeton absorbe les trois pépites les plus
   proches, même à distance, crédite celles qui sont disponibles et fait
   réapparaître le jeton après six secondes.
5. **Ressources alternatives pour d'autres actions** — l'obtention d'un
   compagnon spécifique débloque l'apparition d'un type de ressource alternatif ;
   la quantité de ces ressources dépend proportionnellement au niveau de ce
   compagnon. Les relier aux actions qu'elles permettent et définir les actions,
   leurs coûts, les règles d'apparition, de collecte et d'affichage. À coordonner
   avec les ressources spéciales déclenchant un effet immédiat pour distinguer
   clairement ces effets des monnaies dépensables.
6. **Historique visuel des actions** — afficher les événements récents (par
   exemple invocation et utilisation d'une action, mais pas les collectes
   ordinaires) dans un encart distinct. Implémenté avec un historique éphémère
   des cinq dernières invocations ; intégrer les futures actions lorsqu'elles
   seront ajoutées.
7. **Obstacles et arènes alternatives** — Implémenté pour la configuration
   de base avec 4 murs éparpillés entravant les trajectoires directes, gérant
   la collision et le glissement le long des parois, le recalage des
   destinations et l'apparition des ressources hors des obstacles. Permettre
   ultérieurement de choisir entre plusieurs configurations ou géométries
   d'arène.
8. **Nouvelle ressource secondaire et compagnon associé** — Ajouter un nouveau
   type de ressource (monnaie alternative distincte des pépites ordinaires) dont
   l'apparition et la quantité à l'écran sont contrôlées par un nouveau compagnon
   dédié. Le compagnon génère un nombre de ressources proportionnel à son niveau
   (par exemple 1 par niveau). Décider du visuel, du nom, des règles d'apparition
   (emplacement, fréquence, respawn) et de l'affichage du compteur dans l'UI.
   Coordonner avec l'item 5 (ressources alternatives) pour que les distinctions
   entre types de ressources restent lisibles. Prérequis pour les items 9 et 10.
9. **Action : traversée de murs** — Permettre au joueur de dépenser un certain
   coût en ressources secondaires (item 8) pour activer temporairement ou
   définitivement la capacité à traverser les murs de l'arène. Définir la durée
   ou la permanence de l'effet, le coût, le retour visuel (changement d'apparence
   du joueur, indication dans l'UI) et les interactions avec le système de
   collision existant. Dépend de l'item 8 (ressource disponible) et de l'item 7
   (murs en place).
10. **Action : prestige des compagnons** — Permettre au joueur de dépenser des
    ressources secondaires (item 8) pour « prestiger » un compagnon : le remettre
    au niveau 0 en échange d'un bonus permanent améliorant ses statistiques
    au-delà du plafond actuel de niveau 3 (par exemple +X % supplémentaire par
    prestige). Définir le coût, le nombre de niveaux de prestige possibles, la
    persistance du bonus, l'affichage dans le panneau des compagnons et
    l'intégration dans l'historique des actions. Dépend de l'item 8. Attention à
    l'équilibre : le prestige doit offrir un gain net sur la durée malgré le
    retour au niveau 0.

## Format suggéré

- **Idée** — description courte, objectif ou bénéfice attendu, contraintes ou
  dépendances connues.

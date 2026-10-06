# Backlog

Ajoutez ici les idées et fonctionnalités à prendre en compte pour les prochaines
évolutions du projet. Avant de commencer une nouvelle feature, consulter ce
backlog pour repérer les dépendances, les interactions et les décisions à
préserver, puis le mettre à jour si la portée ou le statut des éléments change.

## Priorités proposées

Les priorités ci-dessous privilégient d’abord les améliorations compatibles
avec la progression actuelle, puis les fonctionnalités qui élargissent les
mécaniques ou demandent des choix de conception.

1. **Invocation individuelle ou groupée** — Implémenté. Le joueur peut
   invoquer un seul compagnon ou dépenser les ressources disponibles au coût
   croissant pour effectuer autant d’invocations que possible, dans la limite
   des compagnons encore améliorables.
2. **Aperçu des compagnons et de leurs bonus** — Implémenté. Les bonus de
   chaque niveau, le niveau actuel et le prochain niveau sont visibles dans le
   panneau de recrutement. Garder l’affichage lisible à côté de la future
   distinction entre ressources ordinaires, ressources à effet immédiat et
   monnaies alternatives.
3. **Tutoriel intégré léger** — Implémenté : indications non bloquantes sur le
   déplacement, la première collecte et l’invocation. Chaque étape avance après
   l’action correspondante, le tutoriel peut être masqué et ne couvre pas les
   futures ressources ou actions, qui pourront ajouter leurs propres indications.
4. **Compagnons créant des ressources à effet actif** — certains compagnons
   font apparaître des ressources spéciales ; leur quantité dépend du niveau du
   compagnon (1, 2 ou 3 aux niveaux correspondants). Leur récupération déclenche
   un effet actif et ne crédite pas le compteur de ressources ordinaires.
   Définir l’effet, sa durée et les règles de réapparition avant l’implémentation.
5. **Ressources alternatives pour d’autres actions** — l’obtention d’un
   compagnon spécifique débloque l’apparition d’un type de ressource alternatif ;
   la quantité de ces ressources dépend proportionnellement au niveau de ce
   compagnon. Les relier aux actions qu’elles permettent et définir les actions,
   leurs coûts, les règles d’apparition, de collecte et d’affichage. À coordonner
   avec les ressources spéciales déclenchant un effet immédiat pour distinguer
   clairement ces effets des monnaies dépensables.
6. **Historique visuel des actions** — afficher les événements récents (par
   exemple invocation et utilisation d’une action, mais pas les collectes
   ordinaires) dans un encart distinct. Implémenté avec un historique éphémère
   des cinq dernières invocations ; intégrer les futures actions lorsqu’elles
   seront ajoutées.
7. **Arènes alternatives avec obstacles ou murs** — permettre de choisir entre
   plusieurs configurations d’arène. Définir les règles de collision, les
   déplacements et l’emplacement des ressources autour des obstacles ; cette
   évolution peut nécessiter de généraliser la géométrie actuellement fixe.

## Format suggéré

- **Idée** — description courte, objectif ou bénéfice attendu, contraintes ou
  dépendances connues.

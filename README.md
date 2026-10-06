# KattaK

Petit jeu 2D navigateur construit avec TypeScript, Phaser 3 et Vite.

## Déplacement

Cliquez ou touchez un point de l’arène pour y déplacer le joueur. Cliquez ou
touchez une autre position pendant son déplacement pour changer sa destination.
Les clics et touchers en dehors de l’arène sont ignorés.

Le joueur ramasse les ressources dorées dès que leur bord touche le cercle rouge
autour de lui. Le rayon du cercle et le rayon de la ressource sont pris en compte
ensemble, comme deux cercles qui se touchent. Le compteur dans le panneau
augmente à chaque ressource collectée. Une ressource réapparaît après trois
secondes à un emplacement libre de l’arène.

La zone de collecte est matérialisée par un halo autour du joueur et s’élargit
avec le bonus du Moustique doré. Les ressources servent à invoquer un compagnon
passif : le coût commence à 5 ressources et augmente de 1 après chaque
invocation réussie. Le bouton d’invocation indique combien de tirages peuvent
être financés et permet de les effectuer en une fois ; leurs résultats sont
récapitulés dans le panneau. Les doublons augmentent le niveau du compagnon
jusqu’au niveau 3 ; les
compagnons déjà au niveau maximal ne sont plus inclus dans les tirages, qui ont
des chances égales parmi les compagnons encore améliorables. Les trois
compagnons améliorent respectivement le rayon de collecte (+25 % par niveau),
la vitesse du joueur (+15 % par niveau) et le délai de réapparition des
ressources (-15 % par niveau). Le panneau détaille le bonus cumulé de chaque
niveau et met en évidence les niveaux débloqués et le prochain. La progression
est réinitialisée au rechargement de la page.

L’arène conserve un format carré : le panneau de ressources et d’actions est
placé à côté sur grand écran et sous l’arène sur téléphone. Les emplacements du
panneau d’actions sont réservés aux futures fonctionnalités.

L’interface adopte une esthétique de fanzine photocopié : papier cassé, trames
imprimées, contours noirs francs et accents rouge brique.

## Développement

```sh
npm install
npm run dev
```

## Vérification et build

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

Le build statique est produit dans `dist/`.

## GitHub Pages

Le workflow GitHub Actions construit et déploie le projet à chaque mise à jour
de `main`. Pour un dépôt de projet, Vite utilise `/kprj/` comme chemin de base
dans GitHub Actions. Pour un domaine personnalisé, définir la variable
`VITE_BASE_PATH` à `/` dans l’environnement du workflow.

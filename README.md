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

Un tutoriel discret guide la première partie : déplacement, collecte puis
invocation. Il avance après chaque première action et peut être masqué ; il
réapparaît au rechargement avec la nouvelle partie.

La zone de collecte est matérialisée par un halo autour du joueur et s’élargit
avec le bonus du Moustique doré. Les ressources servent à invoquer un compagnon
passif : le coût commence à 5 ressources et augmente de 1 après chaque
invocation réussie. Le bouton d’invocation indique combien de tirages peuvent
être financés et permet de les effectuer en une fois, tout en conservant le
choix d’invoquer un seul compagnon. Les doublons augmentent le niveau du
compagnon jusqu’au niveau 3 ; les
compagnons déjà au niveau maximal ne sont plus inclus dans les tirages, qui ont
des chances égales parmi les compagnons encore améliorables. Les quatre
compagnons améliorent respectivement le rayon de collecte (+25 % par niveau),
la vitesse du joueur (+15 % par niveau), le délai de réapparition des
ressources (-15 % par niveau), et l’apparition de jetons aspirants (un par
niveau) grâce au Crabe magnétique. Ces jetons violets absorbent jusqu’aux trois
ressources dorées les plus proches, qui sont créditées au compteur ; ils
réapparaissent après six secondes. Le panneau détaille le bonus de chaque
niveau et met en évidence les niveaux débloqués et le prochain ; les détails
peuvent être dépliés pour garder le panneau compact. Le bouton d’invocation
groupée indique directement le nombre de tirages possibles et leur coût total ;
il passe en rouge quand au moins deux compagnons peuvent être invoqués. Un
historique séparé conserve les cinq invocations les plus récentes.
La progression est réinitialisée au rechargement de la page.

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

# KattaK

Petit jeu 2D navigateur construit avec TypeScript, Phaser 3 et Vite.

## Déplacement

Cliquez ou touchez un point de l’arène pour y déplacer le joueur. Cliquez ou
touchez une autre position pendant son déplacement pour changer sa destination.
Les clics et touchers en dehors de l’arène sont ignorés. Quatre murs
éparpillés gênent la progression directe, font glisser le joueur le long des
parois et obligent à contourner les obstacles pour atteindre les ressources.

Le joueur ramasse les pépites dès que leur bord touche le cercle rouge autour
de lui. Le rayon du cercle et le rayon de la pépite sont pris en compte ensemble,
comme deux cercles qui se touchent. Le compteur dans le panneau augmente à
chaque pépite collectée. Une pépite réapparaît après trois
secondes à un emplacement libre de l’arène.

Un tutoriel discret guide la première partie : déplacement, collecte puis
invocation. Il avance après chaque première action et peut être masqué ; il
réapparaît au rechargement avec la nouvelle partie.

La zone de collecte est matérialisée par un halo autour du joueur et s’élargit
avec le bonus du Moustique magnétique. Les pépites servent à invoquer un compagnon
passif : le coût commence à 5 pépites et augmente de 1 après chaque
invocation réussie. Le bouton d’invocation indique combien de tirages peuvent
être financés et permet de les effectuer en une fois, tout en conservant le
choix d’invoquer un seul compagnon. Les doublons augmentent le niveau du
compagnon jusqu’au niveau 3 ; les
compagnons déjà au niveau maximal ne sont plus inclus dans les tirages. Les raretés sont définies par l’efficacité des passifs pour obtenir des pépites :
le Moustique magnétique et le Lapin rapide sont communs, l’Écureuil prévoyant
et le Singe productif peu communs, et le Crabe trou noir ainsi que la Pie glaneuse rares. Les chances
de groupe sont pondérées à 50 %, 35 % et 15 %, puis normalisées et réparties
également entre les compagnons disponibles de chaque groupe. Quand tous les
compagnons d’une rareté sont au niveau maximal, sa part est redistribuée entre
les raretés restantes ; les probabilités détaillées sont consultables depuis
l’aide « ? » du panneau de recrutement. Les six
compagnons améliorent respectivement le rayon de collecte (+25 % par niveau),
la vitesse du joueur (+15 % par niveau), le délai de réapparition des pépites
(-15 % par niveau) grâce au Singe productif, l’apparition de jetons aspirants
(un par niveau) grâce au Crabe trou noir, la capacité maximale de pépites de
base à l’écran (+2, +4 puis +6) grâce à l’Écureuil prévoyant, et le nombre de
fragments présents dans l’arène (2, 4 puis 6) grâce à la Pie glaneuse.
Les jetons violets absorbent jusqu’aux trois pépites les plus proches,
qui sont créditées au compteur, puis réapparaissent après six secondes. Le
panneau détaille le bonus de chaque
niveau et met en évidence les niveaux débloqués et le prochain ; les détails
peuvent être dépliés pour garder le panneau compact. Le bouton d’invocation
groupée indique directement le nombre de tirages possibles et leur coût total ;
il reste mis en évidence quand au moins deux compagnons peuvent être invoqués. Un
historique séparé conserve les cinq invocations les plus récentes.
La progression est réinitialisée au rechargement de la page.

L’arène conserve un format carré : les panneaux de ressources, d’actions et
d’historique sont placés à côté sur grand écran (le panneau « Actions » reste
visible sans défiler, dans une colonne dédiée) et sous l’arène sur téléphone.

Les fragments sont une ressource distincte des pépites, affichée dans le panneau
« Butin ». La Pie glaneuse en fait apparaître 2, 4 ou 6 dans l’arène selon son
niveau (en forme de losange vert) ; les ramasser ajoute 1 fragment au compteur
et chacun réapparaît après huit secondes. Ils se dépensent dans le panneau
« Actions », qui contient aussi les boutons d’invocation (jaune des pépites
quand ils sont utilisables) ; les actions payées en fragments prennent le vert
des fragments quand elles sont utilisables. « Supprimer un mur aléatoire »
coûte 10 fragments et supprime aussitôt un mur tiré au hasard, ce qui est
inscrit dans l’historique. « Invocation automatique » doit d’abord être
débloqué pour 20 fragments ; il s’active ensuite et se désactive à volonté :
tant qu’il est actif, une invocation est
achetée dès que les pépites le permettent et signalée
« automatiquement » dans l’historique.

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

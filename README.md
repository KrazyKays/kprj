# KattaK

Petit jeu 2D navigateur construit avec TypeScript, Phaser 3 et Vite.

## Déplacement

Cliquez ou touchez un point de l’arène pour y déplacer le joueur. Cliquez ou
touchez une autre position pendant son déplacement pour changer sa destination.
Les clics et touchers en dehors de l’arène sont ignorés.

Le joueur ramasse les ressources dorées en passant dessus. Le compteur dans le
panneau augmente à chaque ressource collectée. Une ressource réapparaît après
trois secondes à un emplacement libre de l’arène.

L’arène conserve un format carré : le panneau de ressources et d’actions est
placé à côté sur grand écran et sous l’arène sur téléphone. Les emplacements du
panneau d’actions sont réservés aux futures fonctionnalités.

## Développement

```sh
npm install
npm run dev
```

## Vérification et build

```sh
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

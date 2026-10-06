# Project workflow

- Before implementing a feature, read `BACKLOG.md` and account for related
  priorities, dependencies, and interactions. Update it when scope or status
  changes.
- After implementing a feature or requested correction, run the relevant tests
  and production build. If they pass, commit the scoped changes and push them
  to `main`; pushing to `main` triggers the GitHub Pages deployment workflow.
- Verify the GitHub Actions deployment run completes successfully and report
  the commit, deployment status, and live URL. Do not push if the user asks to
  keep the work local or explicitly declines deployment.

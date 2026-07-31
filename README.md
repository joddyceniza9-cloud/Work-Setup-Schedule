# Work Setup Schedule

Static work setup planner with local multi-user access, employee scheduling, WFO/WFH tracking, dashboard views, trash recovery, and CSV export.

## Important behavior

- This project is ready to publish on a single GitHub Pages link.
- Multiple users can open the same link.
- User accounts and schedule data are stored in each browser's local storage.
- Data is not shared across devices or users until you connect a real backend.

## Publish to GitHub Pages

1. Push this project to a GitHub repository.
2. Make sure your default branch is `main`.
3. In GitHub, open `Settings > Pages`.
4. Under `Build and deployment`, set `Source` to `GitHub Actions`.
5. Push to `main` or run the `Deploy GitHub Pages` workflow manually.
6. After deployment, your app will be available at your GitHub Pages URL.

## Local development

Open `index.html` directly in a browser, or serve the folder with any static file server.

## Next step for real shared multi-user access

If you want all users on the same link to share the same accounts and data across devices, connect this app to a backend such as Firebase or Supabase.

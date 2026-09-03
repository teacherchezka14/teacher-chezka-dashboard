# Teacher Chezka Dashboard

A lightweight private ESL teacher-management dashboard designed to run as a static website.

## Included in this starter

- Dashboard statistics
- Student management
- Manual student creation
- Manual class scheduling
- Class records
- CSV / XLSX / XLS ClassIn import
- Large-row imports (no hard-coded 388-row limit)
- Duplicate skipping
- Automatic student creation from imported class rows
- Search/filter tools
- JSON backup and restore
- Responsive pastel teacher-admin design

## Important storage note

This starter uses browser `localStorage`. Your data stays in the browser/device where you use the dashboard. Clearing browser data can erase it, so use **Settings → Export Backup JSON** regularly.

For multi-device access and stronger long-term storage, the next upgrade should connect this project to Supabase.

## Publish on GitHub Pages

1. Sign in to GitHub.
2. Create a new repository, for example `teacher-chezka-dashboard`.
3. Upload `index.html`, `styles.css`, and `app.js`.
4. Open the repository **Settings**.
5. Choose **Pages**.
6. Under Build and deployment, select **Deploy from a branch**.
7. Choose your `main` branch and `/root` folder, then save.
8. GitHub will provide your website address after deployment.

## Test before publishing

You can double-click `index.html` on a computer to open it, although some browser security settings may work better when served through GitHub Pages.

## ClassIn import mapping

The importer tries to automatically identify common columns such as:

- Student / Student Name / Name / Nickname
- Date / Class Date / Lesson Date / Start Date
- Time / Class Time / Start Time
- Duration
- Status / Attendance

Every original imported row is also kept inside the saved class record as `raw` data.

## Next recommended upgrade

Connect Supabase for:

- secure login
- database storage
- access from multiple devices
- stronger handling of very large datasets
- contract balances
- automatic package deductions
- recurring schedules
- payment tracking
- advanced reports

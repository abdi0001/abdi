# Production readiness checklist

- [ ] Replace all sample fixtures, standings, teams, and news with verified commission data.
- [ ] Apply and review database schema, indexes, RLS policies, and admin bootstrap SQL.
- [ ] Add Supabase dependency to package.json and lockfile.
- [ ] Configure environment variables in local and Vercel settings; do not commit secret keys.
- [ ] Wire public data reads and realtime subscriptions to the UI.
- [ ] Wire admin actions to authenticated server/database writes.
- [ ] Verify admin role enforcement in SQL policies (not just client-side UI).
- [ ] Validate realtime, standings calculations, event logs, and fixture editing.
- [ ] Test responsive layout on phone, tablet, desktop.
- [ ] Add error, loading, empty, and offline states.
- [ ] Configure custom domain, HTTPS, monitoring, backups, and recovery plan.
- [ ] Run a security review before opening to the public.

This package is a development starter and is not production-ready until all checklist items that apply are completed and tested.

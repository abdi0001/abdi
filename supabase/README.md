# Supabase setup for AFAR SPORTS LIVE

1. Create a Supabase project.
2. Open **SQL Editor** → create a new query → paste `schema.sql` → Run.
3. In Authentication, create the first admin user.
4. In SQL Editor, grant that user admin role (replace the email):

```sql
insert into public.profiles (id, display_name, role)
select id, 'Sports Admin', 'admin'
from auth.users where email = 'YOUR_ADMIN_EMAIL';
```

If the profile already exists, use:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
```

5. In Project Settings → API, copy the Project URL and anon/public key. Use them in the frontend environment file (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Never place the service-role key in a browser app.
6. Add real competition, team, match and event records from the admin interface once it is implemented.

The schema includes public read policies, admin-only write policies, match event storage, and a standings view calculated from finished matches. Demo scores and teams are not official records.

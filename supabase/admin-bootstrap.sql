-- PHASE 5: Bootstrap the FIRST admin after creating their account in Supabase Auth.
-- Run manually in Supabase SQL Editor. Replace the UUID with the intended auth.users ID.
-- Never put the service-role key in frontend code or expose this SQL editor to admins.
insert into public.profiles (id, display_name, role)
values ('REPLACE-WITH-AUTH-USER-UUID', 'Sports Administrator', 'admin')
on conflict (id) do update set role = 'admin';

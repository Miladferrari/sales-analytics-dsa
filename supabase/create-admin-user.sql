-- Create admin user voor login
-- Run this in Supabase SQL Editor to create your first admin user

-- Note: Je moet dit via de Supabase Dashboard doen:
-- 1. Ga naar Authentication → Users
-- 2. Klik "Add user" → "Create new user"
-- 3. Vul in:
--    Email: admin@jouwbedrijf.com
--    Password: JouwSterkWachtwoord123!
--    Auto Confirm User: JA (vink aan)
-- 4. Klik "Create user"

-- Of gebruik deze SQL query om een user te maken (minder veilig, alleen voor development):
-- BELANGRIJK: Verander het email en password naar je eigen gegevens!

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@dropshippingacademy.com', -- VERANDER DIT naar jouw email
  crypt('AdminPassword123!', gen_salt('bf')), -- VERANDER DIT naar jouw wachtwoord
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

/*
  # Create roles table

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `permissions` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `roles` table
    - Add policy for authenticated users to read all roles
    - Add policy for superadmins to manage roles
  3. Initial Data
    - Insert default roles (superadmin, admin, user)
*/

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Superadmins can manage roles"
  ON roles
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN user_roles ON auth.users.id = user_roles.user_id
      JOIN roles r ON user_roles.role_id = r.id
      WHERE auth.users.id = auth.uid() AND r.name = 'superadmin'
    )
  );

-- Insert default roles
INSERT INTO roles (name, description, permissions)
VALUES 
  ('superadmin', 'Pełny dostęp do wszystkich funkcji systemu', '{
    "users": true,
    "roles": true,
    "campaigns": true,
    "analytics": true,
    "settings": true,
    "billing": true,
    "system": true
  }'::jsonb),
  ('admin', 'Zarządzanie użytkownikami i kampaniami', '{
    "users": true,
    "roles": false,
    "campaigns": true,
    "analytics": true,
    "settings": true,
    "billing": false,
    "system": false
  }'::jsonb),
  ('user', 'Podstawowy dostęp do kampanii', '{
    "users": false,
    "roles": false,
    "campaigns": true,
    "analytics": true,
    "settings": false,
    "billing": false,
    "system": false
  }'::jsonb)
ON CONFLICT (name) DO NOTHING;

/*
  # Create user_roles table

  1. New Tables
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role_id` (uuid, references roles)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `user_roles` table
    - Add policy for authenticated users to read their own roles
    - Add policy for superadmins to manage user roles
*/

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage user roles"
  ON user_roles
  USING (
    (SELECT permissions->>'roles' FROM roles r 
     JOIN user_roles ur ON r.id = ur.role_id 
     WHERE ur.user_id = auth.uid() AND r.name = 'superadmin')::boolean = true
  );

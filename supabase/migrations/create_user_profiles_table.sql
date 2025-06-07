/*
  # Create user_profiles table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `company` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for authenticated users to read all profiles
    - Add policy for users to update their own profile
    - Add policy for superadmin to manage all profiles
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  company text DEFAULT 'FunnelFlow Sp. z o.o.',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Superadmins can manage all profiles"
  ON user_profiles
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN user_roles ON auth.users.id = user_roles.user_id
      JOIN roles ON user_roles.role_id = roles.id
      WHERE auth.users.id = auth.uid() AND roles.name = 'superadmin'
    )
  );

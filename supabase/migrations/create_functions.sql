/*
  # Create helper functions

  1. New Functions
    - `get_user_permissions` - Returns all permissions for a user
    - `check_user_permission` - Checks if a user has a specific permission
  2. Purpose
    - These functions help with permission checking in the application
    - They are used by RLS policies and can be called from the client
*/

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}'::JSONB;
  role_record RECORD;
BEGIN
  -- Check if user has superadmin role
  FOR role_record IN (
    SELECT r.permissions
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id
  ) LOOP
    -- If user has all permissions, return immediately
    IF role_record.permissions ? 'all' AND (role_record.permissions->>'all')::BOOLEAN = TRUE THEN
      RETURN jsonb_build_object('all', true);
    END IF;
    
    -- Merge permissions
    result := result || role_record.permissions;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION check_user_permission(
  user_id UUID,
  module TEXT,
  action TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  permissions JSONB;
BEGIN
  -- Get user permissions
  permissions := get_user_permissions(user_id);
  
  -- Check if user has all permissions
  IF permissions ? 'all' AND (permissions->>'all')::BOOLEAN = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- Check module permission
  IF NOT permissions ? module THEN
    RETURN FALSE;
  END IF;
  
  -- If module permission is boolean
  IF jsonb_typeof(permissions->module) = 'boolean' THEN
    RETURN (permissions->>module)::BOOLEAN;
  END IF;
  
  -- If action is not specified, check if module has any permissions
  IF action IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific action permission
  IF NOT permissions->module ? action THEN
    RETURN FALSE;
  END IF;
  
  RETURN (permissions->module->>action)::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

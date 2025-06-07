import { supabase } from './supabase.js';

// Funkcja do rejestracji nowego użytkownika
export async function registerUser(email, password, userData) {
  try {
    // Rejestracja użytkownika w Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName
        }
      }
    });

    if (authError) throw authError;

    // Tworzenie profilu użytkownika
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: authData.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          company: userData.company || 'FunnelFlow Sp. z o.o.',
          avatar_url: userData.avatarUrl || null
        }
      ]);

    if (profileError) throw profileError;

    // Przypisanie roli do użytkownika
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', userData.role.toLowerCase())
      .single();

    if (roleError) throw roleError;

    const { error: roleAssignError } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: authData.user.id,
          role_id: roleData.id
        }
      ]);

    if (roleAssignError) throw roleAssignError;

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Błąd podczas rejestracji użytkownika:', error);
    return { success: false, error: error.message };
  }
}

// Funkcja do logowania użytkownika
export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Pobierz rolę użytkownika
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles:role_id (
          id,
          name,
          permissions
        )
      `)
      .eq('user_id', data.user.id);

    if (rolesError) throw rolesError;

    // Pobierz profil użytkownika
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    // Zapisz dane użytkownika w localStorage
    const userData = {
      id: data.user.id,
      email: data.user.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      company: profile.company,
      avatarUrl: profile.avatar_url,
      roles: userRoles.map(ur => ({
        id: ur.roles.id,
        name: ur.roles.name,
        permissions: ur.roles.permissions
      }))
    };

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('session', JSON.stringify(data.session));

    return { success: true, user: userData };
  } catch (error) {
    console.error('Błąd podczas logowania:', error);
    return { success: false, error: error.message };
  }
}

// Funkcja do wylogowania użytkownika
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    // Usuń dane użytkownika z localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    
    return { success: true };
  } catch (error) {
    console.error('Błąd podczas wylogowania:', error);
    return { success: false, error: error.message };
  }
}

// Funkcja do sprawdzania czy użytkownik jest zalogowany
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Funkcja do sprawdzania czy użytkownik ma określoną rolę
export function hasRole(roleName) {
  const user = getCurrentUser();
  if (!user || !user.roles) return false;
  
  return user.roles.some(role => role.name.toLowerCase() === roleName.toLowerCase());
}

// Funkcja do sprawdzania czy użytkownik ma określone uprawnienie
export function hasPermission(permissionKey) {
  const user = getCurrentUser();
  if (!user || !user.roles) return false;
  
  return user.roles.some(role => {
    if (!role.permissions) return false;
    return role.permissions[permissionKey] === true;
  });
}

// Funkcja do inicjalizacji stanu autoryzacji
export async function initAuth() {
  try {
    // Sprawdź czy istnieje aktywna sesja
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (session) {
      // Jeśli sesja istnieje, ale nie ma danych użytkownika w localStorage, pobierz je
      if (!localStorage.getItem('user')) {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Pobierz rolę użytkownika
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            role_id,
            roles:role_id (
              id,
              name,
              permissions
            )
          `)
          .eq('user_id', user.id);

        if (rolesError) throw rolesError;

        // Pobierz profil użytkownika
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Zapisz dane użytkownika w localStorage
        const userData = {
          id: user.id,
          email: user.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          company: profile.company,
          avatarUrl: profile.avatar_url,
          roles: userRoles.map(ur => ({
            id: ur.roles.id,
            name: ur.roles.name,
            permissions: ur.roles.permissions
          }))
        };

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('session', JSON.stringify(session));
      }
      
      return { loggedIn: true, user: getCurrentUser() };
    } else {
      // Jeśli nie ma sesji, wyczyść localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      return { loggedIn: false };
    }
  } catch (error) {
    console.error('Błąd podczas inicjalizacji autoryzacji:', error);
    return { loggedIn: false, error: error.message };
  }
}

// Funkcja do aktualizacji profilu użytkownika
export async function updateUserProfile(userId, profileData) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        company: profileData.company,
        avatar_url: profileData.avatarUrl,
        updated_at: new Date()
      })
      .eq('id', userId);

    if (error) throw error;

    // Aktualizuj dane w localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.firstName = profileData.firstName;
      user.lastName = profileData.lastName;
      user.company = profileData.company;
      user.avatarUrl = profileData.avatarUrl;
      localStorage.setItem('user', JSON.stringify(user));
    }

    return { success: true };
  } catch (error) {
    console.error('Błąd podczas aktualizacji profilu:', error);
    return { success: false, error: error.message };
  }
}

// Funkcja do pobierania wszystkich użytkowników (tylko dla administratorów)
export async function getAllUsers() {
  try {
    // Sprawdź czy użytkownik ma uprawnienia administratora
    if (!hasRole('superadmin') && !hasRole('admin')) {
      throw new Error('Brak uprawnień do pobierania listy użytkowników');
    }

    // Pobierz wszystkich użytkowników z ich profilami i rolami
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) throw profilesError;

    // Pobierz role dla każdego użytkownika
    const userIds = profiles.map(profile => profile.id);
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role_id,
        roles:role_id (
          id,
          name,
          permissions
        )
      `)
      .in('user_id', userIds);

    if (rolesError) throw rolesError;

    // Połącz dane użytkowników z ich rolami
    const users = profiles.map(profile => {
      const roles = userRoles
        .filter(ur => ur.user_id === profile.id)
        .map(ur => ({
          id: ur.roles.id,
          name: ur.roles.name,
          permissions: ur.roles.permissions
        }));

      return {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        company: profile.company,
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        roles
      };
    });

    return { success: true, users };
  } catch (error) {
    console.error('Błąd podczas pobierania użytkowników:', error);
    return { success: false, error: error.message };
  }
}

// Funkcja do usuwania użytkownika (tylko dla administratorów)
export async function deleteUser(userId) {
  try {
    // Sprawdź czy użytkownik ma uprawnienia administratora
    if (!hasRole('superadmin') && !hasRole('admin')) {
      throw new Error('Brak uprawnień do usuwania użytkowników');
    }

    // Usuń użytkownika z auth.users (kaskadowo usunie powiązane rekordy)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Błąd podczas usuwania użytkownika:', error);
    return { success: false, error: error.message };
  }
}

// Funkcja do zmiany roli użytkownika (tylko dla administratorów)
export async function changeUserRole(userId, newRoleName) {
  try {
    // Sprawdź czy użytkownik ma uprawnienia administratora
    if (!hasRole('superadmin') && !hasRole('admin')) {
      throw new Error('Brak uprawnień do zmiany ról użytkowników');
    }

    // Pobierz ID nowej roli
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', newRoleName.toLowerCase())
      .single();

    if (roleError) throw roleError;

    // Usuń wszystkie istniejące role użytkownika
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Przypisz nową rolę
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: userId,
          role_id: roleData.id
        }
      ]);

    if (insertError) throw insertError;

    return { success: true };
  } catch (error) {
    console.error('Błąd podczas zmiany roli użytkownika:', error);
    return { success: false, error: error.message };
  }
}

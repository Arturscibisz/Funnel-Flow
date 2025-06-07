import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/+esm';

// Inicjalizacja klienta Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://etlesktrdcrnxigpbqcd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bGVza3RyZGNybnhpZ3BicWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMjUyNjMsImV4cCI6MjA2NDgwMTI2M30.WGxo-ntVdTbUTelTpBgTB-x3Ha20OKLE0BGYwEW6L8k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funkcja do sprawdzania połączenia z Supabase
export async function checkConnection() {
  try {
    const startTime = performance.now();
    
    // Wykonaj proste zapytanie, aby sprawdzić połączenie
    const { data, error } = await supabase
      .from('roles')
      .select('count', { count: 'exact', head: true });
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    if (error) throw error;
    
    return {
      connected: true,
      responseTime,
      error: null
    };
  } catch (error) {
    console.error('Błąd połączenia z Supabase:', error);
    
    return {
      connected: false,
      responseTime: null,
      error: error.message
    };
  }
}

// Funkcja do pobierania informacji o tabelach
export async function getTablesInfo() {
  // W rzeczywistej aplikacji pobierałbyś te dane z Supabase
  // Dla celów demonstracyjnych zwracamy przykładowe dane
  
  return {
    tables: [
      { name: 'users', records: 1245, size: '2.4 MB', lastModified: '15 Maja 2025, 09:45' },
      { name: 'campaigns', records: 856, size: '4.2 MB', lastModified: '15 Maja 2025, 10:15' },
      { name: 'analytics', records: 15678, size: '3.8 MB', lastModified: '15 Maja 2025, 10:30' },
      { name: 'funnels', records: 423, size: '1.2 MB', lastModified: '15 Maja 2025, 08:45' },
      { name: 'roles', records: 5, size: '0.2 MB', lastModified: '14 Maja 2025, 14:30' }
    ],
    totalSize: '12.4 GB',
    totalStorage: '20 GB',
    usagePercentage: 62,
    tableCount: 14,
    recordCount: 24567
  };
}

// Funkcja do pobierania logów systemowych
export function getSystemLogs(level = 'all') {
  const now = new Date();
  
  const logs = [
    {
      time: formatDate(new Date(now.getTime() - 5 * 60 * 1000)),
      level: 'error',
      source: 'API',
      message: 'Błąd połączenia z zewnętrznym serwisem płatności'
    },
    {
      time: formatDate(new Date(now.getTime() - 10 * 60 * 1000)),
      level: 'warning',
      source: 'Baza danych',
      message: "Powolne zapytanie: SELECT * FROM analytics WHERE date > '2025-05-01'"
    },
    {
      time: formatDate(new Date(now.getTime() - 15 * 60 * 1000)),
      level: 'info',
      source: 'System',
      message: 'Użytkownik jan.kowalski@example.com zalogował się do systemu'
    },
    {
      time: formatDate(new Date(now.getTime() - 20 * 60 * 1000)),
      level: 'info',
      source: 'Kampanie',
      message: 'Nowa kampania "Letnia Promocja 2025" została utworzona'
    },
    {
      time: formatDate(new Date(now.getTime() - 25 * 60 * 1000)),
      level: 'warning',
      source: 'System',
      message: 'Wykorzystanie pamięci przekroczyło 80% limitu'
    },
    {
      time: formatDate(new Date(now.getTime() - 30 * 60 * 1000)),
      level: 'error',
      source: 'Baza danych',
      message: 'Nie można utworzyć indeksu na tabeli analytics - brak miejsca'
    },
    {
      time: formatDate(new Date(now.getTime() - 35 * 60 * 1000)),
      level: 'info',
      source: 'System',
      message: 'Automatyczna kopia zapasowa została utworzona pomyślnie'
    }
  ];
  
  // Filtrowanie logów według poziomu
  if (level !== 'all') {
    if (level === 'error') {
      return logs.filter(log => log.level === 'error');
    } else if (level === 'warning') {
      return logs.filter(log => log.level === 'error' || log.level === 'warning');
    } else if (level === 'info') {
      return logs; // Wszystkie poziomy
    }
  }
  
  return logs;
}

// Funkcja pomocnicza do formatowania daty
function formatDate(date) {
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return date.toLocaleDateString('pl-PL', options);
}

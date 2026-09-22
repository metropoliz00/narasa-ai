import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, LearningMission, StudentActivitySession, TeacherInsight, AssessmentRecord } from '../types';
import { INITIAL_SYSTEM_USERS, DEFAULT_MISSIONS, INITIAL_COMPLETED_SESSION, TEACHER_INSIGHTS, ASSESSMENT_DATA } from '../data/mockData';

// Universal Environment Variable Resolver for Supabase
export function getSupabaseConfig(): { url: string; anonKey: string } {
  let customUrl = '';
  let customKey = '';
  if (typeof window !== 'undefined') {
    try {
      customUrl = localStorage.getItem('narasa_custom_supabase_url') || '';
      customKey = localStorage.getItem('narasa_custom_supabase_anon_key') || '';
    } catch {
      // Ignore localStorage errors
    }
  }

  const url =
    customUrl ||
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL || process.env?.NEXT_PUBLIC_SUPABASE_URL : '') ||
    '';

  const anonKey =
    customKey ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY || process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : '') ||
    '';

  return { url: url.trim(), anonKey: anonKey.trim() };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey && url !== 'MY_SUPABASE_URL' && anonKey !== 'MY_SUPABASE_ANON_KEY') {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
}

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url !== 'MY_SUPABASE_URL' &&
    anonKey !== 'MY_SUPABASE_ANON_KEY'
  );
};

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; dataCount?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Kredensial Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) belum dikonfigurasi di file environment.'
    };
  }

  try {
    const { data, error } = await client.from('users').select('id, name, role').limit(5);
    if (error) {
      return {
        success: false,
        message: `Koneksi Supabase gagal: ${error.message} (Pastikan SQL schema telah dijalankan di SQL Editor Supabase)`
      };
    }
    return {
      success: true,
      message: `Koneksi berhasil terhubung ke Supabase! Ditemukan ${data?.length || 0} user di database.`,
      dataCount: data?.length || 0
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error koneksi: ${err.message || 'Gagal menghubungi server Supabase'}`
    };
  }
}

// ==========================================
// USER REPOSITORY
// ==========================================
export async function dbFetchUsers(): Promise<UserProfile[]> {
  const client = getSupabaseClient();
  if (!client) {
    // Return from localStorage or initial mock data
    try {
      const saved = localStorage.getItem('narasa_users_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_SYSTEM_USERS;
  }

  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase users fetch error:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('Supabase users table is empty');
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      avatar: row.avatar || 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80',
      schoolName: row.school_name,
      schoolId: row.school_id || 'SDN01',
      className: row.class_name,
      classId: row.class_id || 'V-A',
      email: row.email,
      status: row.status,
      nisnNip: row.nisn_nip,
      username: row.username || undefined,
      password: row.password || undefined,
      phone: row.phone,
      joinedDate: row.joined_date,
      isGroup: row.is_group || false,
      groupMembers: Array.isArray(row.group_members) ? row.group_members : []
    }));
  } catch (err) {
    console.error('Error in dbFetchUsers:', err);
    return [];
  }
}

export async function dbUpsertUser(user: UserProfile): Promise<boolean> {
  // Always update local storage first
  try {
    const saved = localStorage.getItem('narasa_users_data');
    let currentUsers: UserProfile[] = saved ? JSON.parse(saved) : INITIAL_SYSTEM_USERS;
    const exists = currentUsers.some(u => u.id === user.id);
    if (exists) {
      currentUsers = currentUsers.map(u => u.id === user.id ? user : u);
    } else {
      currentUsers = [user, ...currentUsers];
    }
    localStorage.setItem('narasa_users_data', JSON.stringify(currentUsers));
  } catch (e) {}

  const client = getSupabaseClient();
  if (!client) return true;

  try {
    const payload = {
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      school_name: user.schoolName,
      school_id: user.schoolId || 'SDN01',
      class_name: user.className,
      class_id: user.classId || 'V-A',
      email: user.email || `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@narasa.id`,
      status: user.status || 'active',
      nisn_nip: user.nisnNip || null,
      username: user.username || null,
      password: user.password || null,
      phone: user.phone || null,
      joined_date: user.joinedDate || 'Hari ini',
      is_group: user.isGroup || false,
      group_members: user.groupMembers || []
    };

    const { error } = await client.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase upsert user error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error upserting user to Supabase:', err);
    return false;
  }
}

export async function dbDeleteUser(userId: string): Promise<boolean> {
  try {
    const saved = localStorage.getItem('narasa_users_data');
    if (saved) {
      const currentUsers: UserProfile[] = JSON.parse(saved);
      const filtered = currentUsers.filter(u => u.id !== userId);
      localStorage.setItem('narasa_users_data', JSON.stringify(filtered));
    }
  } catch (e) {}

  const client = getSupabaseClient();
  if (!client) return true;

  try {
    const { error } = await client.from('users').delete().eq('id', userId);
    return !error;
  } catch (err) {
    console.error('Error deleting user from Supabase:', err);
    return false;
  }
}

// ==========================================
// LEARNING MISSIONS REPOSITORY
// ==========================================
export async function dbFetchMissions(): Promise<LearningMission[]> {
  const client = getSupabaseClient();
  if (!client) return DEFAULT_MISSIONS;

  try {
    const { data, error } = await client.from('learning_missions').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase missions fetch error:', error.message);
      return [];
    }
    if (!data || data.length === 0) {
      console.warn('Supabase missions table is empty');
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      grade: row.grade,
      phase: row.phase,
      subject: row.subject,
      material: row.material,
      cp: row.cp,
      tp: row.tp,
      indicators: Array.isArray(row.indicators) ? row.indicators : [],
      targetCompetency: row.target_competency,
      cognitiveLevel: row.cognitive_level,
      strictCurriculumMode: row.strict_curriculum_mode,
      features: row.features || {
        adaptiveDifficulty: true,
        scaffolding: true,
        reasoning: true,
        evidence: true,
        reflection: true,
        presentation: true,
        peerQuestion: true
      },
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      suggestedObjects: Array.isArray(row.suggested_objects) ? row.suggested_objects : []
    }));
  } catch (e) {
    return [];
  }
}

export async function dbUpsertMission(mission: LearningMission): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return true;

  try {
    const payload = {
      id: mission.id,
      title: mission.title,
      grade: mission.grade,
      phase: mission.phase,
      subject: mission.subject,
      material: mission.material,
      cp: mission.cp,
      tp: mission.tp,
      indicators: mission.indicators,
      target_competency: mission.targetCompetency,
      cognitive_level: mission.cognitiveLevel,
      strict_curriculum_mode: mission.strictCurriculumMode,
      features: mission.features,
      description: mission.description,
      is_active: mission.isActive,
      suggested_objects: mission.suggestedObjects
    };

    const { error } = await client.from('learning_missions').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (e) {
    return false;
  }
}

// ==========================================
// STUDENT ACTIVITY SESSIONS REPOSITORY
// ==========================================
export async function dbFetchSessions(): Promise<StudentActivitySession[]> {
  const client = getSupabaseClient();
  if (!client) return [INITIAL_COMPLETED_SESSION];

  try {
    const { data, error } = await client.from('student_sessions').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase sessions fetch error:', error.message);
      return [];
    }
    if (!data || data.length === 0) {
      console.warn('Supabase sessions table is empty');
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      missionId: row.mission_id,
      missionTitle: row.mission_title,
      subject: row.subject,
      studentId: row.student_id,
      studentName: row.student_name,
      image: row.image,
      imageLabel: row.image_label,
      learningBridge: row.learning_bridge,
      answers: row.answers,
      scaffoldingHistory: row.scaffolding_history || [],
      reflection: row.reflection,
      presentation: row.presentation || [],
      peerQuestions: row.peer_questions || [],
      completedAt: row.completed_at,
      status: row.status || 'completed',
      metrics: row.metrics || {
        literacyScore: 88,
        numeracyScore: 92,
        reasoningScore: 90,
        scaffoldingUsedCount: 0
      }
    }));
  } catch (e) {
    return [];
  }
}

export async function dbUpsertSession(session: StudentActivitySession): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return true;

  try {
    const payload = {
      id: session.id,
      mission_id: session.missionId,
      mission_title: session.missionTitle,
      subject: session.subject,
      student_id: session.studentId,
      student_name: session.studentName,
      image: session.image,
      image_label: session.imageLabel,
      learning_bridge: session.learningBridge,
      answers: session.answers,
      scaffolding_history: session.scaffoldingHistory,
      reflection: session.reflection,
      presentation: session.presentation,
      peer_questions: session.peerQuestions,
      completed_at: session.completedAt || new Date().toISOString().split('T')[0],
      status: session.status || 'completed',
      metrics: session.metrics
    };

    const { error } = await client.from('student_sessions').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (e) {
    return false;
  }
}

// Bulk Sync All Local Data to Supabase
export async function syncAllToSupabase(
  users: UserProfile[],
  missions: LearningMission[],
  sessions: StudentActivitySession[]
): Promise<{ success: boolean; message: string; details: any }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Kredensial Supabase belum terpasang di environment variable.',
      details: null
    };
  }

  try {
    let syncedUsers = 0;
    let syncedMissions = 0;
    let syncedSessions = 0;

    // 1. Sync Users
    for (const u of users) {
      const ok = await dbUpsertUser(u);
      if (ok) syncedUsers++;
    }

    // 2. Sync Missions
    for (const m of missions) {
      const ok = await dbUpsertMission(m);
      if (ok) syncedMissions++;
    }

    // 3. Sync Sessions
    for (const s of sessions) {
      const ok = await dbUpsertSession(s);
      if (ok) syncedSessions++;
    }

    return {
      success: true,
      message: `Sinkronisasi Supabase Sukses: ${syncedUsers} User, ${syncedMissions} Misi, ${syncedSessions} Karya Murid berhasil disimpan ke database.`,
      details: { syncedUsers, syncedMissions, syncedSessions }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal melakukan sinkronisasi: ${err.message}`,
      details: err
    };
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, LearningMission, StudentActivitySession, TeacherInsight, AssessmentRecord, SchoolProfile } from '../types';
import { INITIAL_SYSTEM_USERS, DEFAULT_MISSIONS, INITIAL_COMPLETED_SESSION, TEACHER_INSIGHTS, ASSESSMENT_DATA } from '../data/mockData';
import { getDefaultAvatar, UserGender } from '../data/avatarData';

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: UserProfile) => {
            const isCustomBase64 = u.avatar && u.avatar.startsWith('data:image');
            const gender: UserGender = u.gender || 'male';
            return {
              ...u,
              gender,
              avatar: isCustomBase64 ? u.avatar : getDefaultAvatar(u.role, gender)
            };
          });
        }
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

    return data.map((row: any) => {
      const gender: UserGender = row.gender || 'male';
      const isCustomBase64 = row.avatar && row.avatar.startsWith('data:image');
      const avatar = isCustomBase64 ? row.avatar : getDefaultAvatar(row.role, gender);
      return {
        id: row.id,
        name: row.name,
        role: row.role,
        gender,
        avatar,
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
      };
    });
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
// SCHOOLS & SETTINGS REPOSITORY
// ==========================================
export async function dbFetchSchools(): Promise<SchoolProfile[]> {
  let schoolsList: SchoolProfile[] = [];

  // 1. Fetch from server-side database (/api/schools)
  try {
    const res = await fetch('/api/schools');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        schoolsList = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          npsn: row.npsn || '',
          level: row.level || 'SD / MI',
          status: row.status || 'Negeri',
          accreditation: row.accreditation || 'A (Unggul)',
          curriculum: row.curriculum || 'Kurikulum Merdeka (Fase A, B, C)',
          headmaster: row.headmaster || '',
          headmasterNip: row.headmasterNip || row.headmaster_nip || '',
          supervisorName: row.supervisorName || row.supervisor_name || '',
          supervisorNip: row.supervisorNip || row.supervisor_nip || '',
          phone: row.phone || '',
          email: row.email || '',
          website: row.website || '',
          address: row.address || '',
          rtRw: row.rtRw || row.rt_rw || '',
          village: row.village || '',
          district: row.district || '',
          city: row.city || '',
          province: row.province || '',
          postalCode: row.postalCode || row.postal_code || '',
          motto: row.motto || '',
          logoUrl: row.logoUrl || row.logo_url || '',
          academicYear: row.academicYear || row.academic_year || '2024/2025',
          activeSemester: row.activeSemester || row.active_semester || 'Ganjil',
          category: row.category || '',
          updatedAt: row.updatedAt || row.updated_at || new Date().toISOString()
        }));
      }
    }
  } catch (e) {
    console.warn('Gagal memuat sekolah dari /api/schools:', e);
  }

  // 2. Fetch from Supabase if configured
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('schools')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        const supabaseSchools = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          npsn: row.npsn || '',
          level: row.level || 'SD / MI',
          status: row.status || 'Negeri',
          accreditation: row.accreditation || 'A (Unggul)',
          curriculum: row.curriculum || 'Kurikulum Merdeka (Fase A, B, C)',
          headmaster: row.headmaster || '',
          headmasterNip: row.headmaster_nip || '',
          supervisorName: row.supervisor_name || '',
          supervisorNip: row.supervisor_nip || '',
          phone: row.phone || '',
          email: row.email || '',
          website: row.website || '',
          address: row.address || '',
          rtRw: row.rt_rw || '',
          village: row.village || '',
          district: row.district || '',
          city: row.city || '',
          province: row.province || '',
          postalCode: row.postal_code || '',
          motto: row.motto || '',
          logoUrl: row.logo_url || '',
          academicYear: row.academic_year || '2024/2025',
          activeSemester: row.active_semester || 'Ganjil',
          category: row.category || '',
          updatedAt: row.updated_at || new Date().toISOString()
        }));
        // Merge or replace if Supabase has fresh data
        if (supabaseSchools.length > 0) {
          schoolsList = supabaseSchools;
        }
      }
    } catch (err) {
      console.warn('Error in Supabase dbFetchSchools:', err);
    }
  }

  // 3. Fallback to localStorage if still empty
  if (schoolsList.length === 0) {
    try {
      const saved = localStorage.getItem('narasa_schools_profile_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
  } else {
    try {
      localStorage.setItem('narasa_schools_profile_data', JSON.stringify(schoolsList));
    } catch (e) {}
  }

  return schoolsList;
}

export async function dbUpsertSchool(school: SchoolProfile): Promise<boolean> {
  // 1. Always persist to local storage
  try {
    const saved = localStorage.getItem('narasa_schools_profile_data');
    let currentSchools: SchoolProfile[] = saved ? JSON.parse(saved) : [];
    const exists = currentSchools.some((s) => s.id === school.id);
    if (exists) {
      currentSchools = currentSchools.map((s) => (s.id === school.id ? school : s));
    } else {
      currentSchools = [...currentSchools, school];
    }
    localStorage.setItem('narasa_schools_profile_data', JSON.stringify(currentSchools));
  } catch (e) {}

  // 2. Persist to server database (/api/schools)
  try {
    await fetch('/api/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(school)
    });
  } catch (e) {
    console.warn('Gagal menyimpan sekolah ke /api/schools:', e);
  }

  // 3. Persist to Supabase if configured
  const client = getSupabaseClient();
  if (client) {
    try {
      const payload = {
        id: school.id,
        name: school.name,
        npsn: school.npsn,
        level: school.level,
        status: school.status,
        accreditation: school.accreditation,
        curriculum: school.curriculum,
        headmaster: school.headmaster,
        headmaster_nip: school.headmasterNip,
        supervisor_name: school.supervisorName || null,
        supervisor_nip: school.supervisorNip || null,
        phone: school.phone,
        email: school.email,
        website: school.website || null,
        address: school.address,
        rt_rw: school.rtRw || null,
        village: school.village || null,
        district: school.district || null,
        city: school.city,
        province: school.province,
        postal_code: school.postalCode,
        motto: school.motto || null,
        logo_url: school.logoUrl || null,
        academic_year: school.academicYear,
        active_semester: school.activeSemester,
        category: school.category || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await client.from('schools').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase upsert school error:', error.message);
      }
    } catch (err) {
      console.error('Error upserting school to Supabase:', err);
    }
  }

  return true;
}

export async function dbDeleteSchool(schoolId: string): Promise<boolean> {
  // 1. Remove from local storage
  try {
    const saved = localStorage.getItem('narasa_schools_profile_data');
    if (saved) {
      const currentSchools: SchoolProfile[] = JSON.parse(saved);
      const filtered = currentSchools.filter((s) => s.id !== schoolId);
      localStorage.setItem('narasa_schools_profile_data', JSON.stringify(filtered));
    }
  } catch (e) {}

  // 2. Remove from server database (/api/schools/:id)
  try {
    await fetch(`/api/schools/${schoolId}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('Gagal menghapus sekolah dari /api/schools:', e);
  }

  // 3. Remove from Supabase if connected
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('schools').delete().eq('id', schoolId);
      if (error) {
        console.warn('Supabase delete school error:', error.message);
      }
    } catch (err) {
      console.error('Error deleting school from Supabase:', err);
    }
  }

  return true;
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

    return data.map((row: any) => {
      const subject = row.subject || 'Matematika';
      const mapelIdMap: Record<string, string> = {
        'Matematika': 'matematika',
        'IPAS': 'ipas',
        'Bahasa Indonesia': 'bahasa_indonesia',
        'Pendidikan Pancasila': 'pancasila',
        'Seni Budaya': 'seni_budaya'
      };
      const idMapel = row.id_mapel || mapelIdMap[subject] || subject.toLowerCase().replace(/\s+/g, '_');

      return {
        id: row.id,
        idMapel,
        title: row.title,
        grade: row.grade,
        phase: row.phase,
        subject,
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
      };
    });
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
      id_mapel: mission.idMapel,
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
  
  // 1. If Supabase client configured, try fetching remote
  if (client) {
    try {
      const { data, error } = await client.from('student_sessions').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map((row: any) => ({
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
        try {
          localStorage.setItem('narasa_sessions_data', JSON.stringify(mapped));
        } catch (e) {}
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase fetch sessions error:', e);
    }
  }

  // 2. Try fetching from server-side database (/api/sessions)
  try {
    const res = await fetch('/api/sessions');
    if (res.ok) {
      const serverSessions = await res.json();
      if (Array.isArray(serverSessions)) {
        // Read local sessions to merge
        const saved = localStorage.getItem('narasa_sessions_data');
        let localList: StudentActivitySession[] = [];
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) localList = parsed;
          } catch (e) {}
        }

        const sessionMap = new Map<string, StudentActivitySession>();
        serverSessions.forEach((s: StudentActivitySession) => sessionMap.set(s.id, s));
        localList.forEach((s: StudentActivitySession) => {
          if (!sessionMap.has(s.id)) {
            sessionMap.set(s.id, s);
            // Push un-synced local session to the server database
            fetch('/api/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(s)
            }).catch(() => {});
          }
        });

        const merged = Array.from(sessionMap.values());
        if (merged.length > 0) {
          try {
            localStorage.setItem('narasa_sessions_data', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        }
      }
    }
  } catch (e) {
    // server API unavailable, proceed to localStorage
  }

  // 3. Fallback to localStorage
  try {
    const saved = localStorage.getItem('narasa_sessions_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return [INITIAL_COMPLETED_SESSION];
}

export async function dbUpsertSession(session: StudentActivitySession): Promise<boolean> {
  // 1. Immediately store in localStorage so student work is always preserved locally
  try {
    const saved = localStorage.getItem('narasa_sessions_data');
    let list: StudentActivitySession[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {}
    }
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.unshift(session);
    }
    localStorage.setItem('narasa_sessions_data', JSON.stringify(list));
  } catch (e) {
    console.warn('Gagal menyimpan session ke localStorage:', e);
  }

  // 2. Immediately persist to server-side database (/api/sessions)
  let serverOk = false;
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    serverOk = res.ok;
  } catch (e) {
    console.warn('POST /api/sessions error:', e);
  }

  // 3. Persist to Supabase if connected
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
  sessions: StudentActivitySession[],
  schools?: SchoolProfile[]
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
    let syncedSchools = 0;
    let syncedUsers = 0;
    let syncedMissions = 0;
    let syncedSessions = 0;

    // 0. Sync Schools
    const schoolsToSync = schools || (await dbFetchSchools());
    for (const sch of schoolsToSync) {
      const ok = await dbUpsertSchool(sch);
      if (ok) syncedSchools++;
    }

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
      message: `Sinkronisasi Supabase Sukses: ${syncedSchools} Data Sekolah, ${syncedUsers} User, ${syncedMissions} Misi, ${syncedSessions} Karya Murid berhasil disimpan ke database.`,
      details: { syncedSchools, syncedUsers, syncedMissions, syncedSessions }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal melakukan sinkronisasi: ${err.message}`,
      details: err
    };
  }
}

// ==========================================
// SYSTEM SETTINGS & GEMINI API KEY REPOSITORY
// ==========================================
export interface SystemSettingsData {
  geminiApiKey?: string;
  defaultModel?: string;
  visionSensitivity?: string;
  maxDailyAnalysisPerStudent?: number;
  enableCriticalQuizGen?: boolean;
  enableVisionObjectAnalysis?: boolean;
  updatedAt?: string;
}

export async function dbFetchSystemSettings(): Promise<SystemSettingsData> {
  let settings: SystemSettingsData = {
    geminiApiKey: '',
    defaultModel: 'gemini-3.1-flash-lite',
    visionSensitivity: 'balanced'
  };

  // 1. Fetch from server-side database
  try {
    const res = await fetch('/api/system-settings');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        settings = { ...settings, ...data };
      }
    }
  } catch (e) {
    console.warn('Failed to fetch system settings from /api/system-settings:', e);
  }

  // 2. Fetch from Supabase if configured
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('system_settings')
        .select('*')
        .eq('key', 'school_gemini_config')
        .maybeSingle();

      if (!error && data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        settings = { ...settings, ...parsed };
      }
    } catch (e) {
      // Supabase table may not exist yet, fallback to server data
    }
  }

  // 3. Fallback to localStorage if still empty
  if (!settings.geminiApiKey && typeof window !== 'undefined') {
    try {
      const localKey = localStorage.getItem('narasa_school_gemini_key') || localStorage.getItem('school_gemini_api_key');
      if (localKey) settings.geminiApiKey = localKey;
    } catch (e) {}
  }

  return settings;
}

export async function dbSaveSystemSettings(newSettings: SystemSettingsData): Promise<boolean> {
  let serverSuccess = false;

  // 1. Save to server database /api/system-settings
  try {
    const res = await fetch('/api/system-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    if (res.ok) {
      serverSuccess = true;
    }
  } catch (e) {
    console.warn('Failed to save system settings to /api/system-settings:', e);
  }

  // 2. Save to Supabase if configured
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('system_settings').upsert({
        key: 'school_gemini_config',
        value: newSettings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch (e) {
      console.warn('Supabase system_settings save error:', e);
    }
  }

  // 3. Sync to localStorage
  if (typeof window !== 'undefined' && newSettings.geminiApiKey !== undefined) {
    try {
      if (newSettings.geminiApiKey) {
        localStorage.setItem('narasa_school_gemini_key', newSettings.geminiApiKey.trim());
      } else {
        localStorage.removeItem('narasa_school_gemini_key');
      }
    } catch (e) {}
  }

  return serverSuccess;
}


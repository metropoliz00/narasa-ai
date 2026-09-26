import {
  studentBoy1Base64,
  studentBoy2Base64,
  studentGirlHijabBase64,
  studentGirlRibbonBase64,
  teacherMaleBase64,
  teacherFemaleBase64,
  adminMaleBase64,
  adminFemaleBase64
} from './base64Avatars';
import { UserRole } from '../types';

export const studentBoy1 = studentBoy1Base64;
export const studentBoy2 = studentBoy2Base64;
export const studentGirlHijab = studentGirlHijabBase64;
export const studentGirlRibbon = studentGirlRibbonBase64;
export const teacherMale = teacherMaleBase64;
export const teacherFemale = teacherFemaleBase64;
export const adminMale = adminMaleBase64;
export const adminFemale = adminFemaleBase64;

export type UserGender = 'male' | 'female';

export interface CharacterAvatar {
  id: string;
  url: string;
  name: string;
  gender: UserGender;
  role: UserRole;
  description: string;
}

export const CHARACTER_AVATARS: CharacterAvatar[] = [
  // Murid Laki-laki
  {
    id: 'student-boy-1',
    url: studentBoy1Base64,
    name: 'Siswa Ceria',
    gender: 'male',
    role: 'student',
    description: 'Karakter murid putra ceria & penuh semangat'
  },
  {
    id: 'student-boy-2',
    url: studentBoy2Base64,
    name: 'Siswa Kacamata',
    gender: 'male',
    role: 'student',
    description: 'Karakter murid putra cermat & gemar membaca'
  },
  // Murid Perempuan
  {
    id: 'student-girl-1',
    url: studentGirlHijabBase64,
    name: 'Siswi Berhijab',
    gender: 'female',
    role: 'student',
    description: 'Karakter murid putri santun berhijab'
  },
  {
    id: 'student-girl-2',
    url: studentGirlRibbonBase64,
    name: 'Siswi Ceria',
    gender: 'female',
    role: 'student',
    description: 'Karakter murid putri ramah & kreatif'
  },
  // Guru Laki-laki
  {
    id: 'teacher-male-1',
    url: teacherMaleBase64,
    name: 'Bapak Guru',
    gender: 'male',
    role: 'teacher',
    description: 'Karakter pendidik putra inspiratif berbatik'
  },
  // Guru Perempuan
  {
    id: 'teacher-female-1',
    url: teacherFemaleBase64,
    name: 'Ibu Guru',
    gender: 'female',
    role: 'teacher',
    description: 'Karakter pendidik putri ramah & berhijab'
  },
  // Admin Laki-laki
  {
    id: 'admin-male-1',
    url: adminMaleBase64,
    name: 'Kepala / Admin Sekolah (Putra)',
    gender: 'male',
    role: 'school_admin',
    description: 'Karakter pimpinan / pengelola sekolah putra'
  },
  // Admin Perempuan
  {
    id: 'admin-female-1',
    url: adminFemaleBase64,
    name: 'Kepala / Admin Sekolah (Putri)',
    gender: 'female',
    role: 'school_admin',
    description: 'Karakter pimpinan / pengelola sekolah putri'
  }
];

export const getDefaultAvatar = (role: UserRole = 'student', gender: UserGender = 'male'): string => {
  const match = CHARACTER_AVATARS.find(a => (a.role === role || (role.includes('admin') && a.role === 'school_admin')) && a.gender === gender);
  if (match) return match.url;
  if (gender === 'female') return studentGirlHijabBase64;
  return studentBoy1Base64;
};

export const getAvatarsByFilter = (role?: UserRole, gender?: UserGender): CharacterAvatar[] => {
  return CHARACTER_AVATARS.filter(a => {
    if (gender && a.gender !== gender) return false;
    if (role) {
      if (role === 'central_admin' || role === 'admin') {
        return a.role === 'school_admin';
      }
      return a.role === role;
    }
    return true;
  });
};

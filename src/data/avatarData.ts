import studentBoy1 from '../assets/avatars/student_boy_1.jpg';
import studentBoy2 from '../assets/avatars/student_boy_2.jpg';
import studentGirlHijab from '../assets/avatars/student_girl_hijab.jpg';
import studentGirlRibbon from '../assets/avatars/student_girl_ribbon.jpg';
import teacherMale from '../assets/avatars/teacher_male.jpg';
import teacherFemale from '../assets/avatars/teacher_female.jpg';
import adminMale from '../assets/avatars/admin_male.jpg';
import adminFemale from '../assets/avatars/admin_female.jpg';
import { UserRole } from '../types';

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
    url: studentBoy1,
    name: 'Siswa Ceria',
    gender: 'male',
    role: 'student',
    description: 'Karakter murid putra ceria & penuh semangat'
  },
  {
    id: 'student-boy-2',
    url: studentBoy2,
    name: 'Siswa Kacamata',
    gender: 'male',
    role: 'student',
    description: 'Karakter murid putra cermat & gemar membaca'
  },
  // Murid Perempuan
  {
    id: 'student-girl-1',
    url: studentGirlHijab,
    name: 'Siswi Berhijab',
    gender: 'female',
    role: 'student',
    description: 'Karakter murid putri santun berhijab'
  },
  {
    id: 'student-girl-2',
    url: studentGirlRibbon,
    name: 'Siswi Ceria',
    gender: 'female',
    role: 'student',
    description: 'Karakter murid putri ramah & kreatif'
  },
  // Guru Laki-laki
  {
    id: 'teacher-male-1',
    url: teacherMale,
    name: 'Bapak Guru',
    gender: 'male',
    role: 'teacher',
    description: 'Karakter pendidik putra inspiratif berbatik'
  },
  // Guru Perempuan
  {
    id: 'teacher-female-1',
    url: teacherFemale,
    name: 'Ibu Guru',
    gender: 'female',
    role: 'teacher',
    description: 'Karakter pendidik putri ramah & berhijab'
  },
  // Admin Laki-laki
  {
    id: 'admin-male-1',
    url: adminMale,
    name: 'Kepala / Admin Sekolah (Putra)',
    gender: 'male',
    role: 'school_admin',
    description: 'Karakter pimpinan / pengelola sekolah putra'
  },
  // Admin Perempuan
  {
    id: 'admin-female-1',
    url: adminFemale,
    name: 'Kepala / Admin Sekolah (Putri)',
    gender: 'female',
    role: 'school_admin',
    description: 'Karakter pimpinan / pengelola sekolah putri'
  }
];

export const getDefaultAvatar = (role: UserRole = 'student', gender: UserGender = 'male'): string => {
  const match = CHARACTER_AVATARS.find(a => (a.role === role || (role.includes('admin') && a.role === 'school_admin')) && a.gender === gender);
  if (match) return match.url;
  if (gender === 'female') return studentGirlHijab;
  return studentBoy1;
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

-- ==============================================================================
-- 🏫 NARASA - SUPABASE SQL: PENGATURAN SEKOLAH & PROFIL SATUAN PENDIDIKAN 🏫
-- Script ini untuk membuat dan memperbarui tabel public.schools di Supabase
-- Aman dijalankan langsung di SQL Editor Supabase (Idempotent & Non-destructive)
-- ==============================================================================

-- 1. BUAT TABEL public.schools (Jika Belum Ada)
CREATE TABLE IF NOT EXISTS public.schools (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    npsn VARCHAR(20) UNIQUE,
    level VARCHAR(50) DEFAULT 'SD / MI',
    status VARCHAR(50) DEFAULT 'Negeri',
    accreditation VARCHAR(50) DEFAULT 'A (Unggul)',
    curriculum VARCHAR(150) DEFAULT 'Kurikulum Merdeka (Fase A, B, C)',
    headmaster VARCHAR(255),
    headmaster_nip VARCHAR(50),
    supervisor_name VARCHAR(255),
    supervisor_nip VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    rt_rw VARCHAR(50),
    village VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    motto TEXT,
    logo_url TEXT,
    academic_year VARCHAR(50) DEFAULT '2024/2025',
    active_semester VARCHAR(20) DEFAULT 'Ganjil',
    category VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MIGRASI KOLOM (Jika tabel public.schools sudah pernah dibuat sebelumnya)
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'SD / MI';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Negeri';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS accreditation VARCHAR(50) DEFAULT 'A (Unggul)';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS curriculum VARCHAR(150) DEFAULT 'Kurikulum Merdeka (Fase A, B, C)';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS headmaster VARCHAR(255);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS headmaster_nip VARCHAR(50);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS supervisor_name VARCHAR(255);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS supervisor_nip VARCHAR(50);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS rt_rw VARCHAR(50);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS village VARCHAR(100);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS motto TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2024/2025';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS active_semester VARCHAR(20) DEFAULT 'Ganjil';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS category VARCHAR(150);

-- 3. INDEKS QUERY UNTUK PERFORMA CEPAT
CREATE INDEX IF NOT EXISTS idx_schools_npsn ON public.schools(npsn);
CREATE INDEX IF NOT EXISTS idx_schools_city ON public.schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_province ON public.schools(province);

-- 4. TRIGGER OTOMATIS UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_schools_timestamp ON public.schools;
CREATE TRIGGER set_schools_timestamp
    BEFORE UPDATE ON public.schools
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public All Access for Schools" ON public.schools;
CREATE POLICY "Public All Access for Schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);

-- 6. SEED & UPSERT DATA AWAL PENGATURAN SEKOLAH
INSERT INTO public.schools (
    id, name, npsn, level, status, accreditation, curriculum,
    headmaster, headmaster_nip, supervisor_name, supervisor_nip,
    phone, email, website, address, rt_rw, village, district,
    city, province, postal_code, motto, academic_year, active_semester, category
) VALUES 
    (
        'SDN01',
        'SDN 01 Nusantara',
        '20104050',
        'SD / MI',
        'Negeri',
        'A (Unggul)',
        'Kurikulum Merdeka (Fase A, B, C)',
        'Dra. Hj. Siti Nurjanah, M.Pd.',
        '197203151998032004',
        'Dr. H. Bambang Soetopo, M.M.',
        '196805121992031003',
        '(021) 7890123',
        'sdn01nusantara@kemdikbud.go.id',
        'https://sdn01nusantara.sch.id',
        'Jl. Pendidikan Merdeka No. 45',
        '005/002',
        'Menteng',
        'Menteng',
        'Kota Jakarta Pusat',
        'DKI Jakarta',
        '10310',
        'Cerdas, Berkarakter, dan Berdaya Nalar Kritis',
        '2024/2025',
        'Ganjil',
        'Sekolah Penggerak'
    ),
    (
        'SDN02',
        'SDN 02 Kenanga',
        '20105080',
        'SD / MI',
        'Negeri',
        'A (Unggul)',
        'Kurikulum Merdeka',
        'Drs. Ahmad Fauzi, M.Pd.',
        '197508201999031002',
        'Dr. H. Bambang Soetopo, M.M.',
        '196805121992031003',
        '(021) 7890555',
        'sdn02kenanga@kemdikbud.go.id',
        'https://sdn02kenanga.sch.id',
        'Jl. Kenanga Indah No. 12',
        '003/004',
        'Gambir',
        'Gambir',
        'Kota Jakarta Pusat',
        'DKI Jakarta',
        '10110',
        'Berprestasi dalam Iptek, Kokoh dalam Imtaq',
        '2024/2025',
        'Ganjil',
        'Sekolah Rujukan Mutu'
    ),
    (
        'CENTRAL',
        'Pusat Data & Dinas Pendidikan Kota',
        '99999999',
        'SD / MI',
        'Negeri',
        'A (Unggul)',
        'Standar Nasional Pendidikan',
        'Drs. H. Mulyadi, M.Si.',
        '196502101990031004',
        'Prof. Dr. Suparman, M.Sc.',
        '196001011985031001',
        '(021) 5001234',
        'pusat@narasa.id',
        'https://disdik.jakarta.go.id',
        'Gedung Dinas Pendidikan Lt. 8, Jl. Gatot Subroto Kav. 40',
        '001/001',
        'Kuningan Barat',
        'Mampang Prapatan',
        'Kota Jakarta Selatan',
        'DKI Jakarta',
        '12710',
        'Pusat Integrasi & Akselerasi Mutu Pendidikan Indonesia',
        '2024/2025',
        'Ganjil',
        'Pusat Pengendali Mutu Pendidikan'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    npsn = EXCLUDED.npsn,
    level = EXCLUDED.level,
    status = EXCLUDED.status,
    accreditation = EXCLUDED.accreditation,
    curriculum = EXCLUDED.curriculum,
    headmaster = EXCLUDED.headmaster,
    headmaster_nip = EXCLUDED.headmaster_nip,
    supervisor_name = EXCLUDED.supervisor_name,
    supervisor_nip = EXCLUDED.supervisor_nip,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    website = EXCLUDED.website,
    address = EXCLUDED.address,
    rt_rw = EXCLUDED.rt_rw,
    village = EXCLUDED.village,
    district = EXCLUDED.district,
    city = EXCLUDED.city,
    province = EXCLUDED.province,
    postal_code = EXCLUDED.postal_code,
    motto = EXCLUDED.motto,
    academic_year = EXCLUDED.academic_year,
    active_semester = EXCLUDED.active_semester,
    category = EXCLUDED.category,
    updated_at = timezone('utc'::text, now());

/**
 * SEABRIS — Supabase Database Schema Architecture
 * Ready-to-execute SQL migration for PostgreSQL / Supabase
 * with Row Level Security (RLS) policies.
 */

export const SUPABASE_SQL_SCHEMA = `
-- 1. Table for AI Waste Scans
CREATE TABLE IF NOT EXISTS public.waste_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ticket_code VARCHAR(32) NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    detected_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    waste_category VARCHAR(64) NOT NULL,
    predicted_material VARCHAR(128) NOT NULL,
    confidence_score NUMERIC(4,3),
    verification_status VARCHAR(32) DEFAULT 'Belum Diverifikasi' CHECK (verification_status IN ('Belum Diverifikasi', 'Terverifikasi Petugas', 'Perlu Koreksi')),
    verified_by VARCHAR(128),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table for Waste Environmental Education & Reference
CREATE TABLE IF NOT EXISTS public.waste_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(64) NOT NULL,
    material VARCHAR(128) NOT NULL,
    biodegradation_info TEXT NOT NULL,
    environmental_impact TEXT NOT NULL,
    recycling_info TEXT NOT NULL,
    handling_recommendation TEXT NOT NULL,
    reference_source TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS) Enablement
ALTER TABLE public.waste_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_education ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone can read scans and education entries
CREATE POLICY "Allow public read access to waste scans" 
ON public.waste_scans FOR SELECT USING (true);

CREATE POLICY "Allow public read access to waste education" 
ON public.waste_education FOR SELECT USING (true);

-- Insert policy: Anyone can upload a new waste scan
CREATE POLICY "Allow public insert to waste scans" 
ON public.waste_scans FOR INSERT WITH CHECK (true);

-- Update policy: Only authenticated staff can update verification status
CREATE POLICY "Allow authenticated staff to update verification" 
ON public.waste_scans FOR UPDATE USING (auth.role() = 'authenticated');
`;

export interface SupabaseWasteScanRow {
  id: string;
  user_id: string | null;
  ticket_code: string;
  image_url: string;
  detected_items: any[];
  waste_category: string;
  predicted_material: string;
  confidence_score: number | null;
  verification_status: 'Belum Diverifikasi' | 'Terverifikasi Petugas' | 'Perlu Koreksi';
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface SupabaseWasteEducationRow {
  id: string;
  category: string;
  material: string;
  biodegradation_info: string;
  environmental_impact: string;
  recycling_info: string;
  handling_recommendation: string;
  reference_source: string;
  created_at: string;
}

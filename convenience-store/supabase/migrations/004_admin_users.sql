-- =============================================
-- Admin Users Table (Separate from customer auth)
-- =============================================

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow public read for login verification (password checked in app)
CREATE POLICY "admin_users_select" ON admin_users FOR SELECT USING (true);

-- =============================================
-- Insert default admin user
-- Username: admin
-- Password: admin1234 (plain text for demo, hash in production)
-- =============================================
INSERT INTO admin_users (username, password_hash, display_name) 
VALUES ('admin', 'admin1234', 'ผู้ดูแลระบบ')
ON CONFLICT (username) DO NOTHING;

-- Add another test admin
INSERT INTO admin_users (username, password_hash, display_name) 
VALUES ('manager', 'manager1234', 'ผู้จัดการร้าน')
ON CONFLICT (username) DO NOTHING;

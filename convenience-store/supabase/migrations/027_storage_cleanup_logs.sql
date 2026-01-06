-- Storage cleanup logs table for tracking auto-cleanup history
CREATE TABLE IF NOT EXISTS storage_cleanup_logs (
  id SERIAL PRIMARY KEY,
  bucket TEXT NOT NULL DEFAULT 'products',
  scanned_files INTEGER NOT NULL DEFAULT 0,
  orphaned_files INTEGER NOT NULL DEFAULT 0,
  deleted_files INTEGER NOT NULL DEFAULT 0,
  freed_bytes BIGINT NOT NULL DEFAULT 0,
  dry_run BOOLEAN NOT NULL DEFAULT true,
  errors JSONB DEFAULT '[]',
  skipped_tables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by date
CREATE INDEX IF NOT EXISTS idx_storage_cleanup_logs_created_at 
ON storage_cleanup_logs(created_at DESC);

-- RLS policies
ALTER TABLE storage_cleanup_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view cleanup logs
CREATE POLICY "Admins can view cleanup logs"
ON storage_cleanup_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Comment
COMMENT ON TABLE storage_cleanup_logs IS 'Tracks automatic storage cleanup operations';

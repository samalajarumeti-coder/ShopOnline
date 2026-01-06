-- =============================================
-- Role Upgrade Request System
-- =============================================

-- Role upgrade requests table
CREATE TABLE IF NOT EXISTS role_upgrade_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_role TEXT NOT NULL,
  to_role TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_upgrade_requests_user_id ON role_upgrade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_upgrade_requests_status ON role_upgrade_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE role_upgrade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_upgrade_requests
CREATE POLICY "Users can view own requests" ON role_upgrade_requests
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create own requests" ON role_upgrade_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update requests" ON role_upgrade_requests
  FOR UPDATE USING (is_admin());

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =============================================
-- Functions
-- =============================================

-- Function to request role upgrade
CREATE OR REPLACE FUNCTION request_role_upgrade(
  requested_role TEXT,
  reason_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  user_current_role TEXT;
  user_name TEXT;
  request_id INTEGER;
  admin_user_id UUID;
BEGIN
  SELECT role, full_name INTO user_current_role, user_name
  FROM public.profiles WHERE id = auth.uid();
  
  IF user_current_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  IF requested_role NOT IN ('manager', 'staff') THEN
    RETURN json_build_object('success', false, 'error', 'Can only request manager or staff role');
  END IF;
  
  IF user_current_role = 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'You are already an admin');
  END IF;
  
  IF user_current_role = 'manager' AND requested_role = 'staff' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot downgrade role');
  END IF;
  
  IF user_current_role = requested_role THEN
    RETURN json_build_object('success', false, 'error', 'You already have this role');
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.role_upgrade_requests 
    WHERE user_id = auth.uid() AND status = 'pending'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You already have a pending request');
  END IF;
  
  INSERT INTO public.role_upgrade_requests (user_id, from_role, to_role, reason)
  VALUES (auth.uid(), user_current_role, requested_role, reason_text)
  RETURNING id INTO request_id;
  
  FOR admin_user_id IN 
    SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      admin_user_id,
      'role_upgrade_request',
      'คำขอเลื่อนตำแหน่งใหม่',
      user_name || ' ขอเลื่อนตำแหน่งเป็น ' || requested_role,
      '/admin/users?request=' || request_id
    );
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Request submitted successfully',
    'request_id', request_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to review role upgrade request
CREATE OR REPLACE FUNCTION review_role_upgrade_request(
  request_id INTEGER,
  approve BOOLEAN,
  notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  req_user_id UUID;
  req_to_role TEXT;
  req_from_role TEXT;
  user_name TEXT;
BEGIN
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Only admin can review requests');
  END IF;
  
  SELECT user_id, to_role, from_role INTO req_user_id, req_to_role, req_from_role
  FROM public.role_upgrade_requests WHERE id = request_id;
  
  IF req_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Request not found');
  END IF;
  
  SELECT full_name INTO user_name FROM public.profiles WHERE id = req_user_id;
  
  UPDATE public.role_upgrade_requests
  SET 
    status = CASE WHEN approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    admin_notes = notes,
    updated_at = NOW()
  WHERE id = request_id;
  
  IF approve THEN
    UPDATE public.profiles
    SET role = req_to_role, updated_at = NOW()
    WHERE id = req_user_id;
    
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (
      auth.uid(),
      'role_upgrade_approved',
      'user',
      req_user_id::TEXT,
      json_build_object('role', req_from_role, 'name', user_name),
      json_build_object('role', req_to_role, 'approved_by', auth.uid())
    );
  END IF;
  
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    req_user_id,
    CASE WHEN approve THEN 'role_upgrade_approved' ELSE 'role_upgrade_rejected' END,
    CASE WHEN approve THEN 'คำขอได้รับการอนุมัติ' ELSE 'คำขอไม่ได้รับการอนุมัติ' END,
    CASE 
      WHEN approve THEN 'คำขอเลื่อนตำแหน่งเป็น ' || req_to_role || ' ได้รับการอนุมัติแล้ว'
      ELSE 'คำขอเลื่อนตำแหน่งเป็น ' || req_to_role || ' ไม่ได้รับการอนุมัติ'
    END
  );
  
  RETURN json_build_object(
    'success', true,
    'message', CASE WHEN approve THEN 'Request approved' ELSE 'Request rejected' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION request_role_upgrade(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION review_role_upgrade_request(INTEGER, BOOLEAN, TEXT) TO authenticated;

-- Helper functions to disable and enable audit triggers
-- This helps avoid foreign key constraint issues when inserting from edge functions

-- Function to disable audit trigger for a specific table
CREATE OR REPLACE FUNCTION disable_audit_trigger(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I DISABLE TRIGGER log_audit', table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable audit trigger for a specific table
CREATE OR REPLACE FUNCTION enable_audit_trigger(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE TRIGGER log_audit', table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

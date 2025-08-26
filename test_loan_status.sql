-- Test loan statuses and data structure
-- Run this in your Supabase SQL editor

-- Check all loan statuses
SELECT 
  'Loan Statuses' as info,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  SUM(outstanding_balance) as total_outstanding
FROM loans
GROUP BY status
ORDER BY count DESC;

-- Check if there are any loans at all
SELECT 
  'Total Loans' as info,
  COUNT(*) as total_loans,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_loans,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_loans,
  COUNT(CASE WHEN status = 'disbursed' THEN 1 END) as disbursed_loans,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_loans,
  COUNT(CASE WHEN status = 'defaulted' THEN 1 END) as defaulted_loans
FROM loans;

-- Check sample loan data
SELECT 
  'Sample Loan Data' as info,
  id,
  amount,
  outstanding_balance,
  status,
  farmer_group_id,
  created_at
FROM loans
ORDER BY created_at DESC
LIMIT 5;

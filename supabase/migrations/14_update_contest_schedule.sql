-- Update contest timing for Bell-State Challenge
-- To show exactly 10-10-2026 09:00 AM to 11-10-2026 12:00 PM in Indian Standard Time (IST / UTC+05:30):
UPDATE public.contests
SET 
  start_time = '2026-10-10 09:00:00+05:30',
  end_time   = '2026-10-11 12:00:00+05:30'
WHERE id = '49f3ee19-0f72-40f8-928c-ce6b071903fc'
   OR title ILIKE '%Bell-State Challenge%';


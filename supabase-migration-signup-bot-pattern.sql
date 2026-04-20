-- Emergency: add an explicit reject for the active bot signature (bot_*@stonybrook.edu)
-- plus tighten the rate limit to 3 per 30s.
-- This is a temporary patch; the durable fix is captcha or disabling mailer_autoconfirm.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  email_domain text;
  email_local  text;
  recent_count int;
BEGIN
  email_domain := lower(split_part(new.email, '@', 2));
  email_local  := lower(split_part(new.email, '@', 1));

  IF email_domain = ''
     OR (
       NOT EXISTS (SELECT 1 FROM public.auth_email_allowed_domains WHERE domain = email_domain)
       AND NOT EXISTS (SELECT 1 FROM public.auth_email_allowlist WHERE lower(email) = lower(new.email))
     )
  THEN
    RAISE EXCEPTION 'signup_email_not_approved: %', new.email
      USING ERRCODE = '22023';
  END IF;

  -- Known bot signatures (live during the current attack).
  IF email_local LIKE 'bot\_%' ESCAPE '\'
     OR email_local ~ '^test[0-9]+$'
  THEN
    RAISE EXCEPTION 'signup_blocked_pattern: %', new.email
      USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO recent_count
  FROM auth.users
  WHERE created_at > now() - interval '30 seconds';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'signup_rate_limited'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, university)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN email_domain = 'harvard.edu'    THEN 'harvard'
      WHEN email_domain = 'yale.edu'       THEN 'yale'
      WHEN email_domain = 'princeton.edu'  THEN 'princeton'
      WHEN email_domain = 'columbia.edu'   THEN 'columbia'
      WHEN email_domain = 'upenn.edu'      THEN 'upenn'
      WHEN email_domain = 'brown.edu'      THEN 'brown'
      WHEN email_domain = 'dartmouth.edu'  THEN 'dartmouth'
      WHEN email_domain = 'cornell.edu'    THEN 'cornell'
      WHEN email_domain = 'stanford.edu'   THEN 'stanford'
      WHEN email_domain = 'caltech.edu'    THEN 'caltech'
      WHEN email_domain = 'stonybrook.edu' THEN 'stonybrook'
      ELSE 'stonybrook'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.handle_new_agent_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'is_agent' = 'true' THEN
    INSERT INTO public.agent_profiles (user_id, agent_name, agency_name, phone, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'agent_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'agency_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_agent_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_agent_signup();

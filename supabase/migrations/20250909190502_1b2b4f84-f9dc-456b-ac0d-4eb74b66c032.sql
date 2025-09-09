-- Update family_members table to support invitation flow
ALTER TABLE family_invitations 
ADD COLUMN IF NOT EXISTS invitation_message TEXT DEFAULT 'Você foi convidado(a) para acompanhar uma jornada materna especial!';

-- Create edge function for sending invitation emails
CREATE OR REPLACE FUNCTION send_family_invitation(
  p_invited_email TEXT,
  p_invited_name TEXT,
  p_relationship TEXT,
  p_phone TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_token_result UUID;
  invitation_record RECORD;
BEGIN
  -- Check rate limiting
  IF NOT check_rate_limit('SEND_FAMILY_INVITATION', 5) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Limite de convites excedido');
  END IF;

  -- Validate inputs
  IF p_invited_email IS NULL OR p_invited_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email é obrigatório');
  END IF;

  IF p_invited_name IS NULL OR p_invited_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nome é obrigatório');
  END IF;

  -- Check if invitation already exists and is not expired
  SELECT * INTO invitation_record
  FROM family_invitations 
  WHERE invited_email = p_invited_email 
    AND inviter_id = auth.uid() 
    AND expires_at > now() 
    AND accepted_at IS NULL;

  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite já enviado para este email');
  END IF;

  -- Create new invitation
  INSERT INTO family_invitations (
    inviter_id,
    invited_email,
    invited_name,
    relationship,
    phone,
    invitation_message
  ) VALUES (
    auth.uid(),
    p_invited_email,
    p_invited_name,
    p_relationship,
    p_phone,
    COALESCE(p_message, 'Você foi convidado(a) para acompanhar uma jornada materna especial!')
  ) RETURNING invitation_token INTO invitation_token_result;

  -- Log the invitation
  PERFORM log_sensitive_access('family_invitations', 'CREATE', 
    jsonb_build_object(
      'invited_email', p_invited_email,
      'invited_name', p_invited_name,
      'relationship', p_relationship,
      'invitation_token', invitation_token_result
    ));

  RETURN jsonb_build_object(
    'success', true, 
    'invitation_token', invitation_token_result,
    'message', 'Convite enviado com sucesso!'
  );
END;
$$;
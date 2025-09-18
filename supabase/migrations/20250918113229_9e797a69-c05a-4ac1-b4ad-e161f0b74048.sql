-- Update the send_family_invitation function to handle duplicate invitations properly
CREATE OR REPLACE FUNCTION public.send_family_invitation(p_invited_email text, p_invited_name text, p_relationship text, p_phone text DEFAULT NULL::text, p_message text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Check if invitation already exists
  SELECT * INTO invitation_record
  FROM family_invitations 
  WHERE invited_email = p_invited_email 
    AND inviter_id = auth.uid();

  IF FOUND THEN
    -- If invitation exists but is expired or was accepted/rejected, update it to resend
    IF invitation_record.expires_at <= now() OR invitation_record.accepted_at IS NOT NULL THEN
      UPDATE family_invitations 
      SET 
        invited_name = p_invited_name,
        relationship = p_relationship,
        phone = p_phone,
        invitation_message = COALESCE(p_message, 'Você foi convidado(a) para acompanhar uma jornada materna especial!'),
        expires_at = now() + INTERVAL '7 days',
        created_at = now(),
        updated_at = now(),
        accepted_at = NULL,
        invitation_token = gen_random_uuid()
      WHERE id = invitation_record.id
      RETURNING invitation_token INTO invitation_token_result;
    ELSE
      -- If invitation is still valid and pending, return the existing token
      invitation_token_result := invitation_record.invitation_token;
    END IF;
  ELSE
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
  END IF;

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
$function$;
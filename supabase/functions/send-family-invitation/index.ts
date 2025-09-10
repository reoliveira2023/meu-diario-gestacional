import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  name: string;
  relationship: string;
  phone?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header and extract the JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { email, name, relationship, phone, message }: InvitationRequest = await req.json();

    console.log('Sending family invitation to:', email, 'from user:', authHeader);

    // Call the database function to create invitation
    const { data: invitationResult, error: dbError } = await supabase
      .rpc('send_family_invitation', {
        p_invited_email: email,
        p_invited_name: name,
        p_relationship: relationship,
        p_phone: phone,
        p_message: message
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    if (!invitationResult.success) {
      throw new Error(invitationResult.error);
    }

    // Get user profile for the email
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .single();

    const inviterName = userProfile?.full_name || 'uma futura mamãe';
    const invitationToken = invitationResult.invitation_token;
    const invitationUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/family-invitation?token=${invitationToken}`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "Materna <onboarding@resend.dev>",
      to: [email],
      subject: `${inviterName} convidou você para acompanhar sua jornada materna! 💕`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; font-size: 28px; margin: 0; font-weight: bold;">🤱 Materna</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">Acompanhe uma jornada materna especial</p>
            </div>

            <div style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); border-radius: 15px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 24px;">Você foi convidado(a)! 💝</h2>
              <p style="margin: 0; font-size: 16px; opacity: 0.9;">
                ${inviterName} gostaria de compartilhar sua jornada materna com você!
              </p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0;">Sobre você:</h3>
              <p style="margin: 5px 0; color: #475569;"><strong>Nome:</strong> ${name}</p>
              <p style="margin: 5px 0; color: #475569;"><strong>Parentesco:</strong> ${relationship}</p>
              ${phone ? `<p style="margin: 5px 0; color: #475569;"><strong>Telefone:</strong> ${phone}</p>` : ''}
            </div>

            ${message ? `
              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Mensagem especial:</h3>
                <p style="color: #92400e; margin: 0; font-style: italic;">"${message}"</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${invitationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);">
                🌟 Aceitar Convite
              </a>
            </div>

            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #047857; margin: 0 0 10px 0; font-size: 16px;">✨ Como visualizador, você poderá:</h3>
              <ul style="color: #047857; margin: 0; padding-left: 20px;">
                <li>Ver fotos e momentos especiais da gravidez</li>
                <li>Curtir e comentar nas fotos</li>
                <li>Acompanhar o crescimento do bebê</li>
                <li>Ler cartas especiais para o bebê</li>
                <li>Enviar mensagens de apoio e carinho</li>
              </ul>
            </div>

            <div style="text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p style="margin: 0;">
                Se você não conhece ${inviterName} ou não deseja participar, pode ignorar este email.
              </p>
              <p style="margin: 10px 0 0 0;">
                Este convite expira em 7 dias.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Convite enviado com sucesso!',
      invitation_token: invitationToken
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-family-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
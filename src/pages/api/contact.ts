import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();

  const prenom = data.get('prenom');
  const nom = data.get('nom');
  const email = data.get('email');
  const telephone = data.get('telephone');
  const service = data.get('service');
  const message = data.get('message');

  if (!prenom || !nom || !email || !message) {
    return new Response(JSON.stringify({ error: 'Champs manquants' }), { status: 400 });
  }

  // Email à ta tante
  const { error } = await resend.emails.send({
    from: 'Creaticlo <onboarding@resend.dev>',
    to: 'devoni.prog@gmail.com',
    replyTo: 'devoni.prog@gmail.com',
    subject: `Nouvelle demande de ${service} — ${prenom} ${nom}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #262626;">
        <h1 style="font-size: 24px; color: #262626; margin-bottom: 8px;">Nouvelle demande de contact</h1>
        <p style="color: #ec4899; font-size: 14px; margin-bottom: 32px; text-transform: uppercase; letter-spacing: 2px;">Creaticlo</p>
        
        <div style="background: #fdf2f8; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #ec4899; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; width: 120px;">Nom</td>
              <td style="padding: 8px 0; color: #404040; font-size: 14px;">${prenom} ${nom}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #ec4899; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</td>
              <td style="padding: 8px 0; color: #404040; font-size: 14px;">${email}</td>
            </tr>
            ${telephone ? `
            <tr>
              <td style="padding: 8px 0; color: #ec4899; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Téléphone</td>
              <td style="padding: 8px 0; color: #404040; font-size: 14px;">${telephone}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #ec4899; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service</td>
              <td style="padding: 8px 0; color: #404040; font-size: 14px;">${service}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fafafa; border-radius: 12px; padding: 24px;">
          <p style="color: #ec4899; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Message</p>
          <p style="color: #404040; font-size: 14px; line-height: 1.8; margin: 0;">${message}</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.log('Erreur Resend:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Email de confirmation au client
  const { error: errorConfirmation } = await resend.emails.send({
    from: 'Creaticlo <onboarding@resend.dev>',
    to: email.toString(),
    subject: `Nous avons bien reçu votre demande — Creaticlo`,
    html: `
      <div style="background-color: #f9f0f5 !important; padding: 40px 20px; min-height: 100vh;">
  <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background-color: #ffffff !important; border-radius: 24px; overflow: hidden;">

    <!-- Header rose pâle -->
    <div style="background-color: #fdf2f8 !important; text-align: center; padding: 40px 40px 32px;">
      <img src="https://creaticlo.netlify.app/logo-mail.png" alt="Creaticlo" style="height: 48px;" />
      <p style="color: #ec4899 !important; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-top: 8px;">Atelier de couture</p>
    </div>

    <!-- Contenu blanc -->
    <div style="padding: 40px;">

      <!-- Message principal -->
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #ec4899 !important; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px;">Confirmation de réception</p>
        <h2 style="font-size: 24px; color: #262626 !important; margin-bottom: 16px;">Merci ${prenom},</h2>
        <p style="color: #737373 !important; font-size: 15px; line-height: 1.8; margin-bottom: 8px;">
          Nous avons bien reçu votre demande concernant <strong style="color: #262626 !important;">${service}</strong>.
        </p>
        <p style="color: #737373 !important; font-size: 15px; line-height: 1.8;">
          Notre équipe reviendra vers vous dans les plus brefs délais, généralement sous <strong style="color: #262626 !important;">48 heures</strong>.
        </p>
      </div>

      <!-- Récap -->
      <div style="background: #fdf2f8 !important; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <p style="color: #ec4899 !important; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Récapitulatif de votre demande</p>
        <p style="color: #737373 !important; font-size: 14px; line-height: 1.8; margin: 0;">${message}</p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; border-top: 1px solid #fdf2f8 !important; padding-top: 24px;">
        <p style="color: #a3a3a3 !important; font-size: 12px; line-height: 1.8; margin: 0;">
          Creaticlo — Atelier de couture<br/>
          Proche de Bourgoin-Jallieu
        </p>
      </div>

    </div>
  </div>
</div>
    `,
  });

  if (errorConfirmation) {
    return new Response(JSON.stringify({ error: 'Erreur envoi confirmation' }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
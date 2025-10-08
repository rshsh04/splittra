export function renderConfirmEmailTemplate(opts: { actionLink: string; supportUrl: string; year?: number }) {
  const { actionLink, supportUrl, year = new Date().getFullYear() } = opts
  return `<!doctype html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirm your email</title>
    <style>
      .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; }
      @media (max-width: 600px) { .container { width:100% !important; } .px { padding-left:16px !important; padding-right:16px !important; } }
      a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f7f8fa; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;">
    <div class="preheader">Confirm your Splittra email address.</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f7f8fa;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 24px rgba(16,24,40,0.06);">
            <tr>
              <td align="center" style="padding:24px;">
                <img src="${process.env.EMAIL_LOGO_URL || 'https://kfixndvekvohfhrwzcbo.supabase.co/storage/v1/object/public/PP/logo.png'}" alt="Splittra" width="120" style="display:block; border:0; outline:none; text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td class="px" style="padding:0 32px;">
                <h2 style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:24px; line-height:32px; color:#111827; text-align:center;">Confirm your email</h2>
                <p style="margin:12px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:15px; line-height:24px; color:#4b5563; text-align:center;">Thanks for signing up for Splittra! Please confirm your email address to get started.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px 8px;">
                <a href="${actionLink}" style="display:inline-block; background:linear-gradient(90deg,#16a34a,#059669); color:#ffffff; text-decoration:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-weight:600; font-size:15px; line-height:20px; padding:12px 20px; border-radius:10px;">Confirm Email</a>
              </td>
            </tr>
            <tr>
              <td class="px" style="padding:8px 32px 24px;">
                <p style="margin:0; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace; font-size:12px; line-height:18px; color:#6b7280; word-break:break-all;">Or copy and paste this URL into your browser:<br />
                  <a href="${actionLink}" style="color:#16a34a; text-decoration:underline;">${actionLink}</a></p>
                <p style="margin:12px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:12px; line-height:20px; color:#9ca3af;">If you did not create an account, you can ignore this email.</p>
              </td>
            </tr>
            <tr><td style="height:1px; background:#e5e7eb;"></td></tr>
            <tr>
              <td align="center" style="padding:16px 24px;">
                <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:12px; color:#9ca3af;">Need help? <a href="${supportUrl}" style="color:#16a34a; text-decoration:underline;">Contact support</a></p>
                <p style="margin:8px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:12px; color:#9ca3af;">© ${year} Splittra</p>
              </td>
            </tr>
          </table>
          <div style="height:24px;"></div>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

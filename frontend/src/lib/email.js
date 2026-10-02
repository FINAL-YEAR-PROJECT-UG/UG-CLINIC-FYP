import sgMail from '@sendgrid/mail';

/**
 * Sends an email using SendGrid Mail API.
 *
 * @param {string | string[]} to - Recipient email address(es)
 * @param {string} subject - Email subject line
 * @param {string} htmlBody - HTML body content of the email
 * @returns {Promise<any>} SendGrid API response
 */
export async function sendEmail(to, subject, htmlBody) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not set in environment variables');
  }

  if (!fromEmail) {
    throw new Error('SENDGRID_FROM_EMAIL is not set in environment variables');
  }

  if (!String(apiKey).startsWith('SG.')) {
    throw new Error(
      'SENDGRID_API_KEY is invalid. SendGrid API keys must start with "SG.". ' +
      'Please verify your environment variable configuration.'
    );
  }

  sgMail.setApiKey(apiKey);

  const msg = {
    to,
    from: fromEmail,
    subject,
    html: htmlBody,
  };

  return await sgMail.send(msg);
}

export default sendEmail;

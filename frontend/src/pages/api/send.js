import { sendEmail } from '@/lib/email';

/**
 * Next.js API Route for sending emails via SendGrid.
 *
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`,
    });
  }

  const { to, subject, message } = req.body || {};

  if (!to || !subject || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: to, subject, and message are required',
    });
  }

  try {
    const result = await sendEmail(to, subject, `<p>${message}</p>`);
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('SendGrid email error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    });
  }
}

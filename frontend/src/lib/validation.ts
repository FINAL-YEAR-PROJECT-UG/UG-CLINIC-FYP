const UG_STUDENT_EMAIL_DOMAIN = '@st.ug.edu.gh';

/** Valid Ghana mobile network prefixes (without leading 0). Source: NCA numbering plan. */
export const GHANA_MOBILE_PREFIXES = [
  '20', '23', '24', '25', '26', '27', '50', '53', '54', '55', '56', '57', '59',
] as const;

export function isUgStudentEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@st\.ug\.edu\.gh$/.test(normalized);
}

export function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized);
}

export const emailValidationMessage =
  'Please enter a valid email address';

export function isValidStudentId(studentId: string): boolean {
  return /^\d{8}$/.test(studentId.trim());
}

export const studentIdMessage = 'Student ID must be exactly 8 digits (numbers only).';

export function validatePhoneNumber(phone: string): { valid: true } | { valid: false; message: string } {
  const cleaned = phone.replace(/[\s\-().]/g, '');

  if (!cleaned) {
    return { valid: false, message: 'Phone number is required.' };
  }

  if (cleaned.startsWith('+233') || cleaned.startsWith('233')) {
    let national = cleaned.replace(/^\+?233/, '');
    if (national.startsWith('0')) {
      national = national.slice(1);
    }

    if (!/^\d{9}$/.test(national)) {
      return {
        valid: false,
        message: 'Ghana numbers with +233 must have 9 digits after the country code (e.g. +233 24 123 4567).',
      };
    }

    const prefix = national.slice(0, 2);
    if (!GHANA_MOBILE_PREFIXES.includes(prefix as (typeof GHANA_MOBILE_PREFIXES)[number])) {
      return {
        valid: false,
        message:
          'Invalid Ghana mobile prefix. Valid prefixes include 020, 023, 024, 025, 026, 027, 050, 053, 054, 055, 056, 057, and 059.',
      };
    }

    return { valid: true };
  }

  if (cleaned.startsWith('0')) {
    if (!/^\d{10}$/.test(cleaned)) {
      return {
        valid: false,
        message: 'Ghana numbers must be 10 digits including the leading 0 (e.g. 024 123 4567).',
      };
    }

    const prefix = cleaned.slice(1, 3);
    if (!GHANA_MOBILE_PREFIXES.includes(prefix as (typeof GHANA_MOBILE_PREFIXES)[number])) {
      return {
        valid: false,
        message:
          'Invalid Ghana mobile prefix. Valid prefixes include 020, 023, 024, 025, 026, 027, 050, 053, 054, 055, 056, 057, and 059.',
      };
    }

    return { valid: true };
  }

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    if (!/^\d{7,15}$/.test(digits)) {
      return {
        valid: false,
        message:
          'Enter a valid international number with country code (e.g. +233 24 123 4567 or +1 555 123 4567).',
      };
    }

    if (digits.startsWith('233')) {
      return validatePhoneNumber(`+${digits}`);
    }

    return { valid: true };
  }

  return {
    valid: false,
    message: 'Phone number must start with +233 (Ghana) or + followed by your country code.',
  };
}

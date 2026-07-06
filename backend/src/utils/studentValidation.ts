const UG_STUDENT_EMAIL_DOMAIN = 'st.ug.edu.gh';

export const GHANA_MOBILE_PREFIXES = [
  '20', '23', '24', '25', '26', '27', '50', '53', '54', '55', '56', '57', '59',
];

export function isUgStudentEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@st\.ug\.edu\.gh$/.test(normalized);
}

export function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized);
}

export function isValidStudentId(studentId: string): boolean {
  return /^\d{8}$/.test(studentId.trim());
}

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
        message: 'Ghana numbers with +233 must have 9 digits after the country code.',
      };
    }

    const prefix = national.slice(0, 2);
    if (!GHANA_MOBILE_PREFIXES.includes(prefix)) {
      return {
        valid: false,
        message: 'Invalid Ghana mobile prefix.',
      };
    }

    return { valid: true };
  }

  if (cleaned.startsWith('0')) {
    if (!/^\d{10}$/.test(cleaned)) {
      return { valid: false, message: 'Ghana numbers must be 10 digits including the leading 0.' };
    }

    const prefix = cleaned.slice(1, 3);
    if (!GHANA_MOBILE_PREFIXES.includes(prefix)) {
      return { valid: false, message: 'Invalid Ghana mobile prefix.' };
    }

    return { valid: true };
  }

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    if (!/^\d{7,15}$/.test(digits)) {
      return { valid: false, message: 'Enter a valid international number with country code.' };
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

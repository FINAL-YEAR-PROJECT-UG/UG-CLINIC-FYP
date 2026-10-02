const UG_STUDENT_EMAIL_DOMAIN = '@st.ug.edu.gh';

/** Valid Ghana mobile network prefixes (without leading 0). Source: NCA numbering plan. */
export const GHANA_MOBILE_PREFIXES = [
  '20', '23', '24', '25', '26', '27', '50', '53', '54', '55', '56', '57', '59',
] as const;

// ─── Name / text field validators ──────────────────────────────────────────────

/**
 * Validates a name field (first name, last name, other names).
 * Only letters, spaces, hyphens, and apostrophes are allowed.
 * Must be at least 2 characters after trimming.
 */
export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && /^[A-Za-z\u00C0-\u024F\s'\-]+$/.test(trimmed);
}

export const nameValidationMessage =
  'Only letters, spaces, hyphens and apostrophes are allowed.';

/**
 * Returns true if the key event should be allowed for a name input.
 * Blocks digits and most punctuation while allowing control keys.
 */
export function isNameKeyAllowed(key: string): boolean {
  // Allow control / navigation keys
  if (key.length > 1) return true; // e.g. 'Backspace', 'ArrowLeft'
  return /^[A-Za-z\u00C0-\u024F\s'\-]$/.test(key);
}

/**
 * Filters a string to only contain allowed name characters.
 */
export function filterNameInput(value: string): string {
  return value.replace(/[^A-Za-z\u00C0-\u024F\s'\-]/g, '');
}

// ─── Phone number input filter ──────────────────────────────────────────────

/**
 * Returns true if the key event should be allowed for a phone input.
 * Only +, digits, and control keys are allowed.
 */
export function isPhoneKeyAllowed(key: string, currentValue: string): boolean {
  if (key.length > 1) return true; // Control keys
  if (key === '+') return currentValue.length === 0; // + only at start
  return /^\d$/.test(key);
}

/**
 * Filters a string to only contain allowed phone characters (+ and digits).
 * The + is kept only if it's the first character.
 */
export function filterPhoneInput(value: string): string {
  const digits = value.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    return '+' + digits.slice(1).replace(/[^\d]/g, '');
  }
  return digits.replace(/[^\d]/g, '');
}

// ─── Student ID ─────────────────────────────────────────────────────────────

/**
 * Only digits allowed; returns true if the key should be accepted.
 */
export function isStudentIdKeyAllowed(key: string): boolean {
  if (key.length > 1) return true;
  return /^\d$/.test(key);
}

/**
 * Filters to digits only.
 */
export function filterStudentIdInput(value: string): string {
  return value.replace(/\D/g, '');
}

// ─── Existing validators ────────────────────────────────────────────────────

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

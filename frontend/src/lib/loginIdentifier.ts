export type StudentEmailLookup = (studentId: string) => Promise<string | null>;

export async function resolveLoginEmail(
  identifier: string,
  findStudentEmail: StudentEmailLookup,
): Promise<string | null> {
  const normalizedIdentifier = identifier.trim();
  if (normalizedIdentifier.includes("@")) {
    return normalizedIdentifier.toLowerCase();
  }

  if (!/^\d{8}$/.test(normalizedIdentifier)) {
    return null;
  }

  const email = await findStudentEmail(normalizedIdentifier);
  return email?.trim().toLowerCase() || null;
}

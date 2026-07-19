/** Derive two-letter avatar initials from a display name. */
export function getUserInitials(fullName: string | undefined | null): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Primary subtitle for the user menu — email, username, or role. */
export function getUserSubtitle(input: {
  email?: string;
  username?: string;
  role?: string;
}): string {
  const email = input.email?.trim();
  if (email) return email;
  const username = input.username?.trim();
  if (username) return username;
  return input.role?.trim() || 'User';
}

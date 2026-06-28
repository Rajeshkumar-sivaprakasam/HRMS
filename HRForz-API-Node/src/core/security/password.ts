import bcrypt from 'bcryptjs';

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:',.<>?/`~])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:',.<>?/`~]{8,}$/;

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function validatePasswordStrength(password: string): boolean {
  return PASSWORD_PATTERN.test(password);
}

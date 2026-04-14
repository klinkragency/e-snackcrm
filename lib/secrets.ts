import { randomBytes } from "crypto"

/** 32 random bytes hex — suitable for JWT/cookie secrets. */
export function generateSecret(): string {
  return randomBytes(32).toString("hex")
}

/** 24 hex chars — friendlier for DB passwords that may be pasted into URLs. */
export function generatePassword(): string {
  return randomBytes(12).toString("hex")
}

/** Generates the 4 secrets auto-assigned at client creation. */
export function generateClientSecrets() {
  return {
    jwtSecret: generateSecret(),
    cookieSecret: generateSecret(),
    postgresPassword: generatePassword(),
    minioRootPassword: generatePassword(),
  }
}

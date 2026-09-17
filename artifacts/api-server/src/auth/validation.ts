export class RequestValidationError extends Error {}

export type RegisterInput = { name: string; email: string; password: string };
export type LoginInput = { email: string; password: string };

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("Request body must be an object.");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") throw new RequestValidationError(`${field} must be a string.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new RequestValidationError(`${field} must be between ${min} and ${max} characters.`);
  }
  return normalized;
}

function email(value: unknown): string {
  const normalized = text(value, "email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new RequestValidationError("email must be valid.");
  }
  return normalized;
}

export function parseRegisterInput(value: unknown): RegisterInput {
  const input = object(value);
  return {
    name: text(input.name, "name", 2, 160),
    email: email(input.email),
    password: text(input.password, "password", 12, 256),
  };
}

export function parseLoginInput(value: unknown): LoginInput {
  const input = object(value);
  return {
    email: email(input.email),
    password: text(input.password, "password", 1, 256),
  };
}

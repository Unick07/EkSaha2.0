export const PASSWORD_RULES = [
  { test: (value) => value.length >= 8, label: "at least 8 characters" },
  { test: (value) => /[A-Z]/.test(value), label: "one uppercase letter" },
  { test: (value) => /[a-z]/.test(value), label: "one lowercase letter" },
  { test: (value) => /[0-9]/.test(value), label: "one number" },
  { test: (value) => /[!@#$%^&*]/.test(value), label: "one special character (!@#$%^&*)" },
];

const STRENGTH_LEVELS = [
  { label: "Weak", barColor: "bg-red-500", textColor: "text-red-600 dark:text-red-400" },
  { label: "Fair", barColor: "bg-amber-500", textColor: "text-amber-600 dark:text-amber-400" },
  { label: "Strong", barColor: "bg-primary", textColor: "text-primary" },
  { label: "Very Strong", barColor: "bg-emerald-500", textColor: "text-emerald-600 dark:text-emerald-400" },
];

export function passwordStrength(value) {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  const level = STRENGTH_LEVELS[Math.max(0, Math.min(passed, 5) - 2)] || STRENGTH_LEVELS[0];
  return { passed, ...level };
}

export function failedPasswordRules(value) {
  return PASSWORD_RULES.filter((rule) => !rule.test(value));
}

export const demoUsers = [
  {
    id: "demo-user",
    name: "Demo User",
    email: "user@eksaha.dev",
    password: "password",
    role: "user",
  },
  {
    id: "demo-admin",
    name: "Demo Admin",
    email: "admin@eksaha.dev",
    password: "password",
    role: "admin",
  },
];

export function findDemoUser(email, password) {
  return demoUsers.find(
    (user) => user.email === email?.toLowerCase()?.trim() && user.password === password,
  );
}

export function findDemoUserById(id) {
  return demoUsers.find((user) => user.id === id);
}

export function publicDemoUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

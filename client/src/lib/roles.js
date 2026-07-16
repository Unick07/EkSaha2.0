export const roleHome = {
  admin: "/admin",
  support: "/support",
  billing: "/billing",
  user: "/dashboard",
};

export const homeForRole = (role) => roleHome[role] || "/dashboard";

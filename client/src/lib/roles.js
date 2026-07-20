export const roleHome = {
  admin: "/admin",
  support: "/support",
  billing: "/billing",
  user: "/dashboard",
};

export const homeForRole = (role) => roleHome[role] || "/dashboard";

const ticketsRouteByRole = {
  admin: "/admin/tickets",
  support: "/support/tickets",
  billing: "/billing/tickets",
  user: "/dashboard/tickets",
};

export const ticketsRouteForRole = (role) => ticketsRouteByRole[role] || "/dashboard/tickets";

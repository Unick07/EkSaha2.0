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

export const roleBadgeClass = {
  admin: "bg-primary/10 text-primary",
  support: "bg-primary/10 text-primary",
  billing: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
};

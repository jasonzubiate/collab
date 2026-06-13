export type DashboardNavIcon = "inbox" | "megaphone" | "settings";

export type DashboardNavLink = {
  href: string;
  label: string;
  icon: DashboardNavIcon;
};

export type DashboardUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  profileHref: string;
};

/**
 * Permission constants — mirrors backend PermissionEnum
 */
export const P = {
  // Users
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  USERS_DELETE: "users:delete",

  // Roles & Permissions
  ROLES_READ: "roles:read",
  ROLES_WRITE: "roles:write",
  ROLES_DELETE: "roles:delete",
  PERMISSIONS_READ: "permissions:read",
  PERMISSIONS_WRITE: "permissions:write",

  // Admins
  ADMINS_MANAGE: "admins:manage",

  // Orders
  ORDERS_READ: "orders:read",
  ORDERS_WRITE: "orders:write",

  // Products
  PRODUCTS_READ: "products:read",
  PRODUCTS_WRITE: "products:write",
  PRODUCTS_DELETE: "products:delete",

  // Catalog
  CATEGORIES_READ: "categories:read",
  CATEGORIES_WRITE: "categories:write",
  BRANDS_READ: "brands:read",
  BRANDS_WRITE: "brands:write",
  COLLECTIONS_READ: "collections:read",
  COLLECTIONS_WRITE: "collections:write",
  METALS_READ: "metals:read",
  METALS_WRITE: "metals:write",
  ATTRIBUTES_READ: "attributes:read",
  ATTRIBUTES_WRITE: "attributes:write",
  RATES_READ: "rates:read",
  RATES_WRITE: "rates:write",

  // Marketing
  SLIDES_READ: "slides:read",
  SLIDES_WRITE: "slides:write",

  // Inquiries
  INQUIRIES_READ: "inquiries:read",
  INQUIRIES_WRITE: "inquiries:write",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
} as const;

export type Permission = (typeof P)[keyof typeof P];

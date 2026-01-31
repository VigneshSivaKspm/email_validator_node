/**
 * Detects if an email is a role-based address
 * Role addresses are typically not assigned to individuals (admin@, support@, info@, etc.)
 */
export declare const isRoleEmail: (email: string) => boolean;
export declare const getRoleType: (email: string) => string | null;

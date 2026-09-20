/**
 * MEIL ESG Connect - Role-Based Access Control (RBAC) & Auth Middleware
 * Supports 6 enterprise governance roles for SEBI BRSR compliance.
 */

const ROLES = {
  GROUP_ADMIN: 'Group ESG Admin',
  SUBSIDIARY_APPROVER: 'Subsidiary Approver',
  BU_REVIEWER: 'Business Unit Reviewer',
  DATA_ENTRY: 'Project Data Entry User',
  AUDITOR: 'Auditor/Assurance Provider',
  BOARD_VIEWER: 'Board Viewer'
};

const PERMISSIONS = {
  READ: 'read',
  WRITE_ENERGY: 'write_energy',
  UPLOAD_EVIDENCE: 'upload_evidence',
  OVERRIDE_FACTORS: 'override_factors',
  APPROVE_FILING: 'approve_filing',
  DIGITAL_SIGN: 'digital_sign',
  AUDIT_NOTE: 'audit_note'
};

const ROLE_PERMISSIONS = {
  [ROLES.GROUP_ADMIN]: [
    PERMISSIONS.READ,
    PERMISSIONS.WRITE_ENERGY,
    PERMISSIONS.UPLOAD_EVIDENCE,
    PERMISSIONS.OVERRIDE_FACTORS,
    PERMISSIONS.APPROVE_FILING,
    PERMISSIONS.DIGITAL_SIGN,
    PERMISSIONS.AUDIT_NOTE
  ],
  [ROLES.SUBSIDIARY_APPROVER]: [
    PERMISSIONS.READ,
    PERMISSIONS.APPROVE_FILING,
    PERMISSIONS.AUDIT_NOTE
  ],
  [ROLES.BU_REVIEWER]: [
    PERMISSIONS.READ,
    PERMISSIONS.AUDIT_NOTE
  ],
  [ROLES.DATA_ENTRY]: [
    PERMISSIONS.READ,
    PERMISSIONS.WRITE_ENERGY,
    PERMISSIONS.UPLOAD_EVIDENCE,
    PERMISSIONS.AUDIT_NOTE
  ],
  [ROLES.AUDITOR]: [
    PERMISSIONS.READ,
    PERMISSIONS.DIGITAL_SIGN,
    PERMISSIONS.AUDIT_NOTE
  ],
  [ROLES.BOARD_VIEWER]: [
    PERMISSIONS.READ
  ]
};

/**
 * Validates if role has requested permission
 */
function hasPermission(userRole, requiredPermission) {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredPermission);
}

/**
 * Express middleware to enforce permission on route
 */
function requirePermission(permission) {
  return (req, res, next) => {
    // Check role from HTTP header or Supabase auth token
    const userRole = req.headers['x-user-role'] || req.user?.role || ROLES.GROUP_ADMIN; // default fallback for development
    if (hasPermission(userRole, permission)) {
      req.currentRole = userRole;
      return next();
    }
    return res.status(403).json({
      error: 'Forbidden: Insufficient Permissions',
      requiredPermission: permission,
      activeRole: userRole,
      message: `The active role '${userRole}' does not have authority to perform '${permission}'.`
    });
  };
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  requirePermission
};

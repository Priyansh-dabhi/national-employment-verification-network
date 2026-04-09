export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role?.toUpperCase();
        const allowed = allowedRoles.map(r => r.toUpperCase());
        if (!userRole || !allowed.includes(userRole)) {
            return res.status(403).json({
                message: 'Forbidden. You do not have permission to access this resource.'
            });
        }
        next();
    };
};

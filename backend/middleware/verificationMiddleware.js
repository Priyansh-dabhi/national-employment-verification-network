export const requireVerified = (req, res, next) => {
    if (!req.user || req.user.account_status !== 'VERIFIED') {
        return res.status(403).json({
            error: 'Access denied. User not verified.'
        });
    }
    next();
};

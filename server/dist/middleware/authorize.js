export async function authorize(...roles) {
    return function (req, res, next) {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: "Access Denied" });
            return;
        }
        next();
    };
}

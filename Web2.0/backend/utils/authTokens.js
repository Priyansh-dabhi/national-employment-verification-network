import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const REFRESH_COOKIE_NAME = 'nevn_refresh_token';

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7);
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

export const getRefreshExpiryDate = () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
    return expiresAt;
};

export const signAccessToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

export const signRefreshToken = (payload) =>
    jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` });

export const verifyRefreshToken = (token) =>
    jwt.verify(token, REFRESH_TOKEN_SECRET);

export const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');

export const setRefreshTokenCookie = (res, token) => {
    res.cookie(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
        path: '/api/auth',
    });
};

export const clearRefreshTokenCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api/auth',
    });
};

export const getCookieValue = (req, cookieName) => {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
        return null;
    }

    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.trim().split('=');
        if (name === cookieName) {
            return decodeURIComponent(valueParts.join('='));
        }
    }

    return null;
};

import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

export const verifyWebhookSignature = (req, res, next) => {
    const signature = req.headers['x-nevs-signature'];
    if (!signature) {
        return res.status(401).json({ message: 'Missing Webhook Signature' });
    }

    // Express parsing might slightly alter whitespace in JSON strings,
    // so we need the raw body for strict HMAC, but for this demo standard parsing is ok if stringified consistently.
    // However, if it fails, a custom body parser for raw body might be needed. We'll use the parsed body stringified.
    const payload = JSON.stringify(req.body);
    const secret = process.env.WEBHOOK_SECRET || 'nevs-webhook-hmac-secret';

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(401).json({ message: 'Invalid Webhook Signature' });
    }

    next();
};

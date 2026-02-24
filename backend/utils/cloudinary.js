import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

export const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'nevn_documents',
                type: 'private',
                access_mode: 'authenticated',
                resource_type: 'raw' // Allow any file type (PDF, zip, encrypted binary)
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

export const generateSignedUrl = (publicId) => {
    try {
        // Generate a URL that expires in 5 minutes (300 seconds)
        const timestamp = Math.round(new Date().getTime() / 1000) + 300;

        const signedUrl = cloudinary.url(publicId, {
            type: 'private',
            sign_url: true,
            secure: true,
            resource_type: 'raw',
            expires_at: timestamp
        });

        return signedUrl;
    } catch (error) {
        throw new Error('Failed to generate signed URL');
    }
};

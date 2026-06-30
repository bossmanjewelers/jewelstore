import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),

  jwt: {
    secret: process.env.JWT_SECRET || 'jewelstore_dev_secret_change_in_production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'jewelstore_dev_refresh_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'JewelStore <noreply@jewelstore.com>',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  store: {
    name: process.env.STORE_NAME || 'My Jewelry Store',
    currency: process.env.STORE_CURRENCY || 'INR',
    taxRate: parseFloat(process.env.STORE_TAX_RATE || '3'),
  },
};

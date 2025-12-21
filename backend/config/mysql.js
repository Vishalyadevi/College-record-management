import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'record',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || 'Monisha_018',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to MySQL using Sequelize');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};

export { sequelize, connectDB };
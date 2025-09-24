import { sequelize } from '../models/index.js';

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    await sequelize.sync({ alter: true }); // Automatically create/update tables
    console.log('✅ All tables created/updated successfully.');

    process.exit();
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();
import User from '../models/User';
import { UserRole } from '../types/index';
import { logger } from './logger';

export const seedAdmin = async (): Promise<void> => {
  try {
    const adminsToSeed = [
      {
        email: 'admin@postpilot.in',
        userName: 'System Admin PostPilot',
        password: 'test1234',
      },
      {
        email: 'admin@admin.in',
        userName: 'System Admin Main',
        password: 'test1234',
      }
    ];

    for (const adminData of adminsToSeed) {
      const existingAdmin = await User.findOne({ email: adminData.email });

      if (existingAdmin) {
        if (existingAdmin.role !== UserRole.ADMIN) {
          existingAdmin.role = UserRole.ADMIN;
          await existingAdmin.save();
          logger.info(`Admin user ${adminData.email} exists but was not admin. Promoted successfully.`);
        } else {
          logger.info(`Admin user ${adminData.email} already exists with admin role. Skipping seeding.`);
        }
      } else {
        logger.info(`Seeding admin user: ${adminData.email}...`);
        const admin = new User({
          email: adminData.email,
          userName: adminData.userName,
          password: adminData.password,
          role: UserRole.ADMIN,
          isActive: true,
          emailVerified: true,
        });

        await admin.save();
        logger.info(`Admin user ${adminData.email} seeded successfully!`);
      }
    }
  } catch (error) {
    logger.error('Failed to seed admin users:', error);
  }
};

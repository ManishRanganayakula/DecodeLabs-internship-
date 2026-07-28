/**
 * Seeds the database with an initial admin user and a handful of sample
 * users. Run with: npm run seed
 */
const { connectDB, disconnectDB } = require('./connection');
const User = require('../models/User.model');
const logger = require('../utils/logger');

const seedUsers = [
  {
    name: 'System Admin',
    email: 'admin@smartuserapi.com',
    password: 'Admin@1234',
    age: 30,
    phoneNumber: '+919876543210',
    address: { street: 'HQ Street', city: 'Hyderabad', state: 'TS', zipCode: '500001', country: 'India' },
    role: 'admin',
  },
  {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    password: 'Jane@1234',
    age: 25,
    phoneNumber: '+919876500000',
    address: { street: '12 Baker Street', city: 'Mumbai', state: 'MH', zipCode: '400001', country: 'India' },
    role: 'user',
  },
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    password: 'John@1234',
    age: 28,
    phoneNumber: '+919876511111',
    address: { street: '5 Oak Avenue', city: 'Delhi', state: 'DL', zipCode: '110001', country: 'India' },
    role: 'user',
  },
];

const run = async () => {
  await connectDB();
  try {
    await User.deleteMany({});
    await User.create(seedUsers);
    logger.info(`Seeded ${seedUsers.length} users successfully.`);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

run();

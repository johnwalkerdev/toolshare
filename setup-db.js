#!/usr/bin/env node

/**
 * 🚀 ToolShare Database Setup Script
 * Automatically configures the database after Vercel deployment
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function setupDatabase() {
  console.log('🚀 Starting ToolShare database setup...\n');

  try {
    // Step 1: Generate Prisma Client
    console.log('📦 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated\n');

    // Step 2: Push database schema
    console.log('🗄️ Creating database tables...');
    await execAsync('npx prisma db push');
    console.log('✅ Database schema created\n');

    // Step 3: Seed database
    console.log('🌱 Seeding database with initial data...');
    await execAsync('npx prisma db seed');
    console.log('✅ Database seeded successfully\n');

    console.log('🎉 Database setup completed!');
    console.log('\n📋 Default users created:');
    console.log('   👑 Admin: admin@toolshare.com / admin123');
    console.log('   👤 Test:  test@toolshare.com / test123');
    console.log('\n🌐 Your ToolShare is ready to use!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if DATABASE_URL is configured in Vercel');
    console.log('2. Ensure your database is accessible');
    console.log('3. Verify Prisma schema is valid');
    process.exit(1);
  }
}

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not found!');
  console.log('📋 Please configure DATABASE_URL in your Vercel dashboard');
  process.exit(1);
}

setupDatabase();
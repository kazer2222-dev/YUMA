import { config } from 'dotenv';
import * as path from 'path';

// Load .env file
config();

console.log('=== Environment Check ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

if (!process.env.DATABASE_URL) {
  console.error('\n❌ DATABASE_URL is not set!');
  console.error('Please check your .env file.');
  process.exit(1);
} else {
  console.log('\n✅ DATABASE_URL is set correctly');
  process.exit(0);
}


















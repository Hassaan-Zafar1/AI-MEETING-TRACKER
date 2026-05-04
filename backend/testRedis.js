require('dotenv').config();
const redis = require('redis');

const testRedisConnection = async () => {
  try {
    console.log('🔍 Testing Redis connection...');
    console.log('REDIS_URL:', process.env.REDIS_URL);

    if (!process.env.REDIS_URL || !process.env.REDIS_URL.startsWith('rediss://')) {
      console.error('❌ REDIS_URL format is incorrect!');
      console.error('\n📋 How to fix:');
      console.error('1. Go to https://console.upstash.io');
      console.error('2. Select your Redis database');
      console.error('3. Click "Connect" button');
      console.error('4. Copy the connection string (it looks like: rediss://default:PASSWORD@HOST:PORT)');
      console.error('5. Replace REDIS_URL in .env with this value');
      console.error('\nCurrent REDIS_URL:', process.env.REDIS_URL);
      process.exit(1);
    }

    const client = redis.createClient({
      url: process.env.REDIS_URL,
    });

    client.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });

    await client.connect();
    console.log('✅ Redis connected successfully!');

    // Test by setting a key
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    console.log('✅ Test write/read successful:', value);

    await client.del('test_key');
    await client.quit();
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.error('\nPossible fixes:');
    console.error('1. Verify Upstash Redis is active at https://console.upstash.io');
    console.error('2. Check if database is paused (click Resume if needed)');
    console.error('3. Check internet connection');
    console.error('4. Ensure firewall allows outgoing connections');
  }
};

testRedisConnection();


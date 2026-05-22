#!/usr/bin/env node

/**
 * Teste standalone para upload Cloudinary
 * Executa bypass Next.js para isolar o problema
 */

const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

console.log('🔍 TEST: Reading .env.local');

// Read .env.local manually
const envPath = path.join(__dirname, 'apps/.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (err) {
  console.warn('⚠️ TEST: Could not read .env.local, using process.env directly');
}

// Parse .env file
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      process.env[key] = value;
    }
  }
});

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

console.log('🔍 TEST: ENV CHECK', {
  hasCloudName: !!CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!CLOUDINARY_API_KEY,
  hasApiSecret: !!CLOUDINARY_API_SECRET,
  cloudName: CLOUDINARY_CLOUD_NAME,
});

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('🔴 TEST: Missing environment variables!');
  console.error('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

console.log('🔍 TEST: Configuring Cloudinary');
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

console.log('✅ TEST: Cloudinary configured');

// Create test image buffer (1x1 pixel PNG)
const pngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
  0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

console.log('🔍 TEST: Starting upload with buffer:', {
  length: pngBuffer.length,
  type: typeof pngBuffer,
});

const stream = cloudinary.uploader.upload_stream(
  {
    folder: 'nexorder',
    resource_type: 'auto',
    timeout: 60000,
  },
  (error, result) => {
    if (error) {
      console.error('🔴 TEST: Upload failed!');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('HTTP code:', error.http_code);
      if (error.http_body) {
        console.error('HTTP body (first 500 chars):', String(error.http_body).slice(0, 500));
      }
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2).slice(0, 1000));
      process.exit(1);
    }

    console.log('✅ TEST: Upload successful!');
    console.log('Result:', {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
    });
    console.log('\n✅ Cloudinary is working correctly!');
    process.exit(0);
  }
);

stream.on('error', (err) => {
  console.error('🔴 TEST: Stream error event:', err);
  process.exit(1);
});

console.log('🔍 TEST: Writing buffer to stream');
try {
  stream.end(pngBuffer);
  console.log('🔍 TEST: Buffer written, waiting for response...');
} catch (err) {
  console.error('🔴 TEST: Error writing to stream:', err);
  process.exit(1);
}

// Timeout after 30 seconds
setTimeout(() => {
  console.error('🔴 TEST: Timeout - no response from Cloudinary after 30 seconds');
  process.exit(1);
}, 30000);

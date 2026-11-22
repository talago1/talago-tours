import assert from 'node:assert';
import { normalizePhoneNumber, normalizePhoneForWhatsApp, buildWhatsAppLink } from '../src/utils/sanitize';
import { validateCheckoutForm } from '../src/utils/bookingValidation';

console.log('=== RUNNING TALAGO FOCUSED FIXES REGRESSION TESTS ===\n');

// ---------------------------------------------------------------------------
// 1. Phone Normalization & WhatsApp Links Tests
// ---------------------------------------------------------------------------
console.log('1. Testing Egyptian phone normalization with all prefixes (010, 011, 012, 015)...');

const egyptTestCases = [
  { input: '01012345678', expected: '+201012345678', desc: 'Local 010 (Vodafone)' },
  { input: '01112345678', expected: '+201112345678', desc: 'Local 011 (Etisalat)' },
  { input: '01212345678', expected: '+201212345678', desc: 'Local 012 (Orange)' },
  { input: '01512345678', expected: '+201512345678', desc: 'Local 015 (WE)' },
  { input: '+20 01012345678', expected: '+201012345678', desc: '+20 with space and domestic zero' },
  { input: '+2001012345678', expected: '+201012345678', desc: '+200 concatenated with domestic zero' },
  { input: '2001012345678', expected: '+201012345678', desc: '200 without plus' },
  { input: '201012345678', expected: '+201012345678', desc: '20 without plus and no trunk zero' },
  { input: '+201012345678', expected: '+201012345678', desc: 'Already canonical +2010 (IDEMPOTENT)' },
  { input: '+20201012345678', expected: '+201012345678', desc: 'Duplicate +20 country code prefix' },
  { input: '+20 +201012345678', expected: '+201012345678', desc: 'Repeated +20 with spaces' },
  { input: '1012345678', expected: '+201012345678', desc: '10 digits without leading 0 with default +20' },
];

for (const tc of egyptTestCases) {
  const result = normalizePhoneNumber(tc.input, '+20');
  assert.strictEqual(result, tc.expected, `Failed on ${tc.desc}: got ${result}, expected ${tc.expected}`);
  // Idempotency check:
  const doubleNormalized = normalizePhoneNumber(result, '+20');
  assert.strictEqual(doubleNormalized, tc.expected, `Idempotency failed on ${tc.desc}: got ${doubleNormalized}`);
  // Verify it never starts with malformed prefix +21
  assert.ok(!result.startsWith('+21'), `Malformed prefix +21 detected on ${tc.desc}: got ${result}`);
  console.log(`  ✓ ${tc.desc}: "${tc.input}" -> "${result}"`);
}

console.log('\n2. Testing international number preservation (UK, Germany, Ukraine, US, etc.)...');
const intlTestCases = [
  { input: '+380 50 123 4567', expected: '+380501234567', desc: 'Ukraine (+380): do NOT strip 0 from 380' },
  { input: '+44 07123456789', expected: '+447123456789', desc: 'UK (+44) with domestic trunk zero' },
  { input: '+44 7123456789', expected: '+447123456789', desc: 'UK (+44) canonical' },
  { input: '+49 0170 1234567', expected: '+491701234567', desc: 'Germany (+49) with domestic trunk zero' },
  { input: '+49 170 1234567', expected: '+491701234567', desc: 'Germany (+49) canonical' },
  { input: '+1 555 123 4567', expected: '+15551234567', desc: 'US (+1) number' },
];

for (const tc of intlTestCases) {
  const result = normalizePhoneNumber(tc.input);
  assert.strictEqual(result, tc.expected, `Failed on ${tc.desc}: got ${result}, expected ${tc.expected}`);
  const double = normalizePhoneNumber(result);
  assert.strictEqual(double, tc.expected, `Idempotency failed on ${tc.desc}: got ${double}`);
  console.log(`  ✓ ${tc.desc}: "${tc.input}" -> "${result}"`);
}

console.log('\n3. Testing WhatsApp link generation (wa.me/<digits>)...');
const waTestCases = [
  { input: '+20 01012345678', expectedDigits: '201012345678', expectedUrl: 'https://wa.me/201012345678' },
  { input: '01112345678', expectedDigits: '201112345678', expectedUrl: 'https://wa.me/201112345678' },
  { input: '+44 07123456789', expectedDigits: '447123456789', expectedUrl: 'https://wa.me/447123456789' },
];

for (const tc of waTestCases) {
  const digits = normalizePhoneForWhatsApp(tc.input);
  assert.strictEqual(digits, tc.expectedDigits, `Digits mismatch: got ${digits}, expected ${tc.expectedDigits}`);
  const url = buildWhatsAppLink(tc.input);
  assert.strictEqual(url, tc.expectedUrl, `URL mismatch: got ${url}, expected ${tc.expectedUrl}`);
  const urlWithMsg = buildWhatsAppLink(tc.input, 'Hello World');
  assert.strictEqual(urlWithMsg, `${tc.expectedUrl}?text=Hello%20World`);
  console.log(`  ✓ WhatsApp link for "${tc.input}": "${url}"`);
}

// ---------------------------------------------------------------------------
// 4. Hotel Name & Room Number Validation Tests
// ---------------------------------------------------------------------------
console.log('\n4. Testing Hotel Name and Room Number optionality in checkout validation...');

// Case A: requiresHotelPickup is false (e.g. self-arrival, ticket, no hotel pickup)
const errorsWithoutHotel = validateCheckoutForm({
  tourId: 'tour-123',
  travelDate: new Date(Date.now() + 86400000 * 2).toISOString(),
  guestCount: 2,
  customerName: 'Ahmed Ali',
  customerPhone: '+201012345678',
  customerEmail: 'ahmed@example.com',
  requiresHotelPickup: false,
  hotelName: '', // empty!
});
assert.strictEqual(errorsWithoutHotel.hotelName, undefined, 'Hotel name should NOT be required when requiresHotelPickup is false');
console.log('  ✓ Hotel Name is not required when requiresHotelPickup is false');

// Case B: requiresHotelPickup is true and hotelName is missing
const errorsWithHotelMissing = validateCheckoutForm({
  tourId: 'tour-123',
  travelDate: new Date(Date.now() + 86400000 * 2).toISOString(),
  guestCount: 2,
  customerName: 'Ahmed Ali',
  customerPhone: '+201012345678',
  customerEmail: 'ahmed@example.com',
  requiresHotelPickup: true,
  pickupType: 'hotel',
  hotelName: '',
});
assert.ok(errorsWithHotelMissing.hotelName, 'Hotel name should be required when requiresHotelPickup is true');
console.log('  ✓ Hotel Name is required when requiresHotelPickup is true');

// Case C: Meeting point pickup mode (no hotel required)
const errorsMeetingPoint = validateCheckoutForm({
  tourId: 'tour-123',
  travelDate: new Date(Date.now() + 86400000 * 2).toISOString(),
  guestCount: 2,
  customerName: 'Ahmed Ali',
  customerPhone: '+201012345678',
  customerEmail: 'ahmed@example.com',
  pickupType: 'meeting_point',
  hotelName: '',
});
assert.strictEqual(errorsMeetingPoint.hotelName, undefined, 'Hotel name should NOT be required for meeting point pickup');
console.log('  ✓ Hotel Name is not required when pickupType is meeting_point');

console.log('\n ALL REGRESSION TESTS PASSED SUCCESSFULLY! \n');

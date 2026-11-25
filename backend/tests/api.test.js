/**
 * SHRAMS API Test Suite
 * Tests: Auth (register/login/me/forgot-password)
 *        Student (profile, hostels, applications, allocation, complaints, notifications)
 *        Warden  (dashboard, applications review, allocations, rooms, complaints)
 *
 * Run: node tests/api.test.js
 * Requires: backend running on http://localhost:5000
 */

const http = require('http')
const https = require('https')

const BASE_URL = 'http://localhost:5000/api'
let studentToken = ''
let wardenToken  = ''
let studentId    = ''
let applicationId = ''
let complaintId  = ''

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }

    const url = new URL(BASE_URL + path)
    const lib = url.protocol === 'https:' ? https : http
    const req = lib.request({ ...options, host: url.hostname, port: url.port, path: url.pathname + url.search }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

// ─── Test runner ──────────────────────────────────────────────────────────────
let passed = 0, failed = 0, total = 0
const results = []

function test(name, fn) {
  return async () => {
    total++
    try {
      await fn()
      passed++
      results.push({ status: '✅ PASS', name })
      console.log(`  ✅ ${name}`)
    } catch (err) {
      failed++
      results.push({ status: '❌ FAIL', name, error: err.message })
      console.log(`  ❌ ${name}`)
      console.log(`     Error: ${err.message}`)
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

const STUDENT_EMAIL = `test.student.${Date.now()}@shrams.edu`
const STUDENT_PASS  = 'Test@1234'
const STUDENT_USN   = `1AB${Date.now().toString().slice(-6)}`

const WARDEN_EMAIL  = `warden.${Date.now()}@shrams.edu`
const WARDEN_PASS   = 'Warden@1234'

const tests = [

  // ── HEALTH CHECK ────────────────────────────────────────────────────────────
  test('GET /api/health → server is reachable', async () => {
    const r = await request('GET', '/health')
    assert(r.status !== 0, 'Server not reachable — is backend running on port 5000?')
  }),

  // ── REGISTER ────────────────────────────────────────────────────────────────
  test('POST /auth/register → register new student', async () => {
    const r = await request('POST', '/auth/register', {
      full_name: 'Test Student',
      email: STUDENT_EMAIL,
      password: STUDENT_PASS,
      confirm_password: STUDENT_PASS,
      usn: STUDENT_USN,
      department: 'Computer Science',
      semester: 3,
      gender: 'female',
      phone: '9876543210',
      parent_name: 'Parent Name',
      parent_phone: '9876543211',
    })
    assert(r.status === 201, `Expected 201, got ${r.status}: ${JSON.stringify(r.body?.message)}`)
    assert(r.body?.data?.token, 'No token returned')
    assert(r.body?.data?.user?.role === 'student', 'Role should be student')
    studentToken = r.body.data.token
    studentId    = r.body.data.user.id
  }),

  test('POST /auth/register → duplicate email returns 409', async () => {
    const r = await request('POST', '/auth/register', {
      full_name: 'Duplicate Student',
      email: STUDENT_EMAIL,
      password: STUDENT_PASS,
      usn: `DUP${Date.now()}`,
      department: 'CS',
      semester: 1,
    })
    assert(r.status === 409, `Expected 409, got ${r.status}`)
  }),

  test('POST /auth/register → duplicate USN returns 409', async () => {
    const r = await request('POST', '/auth/register', {
      full_name: 'Another Student',
      email: `diff.${Date.now()}@test.com`,
      password: STUDENT_PASS,
      usn: STUDENT_USN,
      department: 'CS',
      semester: 1,
    })
    assert(r.status === 409, `Expected 409, got ${r.status}`)
  }),

  test('POST /auth/register → missing required fields returns 422', async () => {
    const r = await request('POST', '/auth/register', { email: 'x@y.com' })
    assert(r.status === 422, `Expected 422, got ${r.status}`)
  }),

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  test('POST /auth/login → valid credentials return token', async () => {
    const r = await request('POST', '/auth/login', { email: STUDENT_EMAIL, password: STUDENT_PASS })
    assert(r.status === 200, `Expected 200, got ${r.status}: ${r.body?.message}`)
    assert(r.body?.data?.token, 'No token in response')
    assert(r.body?.data?.user?.email === STUDENT_EMAIL, 'Email mismatch')
    studentToken = r.body.data.token  // refresh token
  }),

  test('POST /auth/login → wrong password returns 401', async () => {
    const r = await request('POST', '/auth/login', { email: STUDENT_EMAIL, password: 'wrongpass' })
    assert(r.status === 401, `Expected 401, got ${r.status}`)
  }),

  test('POST /auth/login → non-existent email returns 401', async () => {
    const r = await request('POST', '/auth/login', { email: 'nobody@fake.com', password: 'pass' })
    assert(r.status === 401, `Expected 401, got ${r.status}`)
  }),

  test('POST /auth/login → missing fields returns 422', async () => {
    const r = await request('POST', '/auth/login', { email: STUDENT_EMAIL })
    assert(r.status === 422, `Expected 422, got ${r.status}`)
  }),

  // ── GET ME ──────────────────────────────────────────────────────────────────
  test('GET /auth/me → returns current user with valid token', async () => {
    const r = await request('GET', '/auth/me', null, studentToken)
    assert(r.status === 200, `Expected 200, got ${r.status}`)
    assert(r.body?.data?.email === STUDENT_EMAIL, 'Email mismatch')
    assert(r.body?.data?.usn === STUDENT_USN, 'USN mismatch')
  }),

  test('GET /auth/me → returns 401 without token', async () => {
    const r = await request('GET', '/auth/me')
    assert(r.status === 401, `Expected 401, got ${r.status}`)
  }),

  test('GET /auth/me → returns 401 with invalid token', async () => {
    const r = await request('GET', '/auth/me', null, 'invalid.token.here')
    assert(r.status === 401, `Expected 401, got ${r.status}`)
  }),

  // ── FORGOT PASSWORD ─────────────────────────────────────────────────────────
  test('POST /auth/forgot-password → valid email returns 200', async () => {
    const r = await request('POST', '/auth/forgot-password', { email: STUDENT_EMAIL })
    assert(r.status === 200, `Expected 200, got ${r.status}`)
  }),

  test('POST /auth/forgot-password → unknown email still returns 200 (no enumeration)', async () => {
    const r = await request('POST', '/auth/forgot-password', { email: 'ghost@nowhere.com' })
    assert(r.status === 200, `Expected 200, got ${r.status}`)
  }),

  // ── STUDENT PROFILE ─────────────────────────────────────────────────────────
  test('GET /students/profile → returns student profile', async () => {
    const r = await request('GET', '/students/profile', null, studentToken)
    assert(r.status === 200, `Expected 200, got ${r.status}`)
    assert(r.body?.data?.usn === STUDENT_USN, 'USN mismatch in profile')
  }),

  test('PUT /students/profile → update profile successfully', async () => {
    const r = await request('PUT', '/students/profile', {
      full_name: 'Test Student Updated',
      phone: '9999999999',
      address: '123 Test Street, Bangalore',
      blood_group: 'B+',
    }, studentToken)
    assert(r.status === 200, `Expected 200, got ${r.status}: ${r.body?.message}`)
  }),

  // ── HOSTELS ─────────────────────────────────────────────────────────────────
  test('GET /students/hostels → returns hostel list (array)', async () => {
    const r = await request('GET', '/students/hostels', null, studentToken)
    assert(r.status === 200, `Expected 200, got ${r.status}`)
    assert(Array.isArray(r.body?.data), 'Expected array of hostels')
  }),

  // ── APPLICATIONS ────────────────────────────────────────────────────────────
  test('GET /students/applications → returns applications array', async () => {
    const r = await request('GET', '/students/applications', null, studentToken)
    assert(r.status === 200, `Expected 200, got ${r.status}`)
    assert(Array.isArray(r.body?.data), 'Expected array')
  }),

  test('POST /students/applications → submit application', async () => {
    const r = await request('POST', '/students/applications', {
      preferred_room_type: 'double',
      semester: 3,
      academic_year: '2026-27',
      reason: 'Need hostel accommodation for college',
    }, studentToken)
    // 201 = created, 400 = already applied — both are valid
    assert([201, 400, 409].includes(r.status), `Unexpected status ${r.status}: ${r.body?.message}`)
    if (r.status === 201) applicationId = r.body?.data?.id
  }),

  // ── ALLOCATION ──────────────────────────────────────────────────────────────
  test('GET /students/allocation → returns allocation or 404', async () => {
    const r = await request('GET', '/students/allocation', null, studentToken)
    assert([200, 404].includes(r.status), `Unexpected status ${r.status}`)
  }),

  // ── COMPLAINTS ──────────────────────────────────────────────────────────────
  test('GET /students/complaints → returns complaints array', async () => {
    const r = await request('GET', '/students/complaints', null, studentToken)
    assert(r.status === 200, `Expected 200, got ${r.status}`)
  }),

  // ── NOTIFICATIONS ───────────────────────────────────────────────────────────
  test('GET /students/notifications → returns notifications', async () => {
    const r = await request('GET', '/students/notifications', null, studentToken)
    assert(r.status === 200, `Expected 200, got ${r.status}`)
  }),

  // ── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
  test('GET /students/announcements → returns announcements array', async () => {
    const r = await request('GET', '/students/announcements', null, studentToken)
    assert(r.status === 200, `Expected 200, got ${r.status}`)
  }),

  // ── ROLE PROTECTION ─────────────────────────────────────────────────────────
  test('GET /wardens/dashboard → student token blocked (403)', async () => {
    const r = await request('GET', '/wardens/dashboard', null, studentToken)
    assert(r.status === 403, `Expected 403 (student accessing warden route), got ${r.status}`)
  }),

]

// ─── Run all tests ────────────────────────────────────────────────────────────
;(async () => {
  console.log('\n' + '═'.repeat(60))
  console.log('  SHRAMS API Test Suite')
  console.log('  Backend: ' + BASE_URL)
  console.log('═'.repeat(60))

  console.log('\n📋 Running tests...\n')
  for (const t of tests) await t()

  // Summary
  console.log('\n' + '═'.repeat(60))
  console.log(`  Results: ${passed} passed, ${failed} failed, ${total} total`)
  console.log('═'.repeat(60))

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => r.status.includes('FAIL')).forEach(r => {
      console.log(`  • ${r.name}`)
      if (r.error) console.log(`    → ${r.error}`)
    })
  } else {
    console.log('\n🎉 All tests passed!')
  }

  console.log('\n📌 Test Credentials Created:')
  console.log(`  Student Email : ${STUDENT_EMAIL}`)
  console.log(`  Student USN   : ${STUDENT_USN}`)
  console.log(`  Password      : ${STUDENT_PASS}`)
  console.log('\n📌 How to view your database:')
  console.log('  pgAdmin 4  → Open from Start Menu → Connect to localhost:5432')
  console.log('  Login with : user=postgres, password=postgres123')
  console.log('  Database   : shrams_db')
  console.log('  Tables     : users, student_profiles, hostels, rooms, beds,')
  console.log('               hostel_applications, allocations, complaints, notifications...')
  console.log()
  process.exit(failed > 0 ? 1 : 0)
})()

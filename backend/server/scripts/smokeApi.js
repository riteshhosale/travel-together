 

const CANDIDATE_PORTS = [5000, 5001, 5002, 5003];

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  return {
    status: res.status,
    text,
    ok: res.ok,
  };
}

async function detectBaseUrl() {
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  for (const port of CANDIDATE_PORTS) {
    const baseUrl = `http://localhost:${port}`;
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.status >= 200 && res.status < 600) {
        return baseUrl;
      }
    } catch (_e) {
      // try next port
    }
  }

  throw new Error('Unable to detect API base URL. Set API_BASE_URL and retry.');
}

function printResult(result) {
  const status = result.pass ? 'PASS' : 'FAIL';
  const details = result.details ? ` | ${result.details}` : '';
  console.log(`${status} | ${result.method} ${result.path} -> ${result.actual}${details}`);
}

function isAllowed(actual, expected) {
  return expected.includes(actual);
}

(async () => {
  const results = [];

  try {
    const baseUrl = await detectBaseUrl();
    console.log(`Using API base URL: ${baseUrl}`);

    // Public endpoints
    {
      const r = await request(`${baseUrl}/api/health`);
      results.push({
        method: 'GET',
        path: '/api/health',
        expected: [200],
        actual: r.status,
        pass: isAllowed(r.status, [200]),
      });
    }

    {
      const r = await request(`${baseUrl}/api/ready`);
      results.push({
        method: 'GET',
        path: '/api/ready',
        expected: [200, 503],
        actual: r.status,
        pass: isAllowed(r.status, [200, 503]),
      });
    }

    {
      const r = await request(`${baseUrl}/metrics`);
      results.push({
        method: 'GET',
        path: '/metrics',
        expected: [200],
        actual: r.status,
        pass: isAllowed(r.status, [200]),
      });
    }

    {
      const r = await request(`${baseUrl}/api/feed`);
      results.push({
        method: 'GET',
        path: '/api/feed',
        expected: [200],
        actual: r.status,
        pass: isAllowed(r.status, [200]),
      });
    }

    {
      const r = await request(`${baseUrl}/api/stats`);
      results.push({
        method: 'GET',
        path: '/api/stats',
        expected: [200],
        actual: r.status,
        pass: isAllowed(r.status, [200]),
      });
    }

    // Auth flow
    const stamp = Date.now();
    const email = `smoke_${stamp}@example.com`;
    const password = 'Smoke123!';
    const registerBody = {
      name: 'Smoke Check User',
      email,
      password,
      location: 'Pune',
    };

    let token = '';

    {
      const r = await request(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(registerBody),
      });

      let parsed;
      try {
        parsed = JSON.parse(r.text);
      } catch (_e) {
        parsed = null;
      }

      if (parsed && parsed.token) {
        token = parsed.token;
      }

      results.push({
        method: 'POST',
        path: '/api/auth/register',
        expected: [201],
        actual: r.status,
        pass: isAllowed(r.status, [201]),
      });
    }

    if (!token) {
      const r = await request(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let parsed;
      try {
        parsed = JSON.parse(r.text);
      } catch (_e) {
        parsed = null;
      }

      if (parsed && parsed.token) {
        token = parsed.token;
      }

      results.push({
        method: 'POST',
        path: '/api/auth/login',
        expected: [200],
        actual: r.status,
        pass: isAllowed(r.status, [200]),
      });
    }

    if (!token) {
      throw new Error('Could not obtain token from register/login flow.');
    }

    const authHeaders = {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    };

    // Authenticated endpoints
    {
      const r = await request(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: authHeaders,
      });

      results.push({
        method: 'GET',
        path: '/api/auth/me',
        expected: [200],
        actual: r.status,
        pass: isAllowed(r.status, [200]),
      });
    }

    let firstTripId = '';

    {
      const r = await request(`${baseUrl}/api/trips`, {
        method: 'GET',
        headers: authHeaders,
      });

      let parsed;
      try {
        parsed = JSON.parse(r.text);
      } catch (_e) {
        parsed = null;
      }

      if (Array.isArray(parsed) && parsed[0] && parsed[0]._id) {
        firstTripId = parsed[0]._id;
      }

      results.push({
        method: 'GET',
        path: '/api/trips',
        expected: [200],
        actual: r.status,
        pass: isAllowed(r.status, [200]),
      });
    }

    {
      const r = await request(`${baseUrl}/api/users/profile`, {
        method: 'GET',
        headers: authHeaders,
      });

      results.push({
        method: 'GET',
        path: '/api/users/profile',
        expected: [200],
        actual: r.status,
        pass: isAllowed(r.status, [200]),
      });
    }

    {
      const r = await request(`${baseUrl}/api/match/trips`, {
        method: 'GET',
        headers: authHeaders,
      });

      results.push({
        method: 'GET',
        path: '/api/match/trips',
        expected: [200],
        actual: r.status,
        pass: isAllowed(r.status, [200]),
      });
    }

    {
      const r = await request(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ message: 'hello' }),
      });

      // 200/400/429 are acceptable smoke responses (route is wired and reachable)
      results.push({
        method: 'POST',
        path: '/api/ai/chat',
        expected: [200, 400, 429],
        actual: r.status,
        pass: isAllowed(r.status, [200, 400, 429]),
      });
    }

    if (firstTripId) {
      const r = await request(`${baseUrl}/api/messages/${firstTripId}`, {
        method: 'GET',
        headers: authHeaders,
      });

      results.push({
        method: 'GET',
        path: '/api/messages/:tripId',
        expected: [200, 403],
        actual: r.status,
        pass: isAllowed(r.status, [200, 403]),
      });
    } else {
      results.push({
        method: 'GET',
        path: '/api/messages/:tripId',
        expected: [200, 403],
        actual: 'SKIP',
        pass: true,
        details: 'no trip id available',
      });
    }

    console.log('\nSmoke Check Results:');
    results.forEach(printResult);

    const failed = results.filter((r) => !r.pass);
    if (failed.length > 0) {
      console.log(`\nFailed checks: ${failed.length}`);
      process.exit(1);
    }

    console.log(`\nAll checks passed: ${results.length}/${results.length}`);
  } catch (err) {
    console.error('Smoke check failed to execute:', err.message);
    process.exit(1);
  }
})();

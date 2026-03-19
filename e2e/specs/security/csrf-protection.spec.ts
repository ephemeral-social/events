import { test, expect } from '@playwright/test';

test.describe('CSRF Protection', () => {
  test('POST from allowed origin succeeds', async ({ request }) => {
    const res = await request.post('http://127.0.0.1:5173/api/auth/send-code', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://127.0.0.1:5173'
      },
      data: {
        phone: '5550990500',
        countryCode: '1'
      }
    });
    // Should not be blocked by CSRF (may fail for other reasons)
    expect(res.status()).not.toBe(403);
  });

  test('POST from disallowed origin returns 403', async ({ request }) => {
    const res = await request.post('http://127.0.0.1:5173/api/auth/send-code', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.com'
      },
      data: {
        phone: '5550990501',
        countryCode: '1'
      }
    });
    // SvelteKit CSRF protection should block this
    expect(res.status()).toBe(403);
  });

  test('POST without origin header allowed (same-origin)', async ({ request }) => {
    const res = await request.post('http://127.0.0.1:5173/api/auth/send-code', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        phone: '5550990502',
        countryCode: '1'
      }
    });
    // Without origin header, SvelteKit may allow (same-origin behavior)
    expect(res.status()).not.toBe(403);
  });

  test('security headers present', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    // Check for common security headers
    expect(headers['x-content-type-options'] || '').toBe('nosniff');
  });
});

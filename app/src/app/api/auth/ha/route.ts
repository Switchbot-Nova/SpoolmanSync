import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Get the base URL for OAuth callbacks from the request.
 * This handles various scenarios including reverse proxies and Docker networking.
 */
function getBaseUrl(request: NextRequest): string {
  // Explicit override always wins
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Check for forwarded host (reverse proxy scenario)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0].trim() || request.headers.get('host');

  if (!host) {
    // Fallback to nextUrl.origin (shouldn't happen in practice)
    console.warn('[OAuth] No host header found, falling back to nextUrl.origin');
    return request.nextUrl.origin;
  }

  // Determine protocol (check for reverse proxy HTTPS termination)
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const protocol = forwardedProto?.split(',')[0].trim() || 'http';

  return `${protocol}://${host}`;
}

/**
 * Initiate OAuth2 flow with Home Assistant
 * GET /api/auth/ha?ha_url=http://homeassistant:8123
 */
export async function GET(request: NextRequest) {
  let haUrl = request.nextUrl.searchParams.get('ha_url');

  if (!haUrl) {
    return NextResponse.json({ error: 'ha_url is required' }, { status: 400 });
  }

  // Remove trailing slashes to prevent double-slash URLs
  haUrl = haUrl.replace(/\/+$/, '');

  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  // Get the callback URL (where HA will redirect after auth)
  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/ha/callback`;

  // Store the state, HA URL, and clientId temporarily for the callback
  // Storing clientId ensures we use the exact same value for token exchange
  await prisma.settings.upsert({
    where: { key: 'oauth_state' },
    update: { value: JSON.stringify({ state, haUrl, clientId: baseUrl }) },
    create: { key: 'oauth_state', value: JSON.stringify({ state, haUrl, clientId: baseUrl }) },
  });

  // Build the authorization URL
  // Home Assistant uses a standard OAuth2 flow
  const authUrl = new URL(`${haUrl}/auth/authorize`);
  authUrl.searchParams.set('client_id', baseUrl);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);

  return NextResponse.json({ authUrl: authUrl.toString() });
}

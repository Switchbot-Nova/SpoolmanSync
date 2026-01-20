import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

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

  // Store the state and HA URL temporarily for the callback
  await prisma.settings.upsert({
    where: { key: 'oauth_state' },
    update: { value: JSON.stringify({ state, haUrl }) },
    create: { key: 'oauth_state', value: JSON.stringify({ state, haUrl }) },
  });

  // Get the callback URL (where HA will redirect after auth)
  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/ha/callback`;

  // Build the authorization URL
  // Home Assistant uses a standard OAuth2 flow
  const authUrl = new URL(`${haUrl}/auth/authorize`);
  authUrl.searchParams.set('client_id', baseUrl);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);

  return NextResponse.json({ authUrl: authUrl.toString() });
}

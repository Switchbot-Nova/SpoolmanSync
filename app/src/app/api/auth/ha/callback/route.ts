import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * OAuth2 callback from Home Assistant
 * GET /api/auth/ha/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?error=missing_params', request.url));
  }

  try {
    // Retrieve the stored state and HA URL
    const storedData = await prisma.settings.findUnique({
      where: { key: 'oauth_state' },
    });

    if (!storedData) {
      return NextResponse.redirect(new URL('/settings?error=invalid_state', request.url));
    }

    const { state: storedState, haUrl: rawHaUrl } = JSON.parse(storedData.value);
    // Remove trailing slashes to prevent double-slash URLs
    const haUrl = rawHaUrl.replace(/\/+$/, '');

    // Verify CSRF token
    if (state !== storedState) {
      return NextResponse.redirect(new URL('/settings?error=invalid_state', request.url));
    }

    // Clean up the stored state
    await prisma.settings.delete({ where: { key: 'oauth_state' } });

    // Exchange the authorization code for tokens
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const tokenResponse = await fetch(`${haUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: baseUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', request.url));
    }

    const tokens = await tokenResponse.json();

    // Calculate token expiry
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    // Store the connection
    await prisma.hAConnection.deleteMany();
    await prisma.hAConnection.create({
      data: {
        url: haUrl,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: 'connection',
        message: 'Home Assistant connected via OAuth',
      },
    });

    return NextResponse.redirect(new URL('/settings?success=ha_connected', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=oauth_failed', request.url));
  }
}

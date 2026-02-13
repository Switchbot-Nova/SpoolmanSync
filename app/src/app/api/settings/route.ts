import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SpoolmanClient } from '@/lib/api/spoolman';
import {
  isEmbeddedMode,
  isAddonMode,
  getEmbeddedHAUrl,
  HomeAssistantClient,
  checkHAOnboardingStatus,
  completeHAOnboarding,
} from '@/lib/api/homeassistant';
import { createActivityLog } from '@/lib/activity-log';

export async function GET() {
  try {
    const embeddedMode = isEmbeddedMode();
    const addonMode = isAddonMode();
    const spoolmanConnection = await prisma.spoolmanConnection.findFirst();

    // In add-on mode, HA is always connected via Supervisor
    if (addonMode) {
      // Verify Supervisor connection works
      const client = HomeAssistantClient.forAddon();
      const haConnected = client ? await client.checkConnection() : false;

      // Auto-configure Spoolman from addon config if not already set in DB
      let activeSpoolmanConnection = spoolmanConnection;
      const envSpoolmanUrl = process.env.SPOOLMAN_URL?.replace(/\/+$/, '');
      if (!activeSpoolmanConnection && envSpoolmanUrl) {
        try {
          const spoolmanClient = new SpoolmanClient(envSpoolmanUrl);
          const isValid = await spoolmanClient.checkConnection();
          if (isValid) {
            await spoolmanClient.ensureRequiredFieldsExist();
            await prisma.spoolmanConnection.deleteMany();
            await prisma.spoolmanConnection.create({ data: { url: envSpoolmanUrl } });
            activeSpoolmanConnection = { id: '', url: envSpoolmanUrl, createdAt: new Date(), updatedAt: new Date() };
            console.log(`Spoolman auto-configured from addon config: ${envSpoolmanUrl}`);
            await createActivityLog({ type: 'connection', message: 'Spoolman connected via addon configuration' });
          } else {
            console.log(`Spoolman URL from addon config is not reachable: ${envSpoolmanUrl}`);
          }
        } catch (err) {
          console.error('Failed to auto-configure Spoolman from addon config:', err);
        }
      }

      return NextResponse.json({
        embeddedMode: false,
        addonMode: true,
        homeassistant: haConnected ? {
          url: 'Home Assistant (via Supervisor)',
          connected: true,
        } : null,
        spoolman: activeSpoolmanConnection ? {
          url: activeSpoolmanConnection.url,
          connected: true,
        } : null,
      });
    }

    // In embedded mode, check if HA is reachable
    let haConnected = false;
    let haUrl = '';

    if (embeddedMode) {
      haUrl = getEmbeddedHAUrl();

      // First check if we have a stored connection (from previous onboarding)
      let storedConnection = await prisma.hAConnection.findFirst();

      if (storedConnection) {
        // We have stored credentials, try to use them
        const client = new HomeAssistantClient(
          haUrl,
          storedConnection.accessToken,
          storedConnection.refreshToken,
          storedConnection.expiresAt,
          true,
          storedConnection.clientId
        );
        haConnected = await client.checkConnection();
        console.log('Embedded HA connection with stored token:', haConnected ? 'success' : 'failed');
      }

      if (!haConnected) {
        // Check if HA needs onboarding
        console.log('No stored connection, checking HA onboarding status...');
        const onboardingStatus = await checkHAOnboardingStatus(haUrl);
        console.log('HA onboarding status:', JSON.stringify(onboardingStatus));

        if (onboardingStatus.error) {
          // Couldn't determine onboarding status - HA might not be ready yet
          console.log('Could not check onboarding status, HA may still be starting');
          // haConnected stays false, UI will show "waiting" state
        } else if (onboardingStatus.needsOnboarding) {
          // Auto-complete onboarding
          console.log('HA needs onboarding, completing automatically...');
          const result = await completeHAOnboarding(haUrl);

          if (result.success && result.accessToken) {
            // Store the service account credentials
            await prisma.hAConnection.deleteMany();
            await prisma.hAConnection.create({
              data: {
                url: haUrl,
                clientId: 'http://spoolmansync',
                accessToken: result.accessToken,
                refreshToken: result.refreshToken || null,
                expiresAt: result.expiresAt || null,
              },
            });
            console.log('HA onboarding complete, service account credentials stored');

            // Store admin login credentials for users to access HA
            if (result.servicePassword) {
              await prisma.settings.upsert({
                where: { key: 'ha_admin_credentials' },
                create: {
                  key: 'ha_admin_credentials',
                  value: JSON.stringify({
                    username: 'admin',
                    password: result.servicePassword,
                  }),
                },
                update: {
                  value: JSON.stringify({
                    username: 'admin',
                    password: result.servicePassword,
                  }),
                },
              });
              console.log('Admin credentials stored for HA access');
            }

            haConnected = true;
          } else {
            console.error('Auto-onboarding failed:', result.error);
          }
        } else {
          // Onboarding already done but we don't have a token
          // This shouldn't happen in normal flow - maybe HA was set up manually
          console.log('Onboarding complete but no stored token - HA may have been set up manually');
          // Try to check if HA API is accessible (it won't be without token)
          const client = HomeAssistantClient.forEmbedded();
          haConnected = await client.checkConnection();
          console.log('Embedded HA connection (no token):', haConnected ? 'success' : 'failed');
        }
      }
    } else {
      const haConnection = await prisma.hAConnection.findFirst();
      if (haConnection) {
        haUrl = haConnection.url;
        haConnected = true;
      }
    }

    // Get admin credentials for embedded mode
    let adminCredentials = null;
    if (embeddedMode && haConnected) {
      const adminCredsSetting = await prisma.settings.findUnique({
        where: { key: 'ha_admin_credentials' },
      });
      if (adminCredsSetting) {
        try {
          const creds = JSON.parse(adminCredsSetting.value);
          adminCredentials = {
            username: creds.username,
            password: creds.password,
          };
        } catch {
          console.error('Failed to parse admin credentials');
        }
      }

      // Note: If no admin credentials exist, they weren't stored during initial onboarding.
      // This can happen if the HA instance was set up before this feature was added.
      // The credentials can only be created during fresh onboarding - HA's user management
      // API is WebSocket-only, not REST API.
    }

    return NextResponse.json({
      embeddedMode,
      addonMode: false,
      homeassistant: haConnected ? {
        url: haUrl,
        connected: true,
        adminCredentials, // Only populated in embedded mode
      } : null,
      spoolman: spoolmanConnection ? {
        url: spoolmanConnection.url,
        connected: true,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, url, config } = body;

    if (type === 'filter_config') {
      // Save spool filter configuration
      await prisma.settings.upsert({
        where: { key: 'spool_filter_config' },
        create: {
          key: 'spool_filter_config',
          value: JSON.stringify(config || []),
        },
        update: {
          value: JSON.stringify(config || []),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (type === 'spoolman') {
      // Validate Spoolman connection
      const client = new SpoolmanClient(url);
      const isValid = await client.checkConnection();

      if (!isValid) {
        return NextResponse.json({ error: 'Cannot connect to Spoolman' }, { status: 400 });
      }

      // Ensure required extra fields exist in Spoolman
      // This includes active_tray (for tray assignments) and barcode (for QR scanning)
      try {
        await client.ensureRequiredFieldsExist();
      } catch (error) {
        console.error('Failed to ensure required fields:', error);
        return NextResponse.json({
          error: 'Connected to Spoolman but failed to configure required extra fields. Please check Spoolman logs.',
        }, { status: 500 });
      }

      // Upsert connection
      await prisma.spoolmanConnection.deleteMany();
      await prisma.spoolmanConnection.create({
        data: { url },
      });

      // Log activity
      await createActivityLog({
        type: 'connection',
        message: 'Spoolman connected successfully',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid settings type' }, { status: 400 });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'regenerate-ha-password') {
      // Password regeneration is not supported - HA's user management API
      // is only available via WebSocket, not REST API.
      // To change the password, users need to:
      // 1. Login to HA with the current credentials
      // 2. Go to Profile settings and change the password
      // Note: The access token used by SpoolmanSync will continue to work
      // even if the password is changed, since we use token-based auth.
      return NextResponse.json({
        error: 'Password regeneration is not supported. To change the password, please login to Home Assistant directly and update it in your Profile settings. This will not affect SpoolmanSync functionality.',
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === 'homeassistant') {
      await prisma.hAConnection.deleteMany();

      // Log activity
      await createActivityLog({
        type: 'connection',
        message: 'Home Assistant disconnected',
      });

      return NextResponse.json({ success: true });
    }

    if (type === 'spoolman') {
      await prisma.spoolmanConnection.deleteMany();

      // Log activity
      await createActivityLog({
        type: 'connection',
        message: 'Spoolman disconnected',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid settings type' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting settings:', error);
    return NextResponse.json({ error: 'Failed to delete settings' }, { status: 500 });
  }
}

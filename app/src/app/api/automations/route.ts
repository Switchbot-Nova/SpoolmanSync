import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { HomeAssistantClient, isEmbeddedMode, getEmbeddedHAUrl } from '@/lib/api/homeassistant';
import { generateHAConfig, mergeConfiguration } from '@/lib/ha-config-generator';
import * as fs from 'fs/promises';


export async function GET() {
  try {
    const automations = await prisma.automation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const haConnection = await prisma.hAConnection.findFirst();
    const embeddedMode = isEmbeddedMode();

    return NextResponse.json({
      automations,
      haConnected: !!haConnection,
      embeddedMode,
      configured: automations.length > 0,
    });
  } catch (error) {
    console.error('Error fetching automations:', error);
    return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, webhookUrl } = body;

    const haConnection = await prisma.hAConnection.findFirst();
    if (!haConnection) {
      return NextResponse.json({ error: 'Home Assistant not configured' }, { status: 400 });
    }

    const haClient = new HomeAssistantClient(haConnection.url, haConnection.accessToken);

    if (action === 'discover') {
      // Discover all printers and trays, return automation config
      const printers = await haClient.discoverPrinters();

      if (printers.length === 0) {
        return NextResponse.json({
          error: 'No Bambu Lab printers found. Please ensure ha-bambulab is configured.',
        }, { status: 400 });
      }

      // Use the same config generator as embedded mode for consistency
      const config = generateHAConfig(printers, webhookUrl, webhookUrl);

      return NextResponse.json({
        trayCount: config.trayCount,
        printerCount: config.printerCount,
        automationsYaml: config.automationsYaml,
        configurationYaml: config.configurationAdditions,
      });
    }

    if (action === 'register') {
      // Register automations in our database (after user applies to HA)
      const { trayIds } = body;

      for (const trayId of trayIds) {
        const automationId = `spoolmansync_${trayId.replace(/\./g, '_')}`;

        await prisma.automation.upsert({
          where: { haAutomationId: automationId },
          create: {
            haAutomationId: automationId,
            trayId,
            printerId: trayId.split('_')[0], // Extract printer prefix
          },
          update: {
            trayId,
          },
        });
      }

      await prisma.activityLog.create({
        data: {
          type: 'automation_created',
          message: `Registered ${trayIds.length} automations`,
          details: JSON.stringify({ trayIds }),
        },
      });

      return NextResponse.json({ success: true, count: trayIds.length });
    }

    if (action === 'auto-configure') {
      // Auto-configure HA in embedded mode
      if (!isEmbeddedMode()) {
        return NextResponse.json({
          error: 'Auto-configure is only available in embedded mode',
        }, { status: 400 });
      }

      const haUrl = getEmbeddedHAUrl();

      // Get stored connection for embedded HA
      const storedConnection = await prisma.hAConnection.findFirst();
      if (!storedConnection) {
        return NextResponse.json({
          error: 'Home Assistant not connected. Please wait for HA to initialize.',
        }, { status: 400 });
      }

      const haClient = new HomeAssistantClient(
        haUrl,
        storedConnection.accessToken,
        storedConnection.refreshToken,
        storedConnection.expiresAt,
        true
      );

      // Discover printers
      const printers = await haClient.discoverPrinters();
      if (printers.length === 0) {
        return NextResponse.json({
          error: 'No Bambu Lab printers found. Please add a printer first.',
        }, { status: 400 });
      }

      // Get Spoolman connection for webhook URL
      const spoolmanConnection = await prisma.spoolmanConnection.findFirst();

      // Generate webhook URL (internal Docker network URL for HA to call our app)
      const internalWebhookUrl = 'http://spoolmansync-app:3000/api/webhook';

      // Generate configuration
      const config = generateHAConfig(
        printers,
        internalWebhookUrl,
        internalWebhookUrl
      );

      // Write automations.yaml to HA config directory
      const haConfigPath = '/ha-config';
      const automationsPath = `${haConfigPath}/automations.yaml`;
      const configPath = `${haConfigPath}/configuration.yaml`;

      try {
        // Write automations.yaml
        await fs.writeFile(automationsPath, config.automationsYaml, 'utf-8');
        console.log('Wrote automations.yaml');

        // Read existing configuration.yaml and merge
        let existingConfig = '';
        try {
          existingConfig = await fs.readFile(configPath, 'utf-8');
        } catch {
          console.log('No existing configuration.yaml found');
        }

        const mergedConfig = mergeConfiguration(existingConfig, config.configurationAdditions);
        await fs.writeFile(configPath, mergedConfig, 'utf-8');
        console.log('Wrote configuration.yaml');

        // Reload HA automations via API
        try {
          await haClient.callService('automation', 'reload', {});
          console.log('Reloaded automations');
        } catch (reloadError) {
          console.error('Failed to reload automations:', reloadError);
          // Not fatal - user can restart HA manually
        }

        // Register automations in our database
        const trayIds: string[] = [];
        for (const printer of printers) {
          for (const ams of printer.ams_units) {
            for (const tray of ams.trays) {
              trayIds.push(tray.entity_id);
            }
          }
          if (printer.external_spool) {
            trayIds.push(printer.external_spool.entity_id);
          }
        }

        // Upsert automation tracking record
        const automationId = `spoolmansync_update_spool_${printers[0].entity_id.replace(/sensor\./g, '').replace(/_print_status$/, '')}`;
        await prisma.automation.upsert({
          where: { haAutomationId: automationId },
          create: {
            haAutomationId: automationId,
            trayId: trayIds.join(','),
            printerId: printers[0].name,
          },
          update: {
            trayId: trayIds.join(','),
          },
        });

        await prisma.activityLog.create({
          data: {
            type: 'automation_created',
            message: `Auto-configured SpoolmanSync for ${config.printerCount} printer(s), ${config.trayCount} tray(s)`,
            details: JSON.stringify({ printers: printers.map(p => p.name), trayIds }),
          },
        });

        return NextResponse.json({
          success: true,
          printerCount: config.printerCount,
          trayCount: config.trayCount,
          message: 'Home Assistant configured successfully. Automations are now active.',
        });

      } catch (writeError) {
        console.error('Failed to write HA config files:', writeError);
        return NextResponse.json({
          error: `Failed to write configuration files: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`,
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing automations:', error);
    return NextResponse.json({ error: 'Failed to manage automations' }, { status: 500 });
  }
}


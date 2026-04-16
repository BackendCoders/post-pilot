import makeWASocket, {
  useMultiFileAuthState,
  Browsers,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import * as fs from 'fs';

async function test() {
  const dir = './temp-test';
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(dir);

  console.log('Fetching latest WA version...');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log('Using WA version:', version.join('.'), 'isLatest:', isLatest);

  console.log('Starting socket...');
  const sock = makeWASocket({
    auth: state,
    version,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', async () => {
    console.log('Creds update');
    await saveCreds();
  });

  sock.ev.on('connection.update', (update: any) => {
    const safeUpdate = { ...update };
    delete safeUpdate.lastDisconnect;
    console.log('CONN UPDATE:', JSON.stringify(safeUpdate, null, 2));
    if (update.qr) console.log('✅ QR emitted in connection.update!');
  });

  (sock.ev as any).on('qr', (qr: string) => {
    console.log('✅ QR emitted in dedicated qr event!');
  });

  // End gracefully after 10 sec
  setTimeout(() => {
    console.log('Ending test...');
    sock.end(undefined);
    process.exit(0);
  }, 10000);
}

test().catch(console.error);

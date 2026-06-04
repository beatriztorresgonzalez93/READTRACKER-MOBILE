/**
 * Simula inactividad vía API (útil contra Render sin acceso directo a PostgreSQL).
 *
 * Uso (desde server/):
 *   CRON_SECRET=xxx API_BASE_URL=https://readtracker-api.onrender.com/api/v1 node scripts/simulate-inactivity-http.js --email tu@correo.com
 *
 * En producción el endpoint solo responde si PUSH_DEV_TOOLS=true en el servidor.
 */
const baseUrl = (process.env.API_BASE_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
const cronSecret = (process.env.CRON_SECRET ?? "").trim();

function parseArgs(argv) {
  let email = "";
  let days = 5;
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--email" && argv[i + 1]) {
      email = argv[i + 1].trim();
      i += 1;
    } else if (argv[i] === "--days" && argv[i + 1]) {
      days = Number(argv[i + 1]);
      i += 1;
    }
  }
  return { email, days: Math.max(1, Math.floor(days) || 5) };
}

async function run() {
  const { email, days } = parseArgs(process.argv);
  if (!email) {
    console.error("Indica --email tu@correo.com");
    process.exit(1);
  }
  if (!cronSecret) {
    console.error("Falta CRON_SECRET en el entorno.");
    process.exit(1);
  }

  const response = await fetch(`${baseUrl}/notifications/dev/simulate-inactivity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": cronSecret,
    },
    body: JSON.stringify({ email, inactiveDays: days, clearCooldown: true }),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`Error ${response.status}:`, text);
    if (response.status === 404) {
      console.error(
        "En Render activa PUSH_DEV_TOOLS=true temporalmente o usa scripts/simulate-inactivity.js con DATABASE_URL local.",
      );
    }
    process.exit(1);
  }

  console.log("Simulación:", text);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

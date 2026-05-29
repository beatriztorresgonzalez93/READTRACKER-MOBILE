/**
 * Ejecuta la campaña de push de re-engagement contra el API desplegado.
 *
 * Uso (desde server/):
 *   CRON_SECRET=tu-secreto API_BASE_URL=https://readtracker-api.onrender.com/api/v1 node scripts/send-engagement-push.js
 */
const baseUrl = (process.env.API_BASE_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
const cronSecret = (process.env.CRON_SECRET ?? "").trim();

if (!cronSecret) {
  console.error("Falta CRON_SECRET en el entorno.");
  process.exit(1);
}

async function run() {
  const response = await fetch(`${baseUrl}/notifications/cron/engagement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": cronSecret,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`Error ${response.status}:`, text);
    process.exit(1);
  }

  console.log("Campaña de engagement:", text);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

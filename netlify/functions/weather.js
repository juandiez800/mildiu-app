export async function handler() {
  try {
    const appKey = process.env.ECOWITT_APP_KEY;
    const apiKey = process.env.ECOWITT_API_KEY;
    const mac = process.env.ECOWITT_MAC;

    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;

    // 📡 datos estación
    const url = `https://api.ecowitt.net/api/v3/device/real_time?application_key=${appKey}&api_key=${apiKey}&mac=${mac}&call_back=all`;

    const res = await fetch(url);
    const json = await res.json();

    const outdoor = json.data.outdoor;

    const temp = outdoor.temperature.value;
    const humedad = outdoor.humidity.value;
    const lluviaTotal = outdoor.rainfall?.value || 0;
    const rainRate = outdoor.rain_rate?.value || 0;

    // 🌿 hoja mojada simulada
    let hojaMojada = false;
    if (humedad > 90 && rainRate > 0.1) hojaMojada = true;
    if (humedad > 95) hojaMojada = true;

    // 🧠 cálculo
    let puntos = 0;

    if (temp >= 10 && temp <= 25) puntos += 2;
    if (humedad > 85) puntos += 2;
    if (lluviaTotal > 10) puntos += 4;
    if (hojaMojada) puntos += 3;
    if (rainRate > 0.5) puntos += 2;

    let nivel = "Bajo";
    if (puntos >= 8) nivel = "Alto";
    else if (puntos >= 4) nivel = "Medio";

    let motivo = "Condiciones poco favorables";
    if (hojaMojada) motivo = "Hoja mojada + humedad alta";
    else if (lluviaTotal > 10) motivo = "Lluvia de infección";
    else if (humedad > 85) motivo = "Ambiente húmedo";

    // ⏱️ control alerta (Supabase)
    const supa = await fetch(`${SUPABASE_URL}/rest/v1/alertas?id=eq.1`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await supa.json();
    const ultima = data[0].ultima_alerta;

    const ahora = Date.now();
    const unaHora = 3600000;

    if (nivel === "Alto" && (ahora - ultima > unaHora)) {

      const mensaje = `🍇 ALERTA MILDiu
⚠️ Riesgo ALTO

🌡️ ${temp}°C
💧 ${humedad}%
🌧️ ${lluviaTotal} mm

${motivo}`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: mensaje
        })
      });

      await fetch(`${SUPABASE_URL}/rest/v1/alertas?id=eq.1`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ultima_alerta: ahora })
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ temp, humedad, lluvia: lluviaTotal, nivel, motivo })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error" })
    };
  }
}
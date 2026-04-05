async function cargar() {
  const res = await fetch('/.netlify/functions/weather');
  const data = await res.json();

  const clase =
    data.nivel === "Alto" ? "alto" :
    data.nivel === "Medio" ? "medio" : "bajo";

  document.getElementById("hoy").innerHTML = `
    <div class="${clase}">
      🌡️ ${data.temp}°C |
      💧 ${data.humedad}% |
      🌧️ ${data.lluvia} mm
      <br><br>
      ⚠️ <b>${data.nivel}</b><br>
      <small>${data.motivo}</small>
    </div>
  `;
}

cargar();
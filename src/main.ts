import "./style.css";
import { fetchCurrentIntensity } from "@/services/carbon-api";

const app = document.querySelector("#app")!;

app.innerHTML = `<p class="reading">Loading…</p>`;

try {
  const period = await fetchCurrentIntensity();

  app.innerHTML = `
    <p class="reading">
      <span class="reading__value">${period.intensity.actual}</span>
      <span class="reading__unit">gCO₂/kWh</span>
    </p>
  `;
} catch (error) {
  console.error(error);
  const message =
    error instanceof Error ? error.message : "Something went wrong";
  app.innerHTML = `<p class="reading">${message}</p>`;
}

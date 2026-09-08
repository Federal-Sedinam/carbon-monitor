import "./style.css";
import { fetchCurrentIntensity } from "@/services/carbon-api";

const app = document.querySelector("#app")!;

app.innerHTML = `<p class="reading">Loading…</p>`;

try {
  const reading = await fetchCurrentIntensity();

  app.innerHTML = `
    <p class="reading">
      <span class="reading__value">${reading.value}</span>
      <span class="reading__unit">gCO₂/kWh</span>
      <span class="reading__status">
        ${reading.basis === "measured" ? "Measured" : "Forecast — this period hasn't settled yet"}
      </span>
    </p>
  `;
} catch (error) {
  console.error(error);
  const message =
    error instanceof Error ? error.message : "Something went wrong";
  app.innerHTML = `<p class="reading">${message}</p>`;
}

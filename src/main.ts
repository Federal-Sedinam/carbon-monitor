import "./style.css";

const response = await fetch("https://api.carbonintensity.org.uk/intensity");
const body = await response.json();
const reading = body.data[0].intensity;

document.querySelector("#app")!.innerHTML = `
  <p class="reading">
    <span class="reading__value">${reading.actual}</span>
    <span class="reading__unit">gCO₂/kWh</span>
  </p>
`;

import './style.css'

const app = document.querySelector('#app')!

app.innerHTML = `<p class="reading">Loading…</p>`

try {
  const response = await fetch('https://api.carbonintensity.org.uk/intensity')
  const body = await response.json()
  const reading = body.data[0].intensity

  app.innerHTML = `
    <p class="reading">
      <span class="reading__value">${reading.actual}</span>
      <span class="reading__unit">gCO₂/kWh</span>
    </p>
  `
} catch (error) {
  console.error(error)
  app.innerHTML = `<p class="reading">Couldn't reach the grid. Check your connection.</p>`
}
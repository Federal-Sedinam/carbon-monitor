import './style.css'
import { fetchCurrentIntensity, type Reading } from '@/services/carbon-api'

type ViewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; reading: Reading }
  | { status: 'failed'; message: string }
  

const app = document.querySelector('#app')
if (!app) throw new Error('No #app element found in index.html')

let state: ViewState = { status: 'idle' }

// These are written as `const name = () => {}` rather than
// `function name() {}`. That is not a style choice — it is required
// here, and the box below the file explains exactly why.
const render = (): void => {
  switch (state.status) {
    case 'idle':
    case 'loading':
      app.innerHTML = `<p class="reading">Loading…</p>`
      return

    case 'failed':
      // TypeScript KNOWS `message` exists here, and knows `reading`
      // does not. Try typing state.reading — it's a compile error.
      app.innerHTML = `
        <p class="reading">
          ${state.message}
          <button id="retry" type="button">Try again</button>
        </p>`
      return

    case 'ready':
      app.innerHTML = `
        <p class="reading">
          <span class="reading__value">${state.reading.value}</span>
          <span class="reading__unit">gCO₂/kWh</span>
          <span class="reading__status">
            ${state.reading.basis === 'measured'
              ? 'Measured'
              : "Forecast — this period hasn't settled yet"}
          </span>
        </p>`
      return

    default: {
      // The exhaustiveness guard. Explained right below — this is the
      // line that makes the compiler tell you about a missing case.
      const unhandled: never = state
      throw new Error(`Unhandled state: ${JSON.stringify(unhandled)}`)
    }
  }
}

// One place owns "state changed → redraw". Nothing else touches the
// DOM. That single rule is what keeps this app understandable as it
// grows from one view to three.
const setState = (next: ViewState): void => {
  state = next
  render()
}

const load = async (): Promise<void> => {
  // Every path assigns a COMPLETE state. There is no way to
  // leave a stale field behind, because there are no fields to
  // leave behind — the whole value is replaced each time.
  setState({ status: 'loading' })
  try {
    setState({ status: 'ready', reading: await fetchCurrentIntensity() })
  } catch (error) {
    console.error(error)
    setState({
      status: 'failed',
      message: error instanceof Error ? error.message : 'Something went wrong',
    })
  }
}

app.addEventListener('click', (event) => {
  if ((event.target as HTMLElement).id === 'retry') void load()
})

void load()
import './style.css'
import { fetchCurrentIntensity, type Reading } from '@/services/carbon-api'

type ViewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; reading: Reading }
  | { status: 'failed'; message: string }

const app = document.querySelector('#app')
if (!app) throw new Error('No #app element found in index.html')

const valueEl  = document.createElement('span')
const unitEl   = document.createElement('span')
const statusEl = document.createElement('span')
const retryEl  = document.createElement('button')

valueEl.className  = 'reading__value'
unitEl.className   = 'reading__unit'
unitEl.textContent = 'gCO₂/kWh'
statusEl.className = 'reading__status'
retryEl.type       = 'button'
retryEl.textContent = 'Try again'

const card = document.createElement('div')
card.className = 'reading'
card.append(valueEl, unitEl, statusEl, retryEl)
app.append(card)

let state: ViewState = { status: 'idle' }

const render = (): void => {
  // hidden is a real property — cleaner than juggling style.display,
  // and it correctly hides the element from screen readers too.
  retryEl.hidden = state.status !== 'failed'
  unitEl.hidden  = state.status !== 'ready'

  switch (state.status) {
    case 'idle':
    case 'loading':
      valueEl.textContent = '—'
      statusEl.textContent = 'Loading…'
      delete card.dataset.band
      return

    case 'failed':
      valueEl.textContent = '—'
      // textContent, so this is displayed as literal characters.
      // Even if the message contained HTML, it could not run.
      statusEl.textContent = state.message
      delete card.dataset.band
      return

    case 'ready':
      valueEl.textContent = String(state.reading.value)
      statusEl.textContent = state.reading.basis === 'measured'
        ? 'Measured'
        : "Forecast — this period hasn't settled yet"
      // A data attribute, not a class name. It holds one value with
      // no parsing rules, so the space bug simply cannot recur —
      // and CSS can still target it with [data-band="very-low"].
      card.dataset.band = state.reading.band
      return

    default: {
      const unhandled: never = state
      throw new Error(`Unhandled state: ${JSON.stringify(unhandled)}`)
    }
  }
}

const setState = (next: ViewState): void => {
  state = next
  render()
}

const load = async (): Promise<void> => {
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

// The listener is attached to a button that is never destroyed,
// so it never needs re-attaching. 
retryEl.addEventListener('click', () => void load())

void load()
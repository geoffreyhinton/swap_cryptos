import './App.css'
import CurrencySwapForm from './components/CurrencySwapForm'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>DeFi Token Swap</h1>
        <p>Swap your favorite cryptocurrencies with ease</p>
      </header>
      
      <main className="app-main">
        <CurrencySwapForm />
      </main>
      
      <footer className="app-footer">
        <p>Built with Vite + React + TypeScript</p>
      </footer>
    </div>
  )
}

export default App

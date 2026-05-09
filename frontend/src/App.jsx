import { useEffect, useState } from 'react'
import './App.css'
import Footer from './components/Footer'
import logoColca1 from './assets/images/logo_colca1.png'
import colca1 from './assets/images/colca1.png'
import colca2 from './assets/images/colca2.png'
import colca3 from './assets/images/colca3.png'
import colca4 from './assets/images/colca4.png'
import colca5 from './assets/images/colca5.png'
import colca6 from './assets/images/colca6.png'
import colca7 from './assets/images/colca7.png'
import colca8 from './assets/images/colca8.png'

const heroImages = [colca1, colca2, colca3, colca4, colca5, colca6, colca7, colca8]

function App() {
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((value) => (value + 1) % heroImages.length)
    }, 3800)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <main className="hero">
        <div className="hero-backdrop" style={{ backgroundImage: `url(${heroImages[heroIndex]})` }} />
        <div className="hero-gradient" />

        <div className="hero-shell">
          <section className="hero-left">
            <div className="brand-lockup">
              <img src={logoColca1} alt="Logo Colca" className="brand-logo" />
            </div>

            <h2 className="hero-title">
              Series exclusivas, exitos del cine, el deporte y mas
            </h2>

            <p className="hero-subtitle">Ingresa tu correo para comenzar</p>

            <form className="cta-form">
              <button type="submit">COMPRAR ENTRADAS</button>
            </form>

            <p className="hero-note">
              Ahorra desde 30% con <a href="#planes">Plan Premium Anual</a>.
              <br />
              <a href="#detalles">Ver detalles de los planes</a>
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}

export default App
import { useEffect, useState } from 'react';
import './App.css';
import Footer from './components/Footer';
import logoColca from './assets/images/logo_colca_1.png';
import colca1 from './assets/images/colca1.png';
import colca2 from './assets/images/colca2.png';
import colca3 from './assets/images/colca3.png';
import colca4 from './assets/images/colca4.png';
import colca5 from './assets/images/colca5.png';
import colca6 from './assets/images/colca6.png';
import colca7 from './assets/images/colca7.png';

function App() {
  const heroImages = [colca1, colca2, colca3, colca4, colca5, colca6, colca7];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showTicketScreen, setShowTicketScreen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div className="app">
      <main className="main-content">
        <div className="hero-section">
          <div
            key={heroImages[currentImageIndex]}
            className="hero-fullscreen-image"
            style={{ backgroundImage: `url(${heroImages[currentImageIndex]})` }}
          />
          <div className="hero-overlay" />

          {!showTicketScreen ? (
            <div className="hero-content">
              <div className="logo-container">
                <img src={logoColca} alt="Colca Logo" className="logo" />
              </div>

              <h2 className="subtitle">Horarios de atención</h2>

              <ul className="attention-list">
                <li>Miércoles a viernes: 14:00 a 21:00 Hrs</li>
                <li>Sábado y domingo: 11:00 a 21:00 Hrs</li>
              </ul>

              <button
                type="button"
                className="subscribe-button"
                onClick={() => setShowTicketScreen(true)}
              >
                COMPRAR ENTRADAS
              </button>
            </div>
          ) : (
            <section className="ticket-screen">
              <div className="ticket-card">
                <h2>Costo de entradas</h2>
                <ul>
                  <li><span>General de 12 a 60 años</span><strong>25 Bs</strong></li>
                  <li><span>Niños de 6 a 12 años</span><strong>10 Bs</strong></li>
                  <li><span>Adultos mayores</span><strong>20 Bs</strong></li>
                </ul>

                <h3>Atención</h3>
                <p>Miércoles a viernes: 14:00 a 21:00 Hrs</p>
                <p>Sábado y domingo: 11:00 a 21:00 Hrs</p>
                <p className="ticket-note">¡Niños menores de 6 años ingresan GRATIS!</p>

                <button
                  type="button"
                  className="subscribe-button"
                  onClick={() => setShowTicketScreen(false)}
                >
                  VOLVER
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;

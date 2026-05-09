import React from 'react';
import '../styles/Footer.css';

function Footer() {
  const brands = [
    { name: 'COLCA+' },
    { name: 'PUJLLAY' },
    { name: 'DANZA' },
    { name: 'MUSICA' },
    { name: 'CULTURA' },
    { name: 'TURISMO' },
    { name: 'GASTRONOMIA' },
  ];

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-strip">
          <div className="footer-brands">
            {brands.map((brand, index) => (
              <React.Fragment key={brand.name}>
                <span className={`footer-brand-item ${brand.className || ''}`}>{brand.name}</span>
                {index < brands.length - 1 && <span className="footer-separator">+</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="footer-links">
          <a href="#">Inicio</a>
          <a href="#">Entradas</a>
          <a href="#">Programación</a>
          <a href="#">Contacto</a>
          <a href="#">Ayuda</a>
        </div>

        <div className="footer-progress">
          <span className="footer-control" aria-hidden="true">⌄</span>
          <div className="footer-timeline">
            <div className="timeline-segments" aria-hidden="true">
              <span className="timeline-segment active" />
              <span className="timeline-segment" />
              <span className="timeline-segment" />
              <span className="timeline-segment" />
            </div>
            <p className="timeline-label">Festival del Colca Pujllay</p>
          </div>
          <span className="footer-control" aria-hidden="true">II</span>
        </div>

        <p className="footer-copy">Colca Pujllay © {new Date().getFullYear()} - Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;

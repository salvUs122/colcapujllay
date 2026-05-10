import '../styles/Footer.css';
import colcaLogo from '../assets/images/colcalogo.png';

function Footer({ onNavigateHome, onNavigatePurchase, onNavigateCashier }) {
  const socialLinks = [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/GobiernoMunicipalColcapirhua',
    },
    {
      label: 'X',
      href: 'https://x.com/GAMColcapirhua',
    },
    {
      label: 'YouTube',
      href: 'https://www.youtube.com/@gamcolcapirhua',
    },
  ];

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-branding">
            <img src={colcaLogo} alt="Colcapujllay" className="footer-logo" />
            <p className="footer-address">Colcapirhua - Cochabamba, Bolivia</p>
            <a
              className="footer-location"
              href="https://share.google/Fa7Duq6YtinW08mcU"
              target="_blank"
              rel="noreferrer"
            >
              Ver ubicación en Google Maps
            </a>
          </div>

          <div className="footer-right">
            <div className="footer-social">
              {socialLinks.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ))}
            </div>
            <button type="button" className="cashier-login-button" onClick={onNavigateCashier}>
              Iniciar sesión cajeros
            </button>
          </div>
        </div>

        <div className="footer-links">
          <button type="button" onClick={onNavigateHome}>
            Inicio
          </button>
          <button type="button" onClick={onNavigatePurchase}>
            Comprar entradas
          </button>
        </div>

        <div className="footer-divider" />
        <p className="footer-copy">
          Gobierno Autónomo Municipal de Colcapirhua © {new Date().getFullYear()} - Todos los
          derechos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;

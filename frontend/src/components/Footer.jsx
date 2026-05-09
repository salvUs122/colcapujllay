import logoColca from '../assets/images/logo_colca1.png'
import '../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer-cinematic">
      <div className="footer-overlay">
        <div className="footer-topbar">
          <button type="button" className="login-btn">
            INICIAR SESION
          </button>
        </div>

        <div className="footer-content">
          <div className="brand-wrap">
            <img src={logoColca} alt="Logo Colca" className="brand-logo" />
          </div>

          <h2 className="footer-title">
            Vive la magia del Colca con contenido exclusivo, cine, deporte y mas
          </h2>

          <p className="footer-subtitle">Ingresa tu correo para comenzar</p>

          <form className="cta-form">
            <input
              type="email"
              placeholder="Correo electronico"
              aria-label="Correo electronico"
            />
            <button type="submit">SUSCRIBIRME AHORA</button>
          </form>

          <p className="footer-note">
            Ahorra desde 30% con <a href="#planes">Plan Premium Anual</a>.
            <br />
            <a href="#detalles">Ver detalles de los planes</a>
          </p>

          <div className="brands-row" aria-label="Marcas disponibles">
            <span>COLCA+</span>
            <span>PIXAR</span>
            <span>MARVEL</span>
            <span>STAR WARS</span>
            <span>NATIONAL GEOGRAPHIC</span>
            <span>ESPN</span>
            <span>HULU</span>
          </div>
        </div>

      </div>

      <div className="footer-bottom-bar">
        <div className="footer-bottom-content">
          <p className="copyright">© 2025 Colca+ – Todos los derechos reservados</p>
          <div className="footer-links">
            <a href="#login">Iniciar sesión</a>
            <span>•</span>
            <a href="#privacy">Privacidad</a>
            <span>•</span>
            <a href="#terms">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

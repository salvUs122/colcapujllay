import { useEffect, useMemo, useState } from 'react';
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

const TICKET_TYPES = [
  {
    key: 'general',
    name: 'General de 12 a 60 años',
    price: 25,
    image: colca2,
  },
  {
    key: 'ninos',
    name: 'Niños de 6 a 12 años',
    price: 10,
    image: colca6,
  },
  {
    key: 'mayores',
    name: 'Adultos mayores',
    price: 20,
    image: colca5,
  },
];

function App() {
  const heroImages = [colca1, colca2, colca3, colca4, colca5, colca6, colca7];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [customerData, setCustomerData] = useState({
    fullName: '',
    idNumber: '',
    phone: '',
    email: '',
  });
  const [cashierCredentials, setCashierCredentials] = useState({
    user: '',
    password: '',
  });
  const [quantities, setQuantities] = useState({
    general: 0,
    ninos: 0,
    mayores: 0,
  });
  const [order, setOrder] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (currentScreen !== 'home') {
      return undefined;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [currentScreen, heroImages.length]);

  const totalTickets = useMemo(
    () => Object.values(quantities).reduce((acc, value) => acc + value, 0),
    [quantities]
  );

  const totalAmount = useMemo(
    () =>
      TICKET_TYPES.reduce(
        (acc, ticketType) => acc + quantities[ticketType.key] * ticketType.price,
        0
      ),
    [quantities]
  );

  const goToScreen = (screenName) => {
    setCurrentScreen(screenName);
    setFeedback('');
  };

  const handleQuantityChange = (ticketKey, nextValue) => {
    const validValue = Math.max(0, Number(nextValue) || 0);
    setQuantities((prev) => ({ ...prev, [ticketKey]: validValue }));
    setOrder(null);
    setFeedback('');
  };

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
    setOrder(null);
    setFeedback('');
  };

  const handleCashierChange = (event) => {
    const { name, value } = event.target;
    setCashierCredentials((prev) => ({ ...prev, [name]: value }));
    setFeedback('');
  };

  const handleGenerateQR = (event) => {
    event.preventDefault();

    const hasCustomerData =
      customerData.fullName.trim() &&
      customerData.idNumber.trim() &&
      customerData.phone.trim() &&
      customerData.email.trim();
    const hasValidEmail = customerData.email.includes('@');

    if (!hasCustomerData || !hasValidEmail || totalTickets === 0) {
      setFeedback(
        'Completa nombre, CI, celular, correo válido y selecciona al menos una entrada.'
      );
      return;
    }

    const orderCode = `COLCA-${Date.now().toString().slice(-6)}`;
    const orderSummary = TICKET_TYPES.filter((ticketType) => quantities[ticketType.key] > 0)
      .map((ticketType) => `${ticketType.name}: ${quantities[ticketType.key]}`)
      .join(' | ');

    const qrPayload = [
      'Parque Ecoturístico Colcapujllay',
      `Pedido: ${orderCode}`,
      `Cliente: ${customerData.fullName}`,
      `CI: ${customerData.idNumber}`,
      `Correo: ${customerData.email}`,
      `Detalle: ${orderSummary}`,
      `Total Bs: ${totalAmount}`,
    ].join(' ; ');

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrPayload)}`;

    setOrder({
      code: orderCode,
      summary: orderSummary,
      totalAmount,
      qrUrl,
      paid: false,
    });
    setFeedback('QR generado. Presiona "Pagar ahora" para simular el pago.');
  };

  const handleSimulatedPayment = () => {
    if (!order) {
      return;
    }

    setOrder((prev) => ({ ...prev, paid: true }));
    setFeedback(
      `Pago confirmado del QR. Se envió la confirmación al correo ${customerData.email} (demo).`
    );
  };

  const handleCashierLogin = (event) => {
    event.preventDefault();
    if (!cashierCredentials.user.trim() || !cashierCredentials.password.trim()) {
      setFeedback('Ingresa usuario y contraseña de cajero.');
      return;
    }
    setFeedback('Inicio de sesión de cajero correcto (demo).');
  };

  return (
    <div className="app">
      <main className="main-content">
        {currentScreen === 'home' ? (
          <section className="hero-section" id="inicio">
            <div
              key={heroImages[currentImageIndex]}
              className="hero-fullscreen-image"
              style={{ backgroundImage: `url(${heroImages[currentImageIndex]})` }}
            />
            <div className="hero-overlay" />

            <div className="hero-content">
              <div className="logo-container">
                <img src={logoColca} alt="Colca Logo" className="logo" />
              </div>

              <p className="hero-kicker">Parque Ecoturístico</p>
              <h1 className="hero-title">Colcapujllay</h1>
              <p className="hero-copy">
                Vive una experiencia familiar con naturaleza, recreación y cultura en Colcapirhua.
              </p>

              <h2 className="subtitle">Horarios de atención</h2>
              <ul className="attention-list">
                <li>Miércoles a viernes: 14:00 a 21:00 Hrs</li>
                <li>Sábado y domingo: 11:00 a 21:00 Hrs</li>
              </ul>

              <button type="button" className="subscribe-button" onClick={() => goToScreen('purchase')}>
                COMPRAR ENTRADAS
              </button>
            </div>
          </section>
        ) : null}

        {currentScreen === 'purchase' ? (
          <section className="screen-section">
            <div className="ticket-shop">
              <div className="ticket-shop-overlay" />
              <div className="ticket-shop-content">
                <header className="ticket-shop-header">
                  <h2>Compra de entradas en línea</h2>
                  <p>Selecciona tipo de entrada, cantidad, genera tu QR y paga en esta misma pantalla.</p>
                  <a
                    className="location-link"
                    href="https://share.google/Fa7Duq6YtinW08mcU"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Dirección / ubicación
                  </a>
                </header>

                <div className="ticket-grid">
                  {TICKET_TYPES.map((ticketType) => (
                    <article className="ticket-type-card" key={ticketType.key}>
                      <img src={ticketType.image} alt={ticketType.name} className="ticket-type-image" />
                      <div className="ticket-type-body">
                        <h3>{ticketType.name}</h3>
                        <p className="ticket-price">{ticketType.price} Bs</p>
                        <label htmlFor={`qty-${ticketType.key}`}>Cantidad</label>
                        <div className="qty-controls">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(ticketType.key, quantities[ticketType.key] - 1)
                            }
                          >
                            -
                          </button>
                          <input
                            id={`qty-${ticketType.key}`}
                            type="number"
                            min="0"
                            value={quantities[ticketType.key]}
                            onChange={(event) =>
                              handleQuantityChange(ticketType.key, event.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(ticketType.key, quantities[ticketType.key] + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <form className="checkout-card" onSubmit={handleGenerateQR}>
                  <h3>Datos para la compra</h3>
                  <div className="checkout-fields">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Nombre completo"
                      value={customerData.fullName}
                      onChange={handleCustomerChange}
                    />
                    <input
                      type="text"
                      name="idNumber"
                      placeholder="CI"
                      value={customerData.idNumber}
                      onChange={handleCustomerChange}
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Celular"
                      value={customerData.phone}
                      onChange={handleCustomerChange}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Correo electrónico"
                      value={customerData.email}
                      onChange={handleCustomerChange}
                    />
                  </div>

                  <div className="checkout-summary">
                    <p>
                      <span>Total entradas</span>
                      <strong>{totalTickets}</strong>
                    </p>
                    <p>
                      <span>Total a pagar</span>
                      <strong>{totalAmount} Bs</strong>
                    </p>
                    <p className="checkout-note">Niños menores de 6 años ingresan gratis.</p>
                  </div>

                  <div className="checkout-actions">
                    <button type="submit" className="subscribe-button">
                      GENERAR QR
                    </button>
                    <button type="button" className="secondary-button" onClick={() => goToScreen('home')}>
                      VOLVER AL INICIO
                    </button>
                  </div>
                  {feedback ? <p className="feedback-message">{feedback}</p> : null}
                </form>

                {order ? (
                  <aside className="qr-result" id="pago-qr">
                    <h3>Pedido generado</h3>
                    <p>
                      <strong>Código:</strong> {order.code}
                    </p>
                    <p>
                      <strong>Detalle:</strong> {order.summary}
                    </p>
                    <p>
                      <strong>Total:</strong> {order.totalAmount} Bs
                    </p>
                    <img src={order.qrUrl} alt="QR de pago de entradas" className="qr-image" />
                    <div className="pay-box">
                      <button
                        type="button"
                        className="pay-button"
                        onClick={handleSimulatedPayment}
                        disabled={order.paid}
                      >
                        {order.paid ? 'PAGADO' : 'PAGAR AHORA (DEMO)'}
                      </button>
                    </div>
                  </aside>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {currentScreen === 'cashier' ? (
          <section className="screen-section">
            <div className="cashier-screen">
              <h2>Ingreso de cajeros - compra física</h2>
              <p>Acceso para personal autorizado de taquilla del parque.</p>
              <form className="cashier-form" onSubmit={handleCashierLogin}>
                <input
                  type="text"
                  name="user"
                  placeholder="Usuario"
                  value={cashierCredentials.user}
                  onChange={handleCashierChange}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  value={cashierCredentials.password}
                  onChange={handleCashierChange}
                />
                <div className="checkout-actions">
                  <button type="submit" className="subscribe-button">
                    INICIAR SESIÓN
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => goToScreen('home')}
                  >
                    VOLVER AL INICIO
                  </button>
                </div>
              </form>
              {feedback ? <p className="feedback-message">{feedback}</p> : null}
            </div>
          </section>
        ) : null}
      </main>

      <Footer
        onNavigateHome={() => goToScreen('home')}
        onNavigatePurchase={() => goToScreen('purchase')}
        onNavigateCashier={() => goToScreen('cashier')}
      />
    </div>
  );
}

export default App;

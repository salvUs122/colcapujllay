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
  { key: 'general', name: 'General de 12 a 60 años', price: 25, image: colca2 },
  { key: 'ninos', name: 'Niños de 6 a 12 años', price: 10, image: colca6 },
  { key: 'mayores', name: 'Adultos mayores', price: 20, image: colca5 },
];

const LOGIN_USER = 'demo';
const LOGIN_PASSWORD = 'demo';

const getTicketSummary = (quantities) =>
  TICKET_TYPES.filter((ticketType) => quantities[ticketType.key] > 0)
    .map((ticketType) => `${ticketType.name}: ${quantities[ticketType.key]}`)
    .join(' | ');

const getTotalAmount = (quantities) =>
  TICKET_TYPES.reduce((acc, ticketType) => acc + quantities[ticketType.key] * ticketType.price, 0);

const generateCode = (prefix) => `${prefix}-${Date.now().toString().slice(-7)}`;

const buildQrUrl = (payload) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}`;

function App() {
  const heroImages = [colca1, colca2, colca3, colca4, colca5, colca6, colca7];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('home');

  const [onlineCustomer, setOnlineCustomer] = useState({
    fullName: '',
    idNumber: '',
    phone: '',
    email: '',
  });
  const [onlineQuantities, setOnlineQuantities] = useState({ general: 0, ninos: 0, mayores: 0 });
  const [onlineOrder, setOnlineOrder] = useState(null);
  const [onlineInvoice, setOnlineInvoice] = useState(null);
  const [onlineMessage, setOnlineMessage] = useState('');

  const [cashierCredentials, setCashierCredentials] = useState({ user: '', password: '' });
  const [cashierLoggedIn, setCashierLoggedIn] = useState(false);
  const [cashierCustomer, setCashierCustomer] = useState({
    fullName: '',
    idNumber: '',
    phone: '',
    email: '',
  });
  const [cashierQuantities, setCashierQuantities] = useState({ general: 0, ninos: 0, mayores: 0 });
  const [cashierPaymentMethod, setCashierPaymentMethod] = useState('qr');
  const [cashierQr, setCashierQr] = useState('');
  const [cashierPendingPayment, setCashierPendingPayment] = useState(null);
  const [cashierInvoice, setCashierInvoice] = useState(null);
  const [cashierMessage, setCashierMessage] = useState('');

  useEffect(() => {
    if (currentScreen !== 'home') {
      return undefined;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [currentScreen, heroImages.length]);

  const onlineTotalTickets = useMemo(
    () => Object.values(onlineQuantities).reduce((acc, value) => acc + value, 0),
    [onlineQuantities]
  );
  const onlineTotalAmount = useMemo(() => getTotalAmount(onlineQuantities), [onlineQuantities]);
  const cashierTotalAmount = useMemo(() => getTotalAmount(cashierQuantities), [cashierQuantities]);

  const goToScreen = (screenName) => {
    setCurrentScreen(screenName);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const handleOnlineQuantity = (ticketKey, value) => {
    const nextValue = Math.max(0, Number(value) || 0);
    setOnlineQuantities((prev) => ({ ...prev, [ticketKey]: nextValue }));
    setOnlineOrder(null);
    setOnlineInvoice(null);
    setOnlineMessage('');
  };

  const handleOnlineCustomer = (event) => {
    const { name, value } = event.target;
    setOnlineCustomer((prev) => ({ ...prev, [name]: value }));
    setOnlineOrder(null);
    setOnlineInvoice(null);
    setOnlineMessage('');
  };

  const handleGenerateOnlineQR = (event) => {
    event.preventDefault();

    const hasData =
      onlineCustomer.fullName.trim() &&
      onlineCustomer.idNumber.trim() &&
      onlineCustomer.phone.trim() &&
      onlineCustomer.email.trim();

    if (!hasData || !onlineCustomer.email.includes('@') || onlineTotalTickets === 0) {
      setOnlineMessage(
        'Completa nombre, CI, celular, correo válido y selecciona al menos una entrada.'
      );
      return;
    }

    const orderCode = generateCode('COLCA');
    const summary = getTicketSummary(onlineQuantities);
    const payload = [
      'Parque Ecoturístico Colcapujllay',
      `Pedido: ${orderCode}`,
      `Cliente: ${onlineCustomer.fullName}`,
      `CI: ${onlineCustomer.idNumber}`,
      `Correo: ${onlineCustomer.email}`,
      `Detalle: ${summary}`,
      `Total Bs: ${onlineTotalAmount}`,
    ].join(' ; ');

    setOnlineOrder({
      code: orderCode,
      summary,
      totalAmount: onlineTotalAmount,
      qrUrl: buildQrUrl(payload),
      paid: false,
    });
    setOnlineInvoice(null);
    setOnlineMessage('QR generado correctamente.');
  };

  const handleOnlinePayment = () => {
    if (!onlineOrder) {
      return;
    }

    const invoiceNumber = generateCode('FAC');
    const issueDate = new Date().toLocaleString('es-BO');

    setOnlineOrder((prev) => ({ ...prev, paid: true }));
    setOnlineInvoice({
      number: invoiceNumber,
      date: issueDate,
      method: 'QR',
      totalAmount: onlineOrder.totalAmount,
      summary: onlineOrder.summary,
      customerName: onlineCustomer.fullName,
    });
    setOnlineMessage(`Pago confirmado. Factura enviada al correo ${onlineCustomer.email}.`);
  };

  const handleCashierCredentials = (event) => {
    const { name, value } = event.target;
    setCashierCredentials((prev) => ({ ...prev, [name]: value }));
    setCashierMessage('');
  };

  const handleCashierLogin = (event) => {
    event.preventDefault();
    const isValid =
      cashierCredentials.user === LOGIN_USER && cashierCredentials.password === LOGIN_PASSWORD;

    if (!isValid) {
      setCashierMessage('Usuario o contraseña incorrectos.');
      return;
    }

    setCashierLoggedIn(true);
    setCashierMessage('Inicio de sesión correcto.');
  };

  const handleCashierLogout = () => {
    setCashierLoggedIn(false);
    setCashierCredentials({ user: '', password: '' });
    setCashierCustomer({ fullName: '', idNumber: '', phone: '', email: '' });
    setCashierQuantities({ general: 0, ninos: 0, mayores: 0 });
    setCashierPaymentMethod('qr');
    setCashierQr('');
    setCashierPendingPayment(null);
    setCashierInvoice(null);
    setCashierMessage('');
  };

  const handleCashierCustomer = (event) => {
    const { name, value } = event.target;
    setCashierCustomer((prev) => ({ ...prev, [name]: value }));
    setCashierMessage('');
    setCashierPendingPayment(null);
    setCashierQr('');
    setCashierInvoice(null);
  };

  const handleCashierQuantity = (ticketKey, value) => {
    const nextValue = Math.max(0, Number(value) || 0);
    setCashierQuantities((prev) => ({ ...prev, [ticketKey]: nextValue }));
    setCashierMessage('');
    setCashierPendingPayment(null);
    setCashierQr('');
    setCashierInvoice(null);
  };

  const handlePrepareCashierPayment = (event) => {
    event.preventDefault();
    const hasTickets = Object.values(cashierQuantities).some((value) => value > 0);
    const hasCustomer = cashierCustomer.fullName.trim() && cashierCustomer.idNumber.trim();

    if (!hasCustomer || !hasTickets) {
      setCashierMessage('Completa datos del cliente y selecciona al menos una entrada.');
      return;
    }

    const summary = getTicketSummary(cashierQuantities);
    const saleCode = generateCode('VENTA');
    const qrPayload = [
      'Parque Ecoturístico Colcapujllay',
      `Venta: ${saleCode}`,
      `Cliente: ${cashierCustomer.fullName}`,
      `CI: ${cashierCustomer.idNumber}`,
      `Detalle: ${summary}`,
      `Total Bs: ${cashierTotalAmount}`,
    ].join(' ; ');

    setCashierPendingPayment({
      saleCode,
      summary,
      totalAmount: cashierTotalAmount,
      method: cashierPaymentMethod === 'qr' ? 'QR' : 'Efectivo',
      qrUrl: buildQrUrl(qrPayload),
    });
    setCashierQr(cashierPaymentMethod === 'qr' ? buildQrUrl(qrPayload) : '');
    setCashierInvoice(null);
    setCashierMessage('Cobro generado. Completa el pago para emitir la factura.');
  };

  const handleCashierPayment = () => {
    if (!cashierPendingPayment) {
      return;
    }

    const invoiceNumber = generateCode('FAC');
    const issueDate = new Date().toLocaleString('es-BO');

    setCashierInvoice({
      number: invoiceNumber,
      date: issueDate,
      method: cashierPendingPayment.method,
      totalAmount: cashierPendingPayment.totalAmount,
      summary: cashierPendingPayment.summary,
      customerName: cashierCustomer.fullName,
    });
    setCashierPendingPayment(null);
    setCashierQr('');
    if (cashierCustomer.email.trim() && cashierCustomer.email.includes('@')) {
      setCashierMessage(`Pago confirmado. Factura enviada al correo ${cashierCustomer.email}.`);
      return;
    }

    setCashierMessage('Pago confirmado. Factura generada correctamente.');
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
                  <p>Selecciona tipo de entrada, cantidad, genera tu QR y completa el pago.</p>
                </header>

                <div className="ticket-grid">
                  {TICKET_TYPES.map((ticketType) => (
                    <article className="ticket-type-card" key={ticketType.key}>
                      <img src={ticketType.image} alt={ticketType.name} className="ticket-type-image" />
                      <div className="ticket-type-body">
                        <h3>{ticketType.name}</h3>
                        <p className="ticket-price">{ticketType.price} Bs</p>
                        <label htmlFor={`online-${ticketType.key}`}>Cantidad</label>
                        <div className="qty-controls">
                          <button
                            type="button"
                            onClick={() =>
                              handleOnlineQuantity(ticketType.key, onlineQuantities[ticketType.key] - 1)
                            }
                          >
                            -
                          </button>
                          <input
                            id={`online-${ticketType.key}`}
                            type="number"
                            min="0"
                            value={onlineQuantities[ticketType.key]}
                            onChange={(event) => handleOnlineQuantity(ticketType.key, event.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleOnlineQuantity(ticketType.key, onlineQuantities[ticketType.key] + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <form className="checkout-card" onSubmit={handleGenerateOnlineQR}>
                  <h3>Datos para la compra</h3>
                  <div className="checkout-fields">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Nombre completo"
                      value={onlineCustomer.fullName}
                      onChange={handleOnlineCustomer}
                    />
                    <input
                      type="text"
                      name="idNumber"
                      placeholder="CI"
                      value={onlineCustomer.idNumber}
                      onChange={handleOnlineCustomer}
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Celular"
                      value={onlineCustomer.phone}
                      onChange={handleOnlineCustomer}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Correo electrónico"
                      value={onlineCustomer.email}
                      onChange={handleOnlineCustomer}
                    />
                  </div>

                  <div className="checkout-summary">
                    <p>
                      <span>Total entradas</span>
                      <strong>{onlineTotalTickets}</strong>
                    </p>
                    <p>
                      <span>Total a pagar</span>
                      <strong>{onlineTotalAmount} Bs</strong>
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
                  {onlineMessage ? <p className="feedback-message">{onlineMessage}</p> : null}
                </form>

                {onlineOrder ? (
                  <aside className="qr-result" id="pago-qr">
                    <h3>Pedido generado</h3>
                    <p>
                      <strong>Código:</strong> {onlineOrder.code}
                    </p>
                    <p>
                      <strong>Detalle:</strong> {onlineOrder.summary}
                    </p>
                    <p>
                      <strong>Total:</strong> {onlineOrder.totalAmount} Bs
                    </p>
                    <img src={onlineOrder.qrUrl} alt="QR de pago de entradas" className="qr-image" />
                    <div className="pay-box">
                      <button
                        type="button"
                        className="pay-button"
                        onClick={handleOnlinePayment}
                        disabled={onlineOrder.paid}
                      >
                        {onlineOrder.paid ? 'PAGADO' : 'PAGAR AHORA'}
                      </button>
                    </div>
                  </aside>
                ) : null}

                {onlineInvoice ? (
                  <section className="invoice-card">
                    <h3>Factura</h3>
                    <p>
                      <strong>Nro:</strong> {onlineInvoice.number}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {onlineInvoice.date}
                    </p>
                    <p>
                      <strong>Cliente:</strong> {onlineInvoice.customerName}
                    </p>
                    <p>
                      <strong>Método de pago:</strong> {onlineInvoice.method}
                    </p>
                    <p>
                      <strong>Detalle:</strong> {onlineInvoice.summary}
                    </p>
                    <p>
                      <strong>Total:</strong> {onlineInvoice.totalAmount} Bs
                    </p>
                  </section>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {currentScreen === 'cashier' ? (
          <section className="screen-section">
            <div className="ticket-shop">
              <div className="ticket-shop-overlay" />
              <div className="ticket-shop-content">
                {!cashierLoggedIn ? (
                  <div className="cashier-screen">
                    <div className="cashier-header">
                      <p className="cashier-badge">Acceso autorizado</p>
                      <h2>Iniciar sesión</h2>
                      <p className="cashier-subtitle">Ingresa tus credenciales para continuar.</p>
                    </div>
                    <form className="cashier-form" onSubmit={handleCashierLogin}>
                      <input
                        type="text"
                        name="user"
                        placeholder="Usuario"
                        value={cashierCredentials.user}
                        onChange={handleCashierCredentials}
                      />
                      <input
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={cashierCredentials.password}
                        onChange={handleCashierCredentials}
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
                    {cashierMessage ? <p className="feedback-message">{cashierMessage}</p> : null}
                  </div>
                ) : (
                  <>
                    <header className="ticket-shop-header">
                      <div className="cashier-toolbar">
                        <h2>Venta en caja</h2>
                        <button type="button" className="logout-button" onClick={handleCashierLogout}>
                          CERRAR SESIÓN
                        </button>
                      </div>
                      <p>Selecciona entradas, método de pago y genera la factura.</p>
                    </header>

                    <div className="ticket-grid">
                      {TICKET_TYPES.map((ticketType) => (
                        <article className="ticket-type-card" key={ticketType.key}>
                          <img src={ticketType.image} alt={ticketType.name} className="ticket-type-image" />
                          <div className="ticket-type-body">
                            <h3>{ticketType.name}</h3>
                            <p className="ticket-price">{ticketType.price} Bs</p>
                            <label htmlFor={`cashier-${ticketType.key}`}>Cantidad</label>
                            <div className="qty-controls">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCashierQuantity(
                                    ticketType.key,
                                    cashierQuantities[ticketType.key] - 1
                                  )
                                }
                              >
                                -
                              </button>
                              <input
                                id={`cashier-${ticketType.key}`}
                                type="number"
                                min="0"
                                value={cashierQuantities[ticketType.key]}
                                onChange={(event) =>
                                  handleCashierQuantity(ticketType.key, event.target.value)
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleCashierQuantity(
                                    ticketType.key,
                                    cashierQuantities[ticketType.key] + 1
                                  )
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>

                    <form className="checkout-card" onSubmit={handlePrepareCashierPayment}>
                      <h3>Datos del cliente</h3>
                      <div className="checkout-fields">
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Nombre completo"
                          value={cashierCustomer.fullName}
                          onChange={handleCashierCustomer}
                        />
                        <input
                          type="text"
                          name="idNumber"
                          placeholder="CI"
                          value={cashierCustomer.idNumber}
                          onChange={handleCashierCustomer}
                        />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Celular"
                          value={cashierCustomer.phone}
                          onChange={handleCashierCustomer}
                        />
                        <input
                          type="email"
                          name="email"
                          placeholder="Correo electrónico (opcional)"
                          value={cashierCustomer.email}
                          onChange={handleCashierCustomer}
                        />
                      </div>

                      <div className="payment-method">
                        <span>Método de pago</span>
                        <label>
                          <input
                            type="radio"
                            name="cashierPayment"
                            checked={cashierPaymentMethod === 'qr'}
                            onChange={() => {
                              setCashierPaymentMethod('qr');
                              setCashierPendingPayment(null);
                              setCashierQr('');
                              setCashierInvoice(null);
                              setCashierMessage('');
                            }}
                          />
                          QR
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="cashierPayment"
                            checked={cashierPaymentMethod === 'efectivo'}
                            onChange={() => {
                              setCashierPaymentMethod('efectivo');
                              setCashierPendingPayment(null);
                              setCashierQr('');
                              setCashierInvoice(null);
                              setCashierMessage('');
                            }}
                          />
                          Efectivo
                        </label>
                      </div>

                      <div className="checkout-summary">
                        <p>
                          <span>Total a pagar</span>
                          <strong>{cashierTotalAmount} Bs</strong>
                        </p>
                      </div>

                      <div className="checkout-actions">
                        <button type="submit" className="subscribe-button">
                          GENERAR COBRO
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => goToScreen('home')}
                        >
                          VOLVER AL INICIO
                        </button>
                      </div>
                      {cashierMessage ? <p className="feedback-message">{cashierMessage}</p> : null}
                    </form>

                    {cashierPendingPayment ? (
                      <aside className="payment-action-card">
                        <h3>Confirmar pago</h3>
                        <p>
                          <strong>Método:</strong> {cashierPendingPayment.method}
                        </p>
                        <p>
                          <strong>Total:</strong> {cashierPendingPayment.totalAmount} Bs
                        </p>
                        <button type="button" className="pay-button" onClick={handleCashierPayment}>
                          {cashierPendingPayment.method === 'QR'
                            ? 'PAGAR CON QR'
                            : 'PAGAR EN EFECTIVO'}
                        </button>
                      </aside>
                    ) : null}

                    {cashierQr ? (
                      <aside className="qr-result">
                        <h3>QR de pago</h3>
                        <img src={cashierQr} alt="QR de pago en caja" className="qr-image" />
                      </aside>
                    ) : null}

                    {cashierInvoice ? (
                      <section className="invoice-card">
                        <h3>Factura</h3>
                        <p>
                          <strong>Nro:</strong> {cashierInvoice.number}
                        </p>
                        <p>
                          <strong>Fecha:</strong> {cashierInvoice.date}
                        </p>
                        <p>
                          <strong>Cliente:</strong> {cashierInvoice.customerName}
                        </p>
                        <p>
                          <strong>Método de pago:</strong> {cashierInvoice.method}
                        </p>
                        <p>
                          <strong>Detalle:</strong> {cashierInvoice.summary}
                        </p>
                        <p>
                          <strong>Total:</strong> {cashierInvoice.totalAmount} Bs
                        </p>
                      </section>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {currentScreen === 'home' ? (
          <section className="location-section">
            <div className="location-card">
              <div className="location-media">
                <img src={colca6} alt="Ubicación Parque Colcapujllay" />
              </div>
              <div className="location-info">
                <p className="location-kicker">Ubicación oficial</p>
                <h3>Parque Ecoturístico Colcapujllay</h3>
                <p className="location-description">
                  Visítanos en Colcapirhua, Cochabamba. Contamos con acceso principal señalizado y
                  espacio para atención al visitante.
                </p>
                <div className="location-details">
                  <p>
                    <strong>Municipio:</strong> Colcapirhua
                  </p>
                  <p>
                    <strong>Departamento:</strong> Cochabamba
                  </p>
                </div>
                <a href="https://share.google/Fa7Duq6YtinW08mcU" target="_blank" rel="noreferrer">
                  Abrir dirección en Google Maps
                </a>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer
        onNavigateHome={() => goToScreen('home')}
        onNavigatePurchase={() => goToScreen('purchase')}
        onNavigateLogin={() => goToScreen('cashier')}
      />
    </div>
  );
}

export default App;

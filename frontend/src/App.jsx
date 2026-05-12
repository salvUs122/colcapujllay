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

const CASHIER_TICKETS_STORAGE_KEY = 'colca-cashier-tickets';
const CASHIER_INVOICE_IMAGE = '/imagenes/fotoFactura.png';

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getCashierTickets = () => {
  const storageValue = window.localStorage.getItem(CASHIER_TICKETS_STORAGE_KEY);
  return storageValue ? JSON.parse(storageValue) : {};
};

const saveCashierTickets = (ticketsByCode) => {
  window.localStorage.setItem(CASHIER_TICKETS_STORAGE_KEY, JSON.stringify(ticketsByCode));
};

const registerCashierTicket = (ticketData) => {
  const ticketsByCode = getCashierTickets();
  ticketsByCode[ticketData.code] = ticketData;
  saveCashierTickets(ticketsByCode);
};

const validateCashierTicket = (ticketCode) => {
  const normalizedCode = ticketCode.trim().toUpperCase();
  const ticketsByCode = getCashierTickets();
  const ticket = ticketsByCode[normalizedCode];

  if (!ticket) {
    return {
      status: 'INVALIDA',
      ticketCode: normalizedCode,
      message: 'La entrada no existe o ya no es válida.',
    };
  }

  if (ticket.status === 'USADO') {
    return {
      status: 'USADO',
      ticket,
      message: 'Esta entrada ya fue utilizada anteriormente.',
    };
  }

  const usedAt = new Date().toLocaleString('es-BO');
  const usedTicket = { ...ticket, status: 'USADO', usedAt };
  ticketsByCode[normalizedCode] = usedTicket;
  saveCashierTickets(ticketsByCode);

  return {
    status: 'USADO_AHORA',
    ticket: usedTicket,
    message: 'Entrada válida. Fue marcada como USADO.',
  };
};

function App() {
  const ticketCodeFromUrl = new URLSearchParams(window.location.search).get('ticket');
  const normalizedTicketCodeFromUrl = ticketCodeFromUrl ? ticketCodeFromUrl.trim().toUpperCase() : '';
  const heroImages = [colca1, colca2, colca3, colca4, colca5, colca6, colca7];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentScreen, setCurrentScreen] = useState(
    normalizedTicketCodeFromUrl ? 'ticketValidation' : 'home'
  );

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
  const [pendingTicketCode, setPendingTicketCode] = useState(normalizedTicketCodeFromUrl);
  const [ticketValidationResult, setTicketValidationResult] = useState(null);

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
    if (screenName !== 'ticketValidation' && window.location.search.includes('ticket=')) {
      window.history.replaceState({}, '', `${window.location.origin}${window.location.pathname}`);
      setTicketValidationResult(null);
    }

    if (screenName === 'home') {
      setPendingTicketCode('');
    }

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
      totalTickets: onlineTotalTickets,
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
    const entryCode = generateCode('ENT').toUpperCase();
    const entryValidationUrl = `${window.location.origin}${window.location.pathname}?ticket=${encodeURIComponent(entryCode)}`;
    const entryQrUrl = buildQrUrl(entryValidationUrl);

    registerCashierTicket({
      code: entryCode,
      status: 'VIGENTE',
      usedAt: null,
      customerName: onlineCustomer.fullName,
      customerId: onlineCustomer.idNumber,
      summary: onlineOrder.summary,
      totalAmount: onlineOrder.totalAmount,
      totalTickets: onlineOrder.totalTickets,
      saleCode: onlineOrder.code,
      invoiceNumber,
      issuedAt: issueDate,
    });

    setOnlineOrder((prev) => ({ ...prev, paid: true }));
    setOnlineInvoice({
      number: invoiceNumber,
      date: issueDate,
      method: 'QR',
      totalAmount: onlineOrder.totalAmount,
      summary: onlineOrder.summary,
      customerName: onlineCustomer.fullName,
      totalTickets: onlineOrder.totalTickets,
      entryCode,
      entryQrUrl,
      entryStatus: 'VIGENTE',
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
    if (pendingTicketCode) {
      setTicketValidationResult(validateCashierTicket(pendingTicketCode));
      setCurrentScreen('ticketValidation');
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

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
    const totalTickets = Object.values(cashierQuantities).reduce((acc, value) => acc + value, 0);
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
      totalTickets,
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
    const entryCode = generateCode('ENT').toUpperCase();
    const entryValidationUrl = `${window.location.origin}${window.location.pathname}?ticket=${encodeURIComponent(entryCode)}`;
    const entryQrUrl = buildQrUrl(entryValidationUrl);

    registerCashierTicket({
      code: entryCode,
      status: 'VIGENTE',
      usedAt: null,
      customerName: cashierCustomer.fullName,
      customerId: cashierCustomer.idNumber,
      summary: cashierPendingPayment.summary,
      totalAmount: cashierPendingPayment.totalAmount,
      totalTickets: cashierPendingPayment.totalTickets,
      saleCode: cashierPendingPayment.saleCode,
      invoiceNumber,
      issuedAt: issueDate,
    });

    setCashierInvoice({
      number: invoiceNumber,
      date: issueDate,
      method: cashierPendingPayment.method,
      totalAmount: cashierPendingPayment.totalAmount,
      summary: cashierPendingPayment.summary,
      customerName: cashierCustomer.fullName,
      totalTickets: cashierPendingPayment.totalTickets,
      entryCode,
      entryQrUrl,
      entryValidationUrl,
      entryStatus: 'VIGENTE',
    });
    setCashierPendingPayment(null);
    setCashierQr('');
    if (cashierCustomer.email.trim() && cashierCustomer.email.includes('@')) {
      setCashierMessage(`Pago confirmado. Factura enviada al correo ${cashierCustomer.email}.`);
      return;
    }

    setCashierMessage('Pago confirmado. Factura generada correctamente.');
  };

  const handleDownloadCashierInvoice = () => {
    if (!cashierInvoice) {
      return;
    }

    const invoiceImageUrl = new URL(CASHIER_INVOICE_IMAGE, window.location.origin).toString();
    const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Factura ${escapeHtml(cashierInvoice.number)}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        padding: 1.2rem;
        font-family: Arial, sans-serif;
        background: #f3f5fb;
        color: #1b2330;
      }
      .invoice {
        width: min(100%, 540px);
        max-width: 540px;
        margin: 0 auto;
        border: 1px solid #d8deea;
        border-radius: 12px;
        background: #fff;
        padding: 1rem;
      }
      .banner {
        width: 100%;
        max-height: 220px;
        height: auto;
        display: block;
        margin: 0 auto;
        object-fit: contain;
        border-radius: 10px;
        border: 1px solid #e3e8f3;
        background: #fff;
      }
      @media (max-width: 560px) {
        body {
          padding: 0.7rem;
        }
      }
      h1 {
        margin: 0.8rem 0 0.6rem;
        color: #18406c;
        font-size: 1.5rem;
      }
      .row {
        margin: 0.35rem 0;
        line-height: 1.4;
      }
      .status {
        display: inline-block;
        margin: 0.3rem 0 0.5rem;
        border-radius: 999px;
        padding: 0.22rem 0.66rem;
        border: 1px solid #5ab88d;
        color: #0d6742;
        background: #dcf5e9;
        font-weight: 700;
        font-size: 0.78rem;
        text-transform: uppercase;
      }
      .ticket-box {
        margin-top: 0.9rem;
        border: 1px solid #dbe2ef;
        border-radius: 10px;
        padding: 0.8rem;
      }
      .ticket-box h2 {
        margin: 0 0 0.55rem;
        font-size: 1.05rem;
        color: #1a4f78;
      }
      .qr {
        width: 220px;
        max-width: 100%;
        border: 4px solid #fff;
        border-radius: 8px;
        background: #fff;
      }
    </style>
  </head>
  <body>
    <section class="invoice">
      <img src="${invoiceImageUrl}" alt="Imagen superior de la factura" class="banner" />
      <h1>Factura</h1>
      <span class="status">Entrada: ${escapeHtml(cashierInvoice.entryStatus)}</span>
      <p class="row"><strong>Nro:</strong> ${escapeHtml(cashierInvoice.number)}</p>
      <p class="row"><strong>Fecha:</strong> ${escapeHtml(cashierInvoice.date)}</p>
      <p class="row"><strong>Cliente:</strong> ${escapeHtml(cashierInvoice.customerName)}</p>
      <p class="row"><strong>Método de pago:</strong> ${escapeHtml(cashierInvoice.method)}</p>
      <p class="row"><strong>Detalle:</strong> ${escapeHtml(cashierInvoice.summary)}</p>
      <p class="row"><strong>Total:</strong> ${escapeHtml(cashierInvoice.totalAmount)} Bs</p>
      <p class="row"><strong>Cantidad de entradas:</strong> ${escapeHtml(cashierInvoice.totalTickets)}</p>
      <p class="row"><strong>Código de entrada:</strong> ${escapeHtml(cashierInvoice.entryCode)}</p>
      <div class="ticket-box">
        <h2>QR de entrada (un solo uso)</h2>
        <img src="${escapeHtml(cashierInvoice.entryQrUrl)}" alt="QR de entrada" class="qr" />
      </div>
    </section>
  </body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const fileName = `Factura-${cashierInvoice.number}.html`;
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(blobUrl);
    setCashierMessage(`Factura descargada: ${fileName}`);
  };

  const handleDownloadOnlineInvoice = () => {
    if (!onlineInvoice) {
      return;
    }

    const invoiceImageUrl = new URL(CASHIER_INVOICE_IMAGE, window.location.origin).toString();
    const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Factura ${escapeHtml(onlineInvoice.number)}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        padding: 1.2rem;
        font-family: Arial, sans-serif;
        background: #f3f5fb;
        color: #1b2330;
      }
      .invoice {
        width: min(100%, 540px);
        max-width: 540px;
        margin: 0 auto;
        border: 1px solid #d8deea;
        border-radius: 12px;
        background: #fff;
        padding: 1rem;
      }
      .banner {
        width: 100%;
        max-height: 220px;
        height: auto;
        display: block;
        margin: 0 auto;
        object-fit: contain;
        border-radius: 10px;
        border: 1px solid #e3e8f3;
        background: #fff;
      }
      @media (max-width: 560px) {
        body {
          padding: 0.7rem;
        }
      }
      h1 {
        margin: 0.8rem 0 0.6rem;
        color: #18406c;
        font-size: 1.5rem;
      }
      .row {
        margin: 0.35rem 0;
        line-height: 1.4;
      }
      .status {
        display: inline-block;
        margin: 0.3rem 0 0.5rem;
        border-radius: 999px;
        padding: 0.22rem 0.66rem;
        border: 1px solid #5ab88d;
        color: #0d6742;
        background: #dcf5e9;
        font-weight: 700;
        font-size: 0.78rem;
        text-transform: uppercase;
      }
      .ticket-box {
        margin-top: 0.9rem;
        border: 1px solid #dbe2ef;
        border-radius: 10px;
        padding: 0.8rem;
      }
      .ticket-box h2 {
        margin: 0 0 0.55rem;
        font-size: 1.05rem;
        color: #1a4f78;
      }
      .ticket-note {
        margin: 0.45rem 0 0;
        color: #4c6075;
        font-size: 0.88rem;
      }
      .qr {
        width: 220px;
        max-width: 100%;
        border: 4px solid #fff;
        border-radius: 8px;
        background: #fff;
      }
    </style>
  </head>
  <body>
    <section class="invoice">
      <img src="${invoiceImageUrl}" alt="Imagen superior de la factura" class="banner" />
      <h1>Factura</h1>
      <span class="status">Entrada: ${escapeHtml(onlineInvoice.entryStatus)}</span>
      <p class="row"><strong>Nro:</strong> ${escapeHtml(onlineInvoice.number)}</p>
      <p class="row"><strong>Fecha:</strong> ${escapeHtml(onlineInvoice.date)}</p>
      <p class="row"><strong>Cliente:</strong> ${escapeHtml(onlineInvoice.customerName)}</p>
      <p class="row"><strong>Método de pago:</strong> ${escapeHtml(onlineInvoice.method)}</p>
      <p class="row"><strong>Detalle:</strong> ${escapeHtml(onlineInvoice.summary)}</p>
      <p class="row"><strong>Total:</strong> ${escapeHtml(onlineInvoice.totalAmount)} Bs</p>
      <p class="row"><strong>Cantidad de entradas:</strong> ${escapeHtml(onlineInvoice.totalTickets)}</p>
      <p class="row"><strong>Código de entrada:</strong> ${escapeHtml(onlineInvoice.entryCode)}</p>
      <div class="ticket-box">
        <h2>QR de entrada (un solo uso)</h2>
        <img src="${escapeHtml(onlineInvoice.entryQrUrl)}" alt="QR de entrada" class="qr" />
        <p class="ticket-note">La validación la realiza solo personal autorizado en caja.</p>
      </div>
    </section>
  </body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const fileName = `Factura-${onlineInvoice.number}.html`;
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(blobUrl);
    setOnlineMessage(`Factura descargada: ${fileName}`);
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
                  <section className="invoice-card cashier-invoice-card">
                    <img
                      src={CASHIER_INVOICE_IMAGE}
                      alt="Imagen superior de la factura"
                      className="cashier-invoice-banner"
                    />
                    <div className="cashier-invoice-header">
                      <h3>Factura</h3>
                      <span className="ticket-status-badge valid">
                        Entrada: {onlineInvoice.entryStatus}
                      </span>
                    </div>
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
                    <p>
                      <strong>Cantidad de entradas:</strong> {onlineInvoice.totalTickets}
                    </p>
                    <p>
                      <strong>Código de entrada:</strong> {onlineInvoice.entryCode}
                    </p>
                    <div className="cashier-ticket-qr">
                      <h4>QR de entrada (un solo uso)</h4>
                      <img
                        src={onlineInvoice.entryQrUrl}
                        alt={`QR de entrada ${onlineInvoice.entryCode}`}
                        className="ticket-qr-image"
                      />
                      <p className="ticket-qr-help">
                        La validación la realiza solo personal autorizado en caja.
                      </p>
                    </div>
                    <div className="invoice-download-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handleDownloadOnlineInvoice}
                      >
                        DESCARGAR FACTURA
                      </button>
                    </div>
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
                      <section className="invoice-card cashier-invoice-card">
                        <img
                          src={CASHIER_INVOICE_IMAGE}
                          alt="Imagen superior de la factura"
                          className="cashier-invoice-banner"
                        />
                        <div className="cashier-invoice-header">
                          <h3>Factura</h3>
                          <span className="ticket-status-badge valid">
                            Entrada: {cashierInvoice.entryStatus}
                          </span>
                        </div>
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
                        <p>
                          <strong>Cantidad de entradas:</strong> {cashierInvoice.totalTickets}
                        </p>
                        <p>
                          <strong>Código de entrada:</strong> {cashierInvoice.entryCode}
                        </p>
                        <div className="cashier-ticket-qr">
                          <h4>QR de entrada (un solo uso)</h4>
                          <img
                            src={cashierInvoice.entryQrUrl}
                            alt={`QR de entrada ${cashierInvoice.entryCode}`}
                            className="ticket-qr-image"
                          />
                          <p className="ticket-qr-help">
                            Al escanear este QR, la entrada se marca automáticamente como{' '}
                            <strong>USADO</strong>.
                          </p>
                          <a
                            href={cashierInvoice.entryValidationUrl}
                            className="ticket-validation-link"
                          >
                            Validar esta entrada
                          </a>
                        </div>
                        <div className="invoice-download-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={handleDownloadCashierInvoice}
                          >
                            DESCARGAR FACTURA
                          </button>
                        </div>
                      </section>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {currentScreen === 'ticketValidation' ? (
          <section className="screen-section">
            <div className="ticket-validation-wrapper">
              <div className="ticket-validation-card">
                <h2>Validación de entrada</h2>
                {!cashierLoggedIn ? (
                  <>
                    <p className="ticket-validation-message invalid">
                      Validación restringida. Inicia sesión en caja para validar entradas.
                    </p>
                    <button
                      type="button"
                      className="subscribe-button"
                      onClick={() => goToScreen('cashier')}
                    >
                      INICIAR SESIÓN EN CAJA
                    </button>
                    <button type="button" className="secondary-button" onClick={() => goToScreen('home')}>
                      VOLVER AL INICIO
                    </button>
                  </>
                ) : ticketValidationResult ? (
                  <>
                    <p
                      className={`ticket-validation-message ${
                        ticketValidationResult.status === 'INVALIDA' ? 'invalid' : 'ok'
                      }`}
                    >
                      {ticketValidationResult.message}
                    </p>
                    {ticketValidationResult.ticket ? (
                      <>
                        <p>
                          <strong>Código:</strong> {ticketValidationResult.ticket.code}
                        </p>
                        <p>
                          <strong>Cliente:</strong> {ticketValidationResult.ticket.customerName}
                        </p>
                        <p>
                          <strong>Detalle:</strong> {ticketValidationResult.ticket.summary}
                        </p>
                        <p>
                          <strong>Estado:</strong> {ticketValidationResult.ticket.status}
                        </p>
                        {ticketValidationResult.ticket.usedAt ? (
                          <p>
                            <strong>Marcada como USADO:</strong>{' '}
                            {ticketValidationResult.ticket.usedAt}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p>
                        <strong>Código:</strong> {ticketValidationResult.ticketCode}
                      </p>
                    )}
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => goToScreen('home')}
                    >
                      VOLVER AL INICIO
                    </button>
                  </>
                ) : (
                  <>
                    <p>No se recibió un código de entrada para validar.</p>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => goToScreen('home')}
                    >
                      VOLVER AL INICIO
                    </button>
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

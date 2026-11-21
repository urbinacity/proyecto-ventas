import { useEffect, useMemo, useState } from 'react'
import type { Product } from './data/products'
import { products } from './data/products'

const REDDIT_URL = 'https://www.reddit.com/user/alejandrim/'
const REDDIT_USERNAME = 'u/alejandrim'
const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

type Cart = Record<string, number>

function Icon({ name }: { name: 'search' | 'arrow' | 'plus' | 'minus' | 'close' | 'bag' | 'reddit' | 'chevron-left' | 'chevron-right' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    bag: <><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    reddit: <><circle cx="12" cy="13" r="7" /><circle cx="9.5" cy="13" r=".8" /><circle cx="14.5" cy="13" r=".8" /><path d="M9.5 16c1.4 1 3.6 1 5 0" /><path d="m15 6 1-3 3 1" /></>,
    'chevron-left': <path d="m15 18-6-6 6-6" />,
    'chevron-right': <path d="m9 18 6-6-6-6" />,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">{paths[name]}</svg>
}

function copyContactMessage(message: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    void navigator.clipboard.writeText(message).catch(() => undefined)
  }
}

function pickHeroProducts() {
  const amount = 2
  return [...products].sort(() => Math.random() - 0.5).slice(0, amount)
}

function ProductCard({ product, onOpen, onAdd }: { product: Product; onOpen: () => void; onAdd: () => void }) {
  return (
    <article className="product-card" onClick={onOpen}>
      <div className="product-image-wrap">
        <img src={product.cardImage} alt={product.name} loading="lazy" />
        <span className="condition-tag">{product.condition}</span>
        <button className="quick-view" onClick={(event) => { event.stopPropagation(); onOpen() }} aria-label={`Ver detalles de ${product.name}`}>
          <Icon name="arrow" />
        </button>
      </div>
      <div className="product-card-body">
        <p className="eyebrow">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-card-footer">
          <strong>{money.format(product.price)}</strong>
          <button className="add-button" onClick={(event) => { event.stopPropagation(); onAdd() }} disabled={!product.available}>
            {product.available ? <>Agregar <Icon name="plus" /></> : 'Vendido'}
          </button>
        </div>
      </div>
    </article>
  )
}

function ProductDetail({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: () => void }) {
  const [activeImage, setActiveImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const inquiryMessage = `Hola. Me interesa consultar por “${product.name}” (${money.format(product.price)}). ¿Sigue disponible?`

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (lightboxOpen) {
        if (event.key === 'Escape') setLightboxOpen(false)
        if (event.key === 'ArrowLeft') setActiveImage((current) => (current - 1 + product.images.length) % product.images.length)
        if (event.key === 'ArrowRight') setActiveImage((current) => (current + 1) % product.images.length)
        if (event.key === '+' || event.key === '=') setZoom((current) => Math.min(2.5, current + 0.25))
        if (event.key === '-') setZoom((current) => Math.max(0.75, current - 0.25))
        if (event.key === '0') setZoom(1)
        return
      }
      if (event.key === 'ArrowLeft') setActiveImage((current) => (current - 1 + product.images.length) % product.images.length)
      if (event.key === 'ArrowRight') setActiveImage((current) => (current + 1) % product.images.length)
      if (event.key === 'Home') setActiveImage(0)
      if (event.key === 'End') setActiveImage(product.images.length - 1)
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = '' }
  }, [lightboxOpen, onClose, product.images.length])

  useEffect(() => {
    if (lightboxOpen) setZoom(1)
  }, [activeImage, lightboxOpen])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar detalle"><Icon name="close" /></button>
        <div className="detail-gallery">
          <button className="gallery-main" onClick={() => setLightboxOpen(true)} aria-keyshortcuts="ArrowLeft ArrowRight Home End" aria-label={`Ver ${product.name}, imagen ${activeImage + 1}, en pantalla completa`}>
            <img src={product.images[activeImage]} alt={`${product.name}, imagen ${activeImage + 1}`} />
            <span className="gallery-hint">Click para ampliar · ← → navegar</span>
          </button>
          <div className="thumbnail-row">
            {product.images.map((image, index) => <button className={index === activeImage ? 'thumbnail active' : 'thumbnail'} key={image} onClick={() => setActiveImage(index)}><img src={image} alt="" /></button>)}
          </div>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{product.category} · {product.condition}</p>
          <h2 id="detail-title">{product.name}</h2>
          <p className="detail-price">{money.format(product.price)}</p>
          <p>{product.description}</p>
          <ul className="detail-list">{product.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
          <div className="detail-actions">
            <button className="primary-button" onClick={onAdd} disabled={!product.available}>{product.available ? <>Agregar al carrito <Icon name="plus" /></> : 'Producto vendido'}</button>
            <a className="contact-button outline" href={REDDIT_URL} onClick={() => copyContactMessage(inquiryMessage)} target="_blank" rel="noreferrer"><Icon name="reddit" /> Consultar por Reddit</a>
          </div>
        </div>
      </section>
      {lightboxOpen && <div className="lightbox-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setLightboxOpen(false)}>
        <section className="lightbox" role="dialog" aria-modal="true" aria-label={`${product.name}, imagen ampliada`}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Cerrar imagen ampliada"><Icon name="close" /></button>
          <button className="lightbox-nav lightbox-prev" onClick={() => setActiveImage((current) => (current - 1 + product.images.length) % product.images.length)} aria-label="Imagen anterior"><Icon name="chevron-left" /></button>
          <div className={zoom === 1 ? 'lightbox-image-frame' : 'lightbox-image-frame zoomed-frame'}>
            <img className={zoom === 1 ? 'lightbox-image' : 'lightbox-image zoomed'} style={zoom === 1 ? undefined : { width: `${zoom * 100}%` }} src={product.images[activeImage]} alt={`${product.name}, imagen ${activeImage + 1} de ${product.images.length}`} />
          </div>
          <button className="lightbox-nav lightbox-next" onClick={() => setActiveImage((current) => (current + 1) % product.images.length)} aria-label="Imagen siguiente"><Icon name="chevron-right" /></button>
          <div className="lightbox-tools" aria-label="Controles de zoom"><button onClick={() => setZoom((current) => Math.max(0.75, current - 0.25))} aria-label="Alejar imagen"><Icon name="minus" /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(1)}>Ajustar</button><button onClick={() => setZoom((current) => Math.min(2.5, current + 0.25))} aria-label="Acercar imagen"><Icon name="plus" /></button></div>
          <div className="lightbox-caption">{product.name} · {activeImage + 1} / {product.images.length}<span>← → fotos · + − zoom · 0 ajustar · Esc cerrar</span></div>
        </section>
      </div>}
    </div>
  )
}

function CartDrawer({ cart, onChange, onClose }: { cart: Cart; onChange: (id: string, amount: number) => void; onClose: () => void }) {
  const items = Object.entries(cart).map(([id, quantity]) => ({ product: products.find((product) => product.id === id)!, quantity })).filter(({ product }) => product)
  const total = items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)
  const message = [`Hola, Victor. Me interesan estos productos del garage sale:`, '', ...items.map(({ product, quantity }) => `• ${quantity} × ${product.name} — ${money.format(product.price * quantity)}`), '', `Total estimado: ${money.format(total)}`, '', '¿Me confirmás disponibilidad y opciones de retiro/envío?'].join('\n')

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="cart-drawer" aria-label="Carrito">
        <div className="drawer-heading"><div><p className="eyebrow">Tu selección</p><h2>Carrito</h2></div><button className="modal-close" onClick={onClose} aria-label="Cerrar carrito"><Icon name="close" /></button></div>
        {items.length === 0 ? <div className="empty-cart"><span className="empty-icon"><Icon name="bag" /></span><h3>Tu carrito está vacío</h3><p>Sumá algo que te guste y armamos la consulta.</p></div> : <>
          <div className="cart-items">{items.map(({ product, quantity }) => <div className="cart-item" key={product.id}><img src={product.cardImage} alt="" /><div className="cart-item-info"><strong>{product.name}</strong><span>{money.format(product.price)}</span><div className="quantity"><button onClick={() => onChange(product.id, quantity - 1)} aria-label="Quitar uno"><Icon name="minus" /></button><span>{quantity}</span><button onClick={() => onChange(product.id, quantity + 1)} aria-label="Agregar uno"><Icon name="plus" /></button></div></div></div>)}</div>
          <div className="cart-summary"><span>Total estimado</span><strong>{money.format(total)}</strong></div>
          <a className="contact-button" href={REDDIT_URL} onClick={() => copyContactMessage(message)} target="_blank" rel="noreferrer"><Icon name="reddit" /> Abrir Reddit y copiar resumen en portapapeles</a>
          <p className="cart-note">El resumen se copia para pegarlo en el chat de Reddit. No es una compra ni una reserva.</p>
        </>}
      </aside>
    </div>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [cart, setCart] = useState<Cart>({})
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [heroProducts] = useState<Product[]>(pickHeroProducts)
  const categories = ['Todos', ...new Set(products.map((product) => product.category))]
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'Todos' || product.category === category
    const normalizedQuery = query.toLowerCase().trim()
    const matchesQuery = !normalizedQuery || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(normalizedQuery)
    return matchesCategory && matchesQuery
  }), [category, query])
  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0)

  const addToCart = (id: string) => { setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 })); setSelectedProduct(null); setCartOpen(true) }
  const changeQuantity = (id: string, amount: number) => setCart((current) => { const next = { ...current }; if (amount <= 0) delete next[id]; else next[id] = amount; return next })

  return (
    <div className="site-shell">
      <header className="topbar"><a className="brand" href="#inicio"><span className="brand-mark">GS</span><span><strong>Garage Sale</strong><small>CABA · cosas con otra historia</small></span></a><nav><a href="#catalogo">Catálogo</a><a href="#como-funciona">Cómo funciona</a></nav><button className="cart-button" onClick={() => setCartOpen(true)}><Icon name="bag" /><span>Carrito</span>{cartCount > 0 && <b>{cartCount}</b>}</button></header>
      <main id="inicio">
        <section className="hero"><div className="hero-copy"><p className="kicker">OBJETOS ELEGIDOS · CABA</p><h1>Cosas con otra historia, <em>listas para la próxima.</em></h1><p className="hero-lede">Una selección de muebles, deco y objetos usados que todavía tienen mucho para dar. Mirá, elegí y escribime por Reddit.</p><a className="primary-button" href="#catalogo">Ver productos <Icon name="arrow" /></a></div><div className="hero-art">{heroProducts.map((product, index) => <button className={`hero-product-photo hero-product-photo-${index}`} key={product.id} onClick={() => setSelectedProduct(product)} aria-label={`Ver ${product.name}`}><img src={product.cardImage} alt={product.name} /><span>{product.name}</span></button>)}<div className="tape">segunda<br />oportunidad</div><div className="art-card art-card-back">✦</div><div className="art-card art-card-front"><span>encontrado<br />para vos</span><strong>↗</strong></div><div className="hero-stamp">reusar<br />es elegir<br />distinto</div></div></section>
        <section className="trust-strip"><div><strong>Retiro en CABA</strong><span>Coordinamos por Reddit</span></div><div><strong>Envíos a consultar</strong><span>Vemos la mejor opción para vos</span></div><div><strong>Sin vueltas</strong><span>Preguntá por cualquier detalle</span></div></section>
        <section className="catalog-section" id="catalogo"><div className="section-heading"><div><p className="kicker">LA SELECCIÓN ACTUAL</p><h2>Encontrá tu próximo hallazgo.</h2></div><span className="product-count">{visibleProducts.length} productos</span></div><div className="catalog-toolbar"><div className="search-box"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o categoría" aria-label="Buscar productos" /></div><div className="category-list">{categories.map((item) => <button className={category === item ? 'category-chip active' : 'category-chip'} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div>{visibleProducts.length > 0 ? <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onOpen={() => setSelectedProduct(product)} onAdd={() => addToCart(product.id)} />)}</div> : <div className="no-results"><h3>No encontramos ese hallazgo.</h3><p>Probá con otro nombre o categoría.</p></div>}</section>
        <section className="how-section" id="como-funciona"><div><p className="kicker">ASÍ DE SIMPLE</p><h2>Elegís. Consultás. Coordinamos.</h2></div><div className="steps"><div><span>01</span><strong>Mirás con calma</strong><p>Abrí cualquier producto para ver más fotos y detalles.</p></div><div><span>02</span><strong>Armás tu selección</strong><p>Sumá al carrito todo lo que te interese.</p></div><div><span>03</span><strong>Me escribís</strong><p>El botón abre Reddit con tu resumen listo para pegar.</p></div></div></section>
      </main>
      <footer><div className="brand footer-brand"><span className="brand-mark">GS</span><span><strong>Garage Sale</strong><small>CABA · cosas con otra historia</small></span></div><p>Hecho para encontrarle una nueva casa a cosas que todavía tienen mucho para dar.</p><a href={REDDIT_URL} target="_blank" rel="noreferrer"><Icon name="reddit" /> {REDDIT_USERNAME}</a></footer>
      {selectedProduct && <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={() => addToCart(selectedProduct.id)} />}
      {cartOpen && <CartDrawer cart={cart} onChange={changeQuantity} onClose={() => setCartOpen(false)} />}
    </div>
  )
}

export default App

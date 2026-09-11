/* =========================================
   MODASHOP 🇧🇴
   SCRIPT PRINCIPAL
========================================= */


/* =========================================
   CONFIGURACIÓN WHATSAPP
========================================= */

const WHATSAPP_NUMBER = "59170000000";

const WHATSAPP_MESSAGE =
    "Hola, Moda Shop 🇧🇴. Tengo una consulta sobre sus productos.";


/* =========================================
   BASE DE PRODUCTOS
========================================= */

const PRODUCTOS = {

    "guess-rosa": {

        id: "guess-rosa",

        nombre: "Billetera Guess Rosa",

        categoria: "Billeteras para Mujer",

        categoriaSlug: "billeteras",

        tipo: "Réplica",

        precio: 187.50,

        imagenPrincipal:
            "billetera-guess-rosa-1.jpg",

        galeria: [
            "billetera-guess-rosa-1.jpg",
            "billetera-guess-rosa-2.jpg",
            "billetera-guess-rosa-3.jpg",
            "billetera-guess-rosa-4.jpg",
            "billetera-guess-rosa-5.jpg",
            "billetera-guess-rosa-6.jpg",
            "billetera-guess-rosa-7.jpg"
        ],

        descripcion:
            "Billetera Guess Rosa, ideal para complementar tu estilo y llevar tus objetos personales de manera práctica y elegante.",

        descuento: 0,

        caracteristicas: [
            "Diseño femenino y moderno",
            "Tamaño práctico para uso diario",
            "Interior funcional",
            "Disponible en color rosa"
        ]

    }

};


/* =========================================
   ELEMENTOS GENERALES
========================================= */

const whatsappButton =
    document.getElementById("whatsappButton");

const footerWhatsapp =
    document.getElementById("footerWhatsapp");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const mobileMenu =
    document.getElementById("mobileMenu");

const mobileMenuClose =
    document.getElementById("mobileMenuClose");

const cartButton =
    document.getElementById("cartButton");


/* =========================================
   WHATSAPP
========================================= */

function configurarWhatsApp() {

    const mensaje =
        encodeURIComponent(WHATSAPP_MESSAGE);

    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`;

    if (whatsappButton) {
        whatsappButton.href = url;
    }

    if (footerWhatsapp) {
        footerWhatsapp.href = url;
    }

}


/* =========================================
   MENÚ MÓVIL
========================================= */

function abrirMenuMovil() {

    if (!mobileMenu) return;

    mobileMenu.classList.add("active");

}


function cerrarMenuMovil() {

    if (!mobileMenu) return;

    mobileMenu.classList.remove("active");

}


if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        abrirMenuMovil
    );

}


if (mobileMenuClose) {

    mobileMenuClose.addEventListener(
        "click",
        cerrarMenuMovil
    );

}


if (mobileMenu) {

    const mobileLinks =
        mobileMenu.querySelectorAll("a");

    mobileLinks.forEach(link => {

        link.addEventListener(
            "click",
            cerrarMenuMovil
        );

    });

}


/* =========================================
   CARRITO
========================================= */

const CART_STORAGE_KEY = "modashop_carrito";


function obtenerCarrito() {

    try {

        const carrito =
            JSON.parse(
                localStorage.getItem(
                    CART_STORAGE_KEY
                )
            );

        return Array.isArray(carrito)
            ? carrito
            : [];

    } catch (error) {

        return [];

    }

}


function guardarCarrito(carrito) {

    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(carrito)
    );

}


function obtenerCantidadTotal(carrito) {

    return carrito.reduce(
        (total, producto) =>
            total + producto.cantidad,
        0
    );

}


function precioFinalProducto(producto) {
    const descuento = Math.max(0, Math.min(100, Number(producto?.descuento || 0)));
    return Math.round(Number(producto?.precio || 0) * (1 - descuento / 100) * 100) / 100;
}

function formatearPrecio(precio) {

    return `${precio
        .toFixed(2)
        .replace(".", ",")} Bs.`;

}


/* =========================================
   ACTUALIZAR CONTADOR DEL CARRITO
========================================= */

function actualizarContadorCarrito() {

    const carrito =
        obtenerCarrito();

    const cantidad =
        obtenerCantidadTotal(carrito);

    document
        .querySelectorAll(".cart-count")
        .forEach(contador => {

            contador.textContent = cantidad;

        });

}


/* =========================================
   CREAR PANEL DEL CARRITO
========================================= */

function crearPanelCarrito() {

    if (document.getElementById("cartPanel")) {
        return;
    }

    const overlay =
        document.createElement("div");

    overlay.id = "cartOverlay";
    overlay.className = "cart-overlay";


    const drawer =
        document.createElement("aside");

    drawer.id = "cartPanel";
    drawer.className = "cart-panel";


    drawer.innerHTML = `

        <div class="cart-panel-header">

            <div>
                <span class="cart-panel-eyebrow">
                    TU COMPRA
                </span>

                <h2>
                    Mi carrito
                </h2>
            </div>

            <button
                type="button"
                class="cart-close-button"
                id="cartClose"
                aria-label="Cerrar carrito">

                <i class="fa-solid fa-xmark"></i>

            </button>

        </div>


        <div
            class="cart-panel-body"
            id="cartItems">
        </div>


        <div
            class="cart-empty"
            id="cartEmpty">

            <div class="cart-empty-icon">
                <i class="fa-solid fa-bag-shopping"></i>
            </div>

            <h3>
                Tu carrito está vacío
            </h3>

            <p>
                Agrega productos para comenzar tu compra.
            </p>

        </div>


        <div
            class="cart-panel-footer"
            id="cartFooter">

            <div class="cart-total-row">

                <span>
                    Total
                </span>

                <strong id="cartTotal">
                    0,00 Bs.
                </strong>

            </div>


            <p class="cart-footer-note">
                <i class="fa-solid fa-shield-halved"></i>
                Compra segura · Pago al recibir
            </p>

            <button
                type="button"
                class="cart-checkout-button"
                id="cartCheckout">

                <i class="fa-solid fa-lock"></i>

                Finalizar compra

            </button>

        </div>

    `;


    document.body.appendChild(overlay);
    document.body.appendChild(drawer);


    const closeButton =
        document.getElementById("cartClose");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            cerrarCarrito
        );

    }


    overlay.addEventListener(
        "click",
        cerrarCarrito
    );


    const checkout =
        document.getElementById("cartCheckout");


    if (checkout) {

        checkout.addEventListener(
            "click",
            abrirCheckout
        );

    }


    renderizarCarrito();

}


/* =========================================
   CHECKOUT - PEDIDO
========================================= */

function obtenerTotalCarrito() {

    return obtenerCarrito().reduce(
        (total, producto) =>
            total + (producto.precio * producto.cantidad),
        0
    );

}


function crearCheckout() {

    if (document.getElementById("checkoutOverlay")) {
        return;
    }

    const overlay = document.createElement("div");
    overlay.id = "checkoutOverlay";
    overlay.className = "checkout-overlay";

    const modal = document.createElement("section");
    modal.id = "checkoutModal";
    modal.className = "checkout-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "checkoutTitle");

    modal.innerHTML = `
        <div class="checkout-header">
            <div>
                <span class="checkout-eyebrow">ÚLTIMO PASO</span>
                <h2 id="checkoutTitle">Completa tu pedido</h2>
                <p>Déjanos tus datos para preparar tu entrega.</p>
            </div>

            <button type="button" class="checkout-close" id="checkoutClose" aria-label="Cerrar">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="checkout-content">
            <div class="checkout-benefits">
                <div>
                    <i class="fa-solid fa-truck-fast"></i>
                    <span><strong>Envío GRATIS</strong><small>A toda Bolivia</small></span>
                </div>
                <div>
                    <i class="fa-solid fa-hand-holding-dollar"></i>
                    <span><strong>Pago al recibir</strong><small>Pagas cuando recibes</small></span>
                </div>
            </div>

            <form id="checkoutForm" novalidate>
                <div class="checkout-section-title">
                    <span>01</span>
                    <h3>Datos de entrega</h3>
                </div>

                <div class="checkout-field">
                    <label for="checkoutName">Nombre completo <span>*</span></label>
                    <input type="text" id="checkoutName" name="nombre" placeholder="Ej. María Pérez" autocomplete="name" required>
                    <small class="checkout-error" id="checkoutNameError"></small>
                </div>

                <div class="checkout-field">
                    <label for="checkoutAddress">Dirección <span>*</span></label>
                    <textarea id="checkoutAddress" name="direccion" rows="2" placeholder="Calle, avenida, número, zona..." autocomplete="street-address" required></textarea>
                    <small class="checkout-error" id="checkoutAddressError"></small>
                </div>

                <div class="checkout-field">
                    <label for="checkoutReference">Referencia</label>
                    <textarea id="checkoutReference" name="referencia" rows="2" placeholder="Ej. Casa con puerta negra, frente a..." autocomplete="off"></textarea>
                </div>

                <div class="checkout-location-box">
                    <div class="checkout-location-icon">
                        <i class="fa-solid fa-location-dot"></i>
                    </div>
                    <div class="checkout-location-copy">
                        <strong>Ubicación exacta en Google Maps</strong>
                        <p>Recomendamos compartirla para que podamos encontrar tu dirección con mayor facilidad.</p>
                        <button type="button" class="checkout-location-button" id="checkoutLocationButton">
                            <i class="fa-solid fa-crosshairs"></i>
                            Compartir mi ubicación
                        </button>
                        <span class="checkout-location-status" id="checkoutLocationStatus"></span>
                    </div>
                </div>

                <input type="hidden" id="checkoutMapsLink" name="mapsLink" value="">

                <div class="checkout-section-title checkout-summary-title">
                    <span>02</span>
                    <h3>Resumen del pedido</h3>
                </div>

                <div class="checkout-order" id="checkoutOrder"></div>

                <div class="checkout-total">
                    <div>
                        <span>Subtotal</span>
                        <strong id="checkoutSubtotal">0,00 Bs.</strong>
                    </div>
                    <div>
                        <span>Envío</span>
                        <strong class="checkout-free">GRATIS</strong>
                    </div>
                    <div class="checkout-total-final">
                        <span>Total a pagar</span>
                        <strong id="checkoutTotal">0,00 Bs.</strong>
                    </div>
                </div>

                <div class="checkout-payment-note">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span><strong>Pago al recibir</strong> — No necesitas pagar por adelantado.</span>
                </div>

                <button type="submit" class="checkout-confirm-button">
                    <i class="fa-brands fa-whatsapp"></i>
                    Confirmar pedido por WhatsApp
                </button>

                <p class="checkout-final-note">
                    Al confirmar, prepararemos tu pedido y enviaremos los datos a ModaShop por WhatsApp.
                </p>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    document.getElementById("checkoutClose")?.addEventListener("click", cerrarCheckout);
    overlay.addEventListener("click", cerrarCheckout);

    document.getElementById("checkoutForm")?.addEventListener(
        "submit",
        confirmarPedido
    );

    document.getElementById("checkoutLocationButton")?.addEventListener(
        "click",
        obtenerUbicacionCheckout
    );

    document.addEventListener("keydown", manejarEscapeCheckout);
}


function abrirCheckout() {

    const carrito = obtenerCarrito();

    if (!carrito.length) {
        return;
    }

    crearCheckout();
    renderizarCheckout();

    const overlay = document.getElementById("checkoutOverlay");
    const modal = document.getElementById("checkoutModal");

    overlay?.classList.add("active");
    modal?.classList.add("active");
    document.body.classList.add("checkout-open");

    setTimeout(() => {
        document.getElementById("checkoutName")?.focus();
    }, 150);
}


function cerrarCheckout() {

    const overlay = document.getElementById("checkoutOverlay");
    const modal = document.getElementById("checkoutModal");

    overlay?.classList.remove("active");
    modal?.classList.remove("active");
    document.body.classList.remove("checkout-open");
}


function manejarEscapeCheckout(event) {

    if (event.key === "Escape") {
        cerrarCheckout();
    }

}


function renderizarCheckout() {

    const carrito = obtenerCarrito();
    const order = document.getElementById("checkoutOrder");
    const subtotalElement = document.getElementById("checkoutSubtotal");
    const totalElement = document.getElementById("checkoutTotal");

    if (!order) {
        return;
    }

    let total = 0;
    order.innerHTML = "";

    carrito.forEach(producto => {

        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        const item = document.createElement("div");
        item.className = "checkout-order-item";

        item.innerHTML = `
            <div class="checkout-order-image">
                <img src="${producto.imagen}" alt="${producto.nombre}">
            </div>
            <div class="checkout-order-info">
                <strong>${producto.nombre}</strong>
                <span>${producto.cantidad} × ${formatearPrecio(producto.precio)}</span>
            </div>
            <strong class="checkout-order-price">${formatearPrecio(subtotal)}</strong>
        `;

        order.appendChild(item);
    });

    if (subtotalElement) {
        subtotalElement.textContent = formatearPrecio(total);
    }

    if (totalElement) {
        totalElement.textContent = formatearPrecio(total);
    }
}


function obtenerUbicacionCheckout() {

    const button = document.getElementById("checkoutLocationButton");
    const status = document.getElementById("checkoutLocationStatus");
    const mapsLink = document.getElementById("checkoutMapsLink");

    if (!button || !status || !mapsLink) {
        return;
    }

    if (!navigator.geolocation) {
        status.textContent = "Tu navegador no permite obtener la ubicación. Puedes continuar sin ella.";
        return;
    }

    button.disabled = true;
    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Obteniendo ubicación...
    `;
    status.textContent = "Permite el acceso a tu ubicación cuando el navegador lo solicite.";

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const url = `https://www.google.com/maps?q=${lat},${lng}`;

            mapsLink.value = url;

            button.disabled = false;
            button.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Ubicación agregada
            `;
            status.innerHTML = `
                <a href="${url}" target="_blank" rel="noopener noreferrer">Ver ubicación en Google Maps</a>
            `;
        },
        error => {
            button.disabled = false;
            button.innerHTML = `
                <i class="fa-solid fa-location-crosshairs"></i>
                Intentar nuevamente
            `;

            if (error.code === 1) {
                status.textContent = "No se concedió permiso para acceder a la ubicación. Puedes continuar sin ella.";
            } else {
                status.textContent = "No pudimos obtener tu ubicación. Intenta nuevamente o continúa sin ella.";
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}


function validarCheckout() {

    const name = document.getElementById("checkoutName");
    const address = document.getElementById("checkoutAddress");
    const nameError = document.getElementById("checkoutNameError");
    const addressError = document.getElementById("checkoutAddressError");

    if (!name || !address) {
        return false;
    }

    if (nameError) nameError.textContent = "";
    if (addressError) addressError.textContent = "";

    let valido = true;

    if (name.value.trim().length < 2) {
        if (nameError) nameError.textContent = "Escribe tu nombre completo.";
        name.classList.add("invalid");
        valido = false;
    } else {
        name.classList.remove("invalid");
    }

    if (address.value.trim().length < 5) {
        if (addressError) addressError.textContent = "Escribe una dirección para la entrega.";
        address.classList.add("invalid");
        valido = false;
    } else {
        address.classList.remove("invalid");
    }

    return valido;
}


function confirmarPedido(event) {

    event.preventDefault();

    if (!validarCheckout()) {
        return;
    }

    const carrito = obtenerCarrito();

    if (!carrito.length) {
        cerrarCheckout();
        return;
    }

    const nombre = document.getElementById("checkoutName").value.trim();
    const direccion = document.getElementById("checkoutAddress").value.trim();
    const referencia = document.getElementById("checkoutReference").value.trim();
    const mapsLink = document.getElementById("checkoutMapsLink").value.trim();
    const total = obtenerTotalCarrito();

    let mensaje = `*NUEVO PEDIDO — MODASHOP 🇧🇴*\n\n`;
    mensaje += `*DATOS DE ENTREGA*\n`;
    mensaje += `👤 Nombre: ${nombre}\n`;
    mensaje += `📍 Dirección: ${direccion}\n`;
    mensaje += `📝 Referencia: ${referencia || "No especificada"}\n`;

    if (mapsLink) {
        mensaje += `🗺️ Ubicación en Google Maps: ${mapsLink}\n`;
    }

    mensaje += `\n*PEDIDO*\n`;

    carrito.forEach(producto => {
        const subtotal = producto.precio * producto.cantidad;
        mensaje += `• ${producto.nombre} × ${producto.cantidad} — ${formatearPrecio(subtotal)}\n`;
    });

    mensaje += `\n💰 Subtotal: ${formatearPrecio(total)}\n`;
    mensaje += `🚚 Envío: *GRATIS*\n`;
    mensaje += `💵 *Total a pagar: ${formatearPrecio(total)}*\n`;
    mensaje += `💳 Forma de pago: *Pago al recibir*`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank", "noopener,noreferrer");

    cerrarCheckout();
    cerrarCarrito();

    localStorage.removeItem(CART_STORAGE_KEY);
    actualizarContadorCarrito();

    const orderButton = document.getElementById("cartCheckout");
    if (orderButton) {
        orderButton.disabled = true;
    }

    renderizarCarrito();
}


/* =========================================
   ABRIR / CERRAR CARRITO
========================================= */

function abrirCarrito() {

    crearPanelCarrito();

    renderizarCarrito();

    const drawer =
        document.getElementById("cartPanel");

    const overlay =
        document.getElementById("cartOverlay");


    if (drawer) {
        drawer.classList.add("active");
    }

    if (overlay) {
        overlay.classList.add("active");
    }

    document.body.classList.add(
        "cart-open"
    );

}


document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        cerrarCarrito();
    }
});


function cerrarCarrito() {

    const drawer =
        document.getElementById("cartPanel");

    const overlay =
        document.getElementById("cartOverlay");


    if (drawer) {
        drawer.classList.remove("active");
    }

    if (overlay) {
        overlay.classList.remove("active");
    }

    document.body.classList.remove(
        "cart-open"
    );

}


if (cartButton) {

    cartButton.addEventListener(
        "click",
        abrirCarrito
    );

}


/* =========================================
   RENDERIZAR CARRITO
========================================= */

function renderizarCarrito() {

    const carrito =
        obtenerCarrito();


    const items =
        document.getElementById("cartItems");

    const empty =
        document.getElementById("cartEmpty");

    const footer =
        document.getElementById("cartFooter");

    const totalElement =
        document.getElementById("cartTotal");


    if (!items) {
        return;
    }


    items.innerHTML = "";


    if (carrito.length === 0) {

        if (empty) {
            empty.style.display = "flex";
        }

        if (footer) {
            footer.style.display = "none";
        }

        return;

    }


    if (empty) {
        empty.style.display = "none";
    }

    if (footer) {
        footer.style.display = "block";
    }


    let total = 0;


    carrito.forEach(producto => {

        const subtotal =
            producto.precio *
            producto.cantidad;

        total += subtotal;


        const item =
            document.createElement("div");

        item.className =
            "cart-item";


        item.innerHTML = `

            <div class="cart-item-image">

                <img
                    src="${producto.imagen}"
                    alt="${producto.nombre}">

            </div>


            <div class="cart-item-info">

                <h3>
                    ${producto.nombre}
                </h3>

                <span class="cart-item-category">
                    ${producto.categoria || "Producto ModaShop"}
                </span>

                <span class="cart-item-price">
                    ${formatearPrecio(producto.precio)}
                </span>


                <div class="cart-item-bottom">

                    <div class="cart-item-quantity">

                        <button
                            type="button"
                            class="cart-item-quantity-minus"
                            data-id="${producto.id}">

                            <i class="fa-solid fa-minus"></i>

                        </button>


                        <span>
                            ${producto.cantidad}
                        </span>


                        <button
                            type="button"
                            class="cart-item-quantity-plus"
                            data-id="${producto.id}">

                            <i class="fa-solid fa-plus"></i>

                        </button>

                    </div>


                    <strong class="cart-item-subtotal">
                        ${formatearPrecio(subtotal)}
                    </strong>

                </div>

            </div>


            <button
                type="button"
                class="cart-item-remove"
                data-id="${producto.id}"
                aria-label="Eliminar producto">

                <i class="fa-solid fa-trash"></i>

            </button>

        `;


        items.appendChild(item);

    });


    if (totalElement) {

        totalElement.textContent =
            formatearPrecio(total);

    }


    configurarControlesCarrito();

}


/* =========================================
   CONTROLES DEL CARRITO
========================================= */

function configurarControlesCarrito() {

    document
        .querySelectorAll(
            ".cart-item-quantity-minus"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    cambiarCantidadCarrito(
                        button.dataset.id,
                        -1
                    );

                }
            );

        });


    document
        .querySelectorAll(
            ".cart-item-quantity-plus"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    cambiarCantidadCarrito(
                        button.dataset.id,
                        1
                    );

                }
            );

        });


    document
        .querySelectorAll(
            ".cart-item-remove"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    eliminarDelCarrito(
                        button.dataset.id
                    );

                }
            );

        });

}


/* =========================================
   CAMBIAR CANTIDAD
========================================= */

function cambiarCantidadCarrito(
    productoId,
    cambio
) {

    const carrito =
        obtenerCarrito();


    const producto =
        carrito.find(
            item => item.id === productoId
        );


    if (!producto) {
        return;
    }


    producto.cantidad += cambio;


    if (producto.cantidad <= 0) {

        eliminarDelCarrito(productoId);

        return;

    }


    guardarCarrito(carrito);

    actualizarContadorCarrito();

    renderizarCarrito();

}


/* =========================================
   ELIMINAR DEL CARRITO
========================================= */

function eliminarDelCarrito(
    productoId
) {

    let carrito =
        obtenerCarrito();


    carrito =
        carrito.filter(
            producto =>
                producto.id !== productoId
        );


    guardarCarrito(carrito);

    actualizarContadorCarrito();

    renderizarCarrito();

}


/* =========================================
   AGREGAR PRODUCTO AL CARRITO
========================================= */

function agregarAlCarrito(
    producto,
    cantidad
) {

    const carrito =
        obtenerCarrito();


    const existente =
        carrito.find(
            item =>
                item.id === producto.id
        );


    if (existente) {

        existente.cantidad += cantidad;

    } else {

        carrito.push({

            id: producto.id,

            nombre: producto.nombre,

            precio: precioFinalProducto(producto),

            imagen: producto.imagenPrincipal,

            cantidad: cantidad

        });

    }


    guardarCarrito(carrito);

    actualizarContadorCarrito();

    renderizarCarrito();

    abrirCarrito();

}


/* =========================================
   ENLACES INTERNOS #
========================================= */

document
    .querySelectorAll('a[href^="#"]')
    .forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const targetId =
                    link.getAttribute("href");


                if (
                    targetId &&
                    targetId !== "#"
                ) {

                    const target =
                        document.querySelector(
                            targetId
                        );


                    if (target) {

                        event.preventDefault();

                        target.scrollIntoView({
                            behavior: "smooth"
                        });

                    }

                }

            }
        );

    });


/* =========================================
   OBTENER PRODUCTO DESDE LA URL
========================================= */

function obtenerProductoActual() {
    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");
    if (!id) return null;
    return PRODUCTOS[id] || null;
}

async function obtenerProductoDesdeAPI(id) {
    try {
        const response = await fetch(`/api/products/${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error("Producto no encontrado");
        const data = await response.json();
        return data.product || null;
    } catch {
        return PRODUCTOS[id] || null;
    }
}


/* =========================================
   GALERÍA DEL PRODUCTO
========================================= */

function configurarGaleria(producto) {

    const mainImage =
        document.getElementById(
            "mainProductImage"
        );


    const thumbnails =
        document.getElementById(
            "productThumbnails"
        );


    const prevButton =
        document.getElementById(
            "galleryPrev"
        );


    const nextButton =
        document.getElementById(
            "galleryNext"
        );


    if (!mainImage || !thumbnails) {
        return;
    }


    let imagenActual = 0;


    function mostrarImagen(indice) {

        if (!producto.galeria.length) {
            return;
        }


        if (indice < 0) {

            indice =
                producto.galeria.length - 1;

        }


        if (
            indice >=
            producto.galeria.length
        ) {

            indice = 0;

        }


        imagenActual = indice;


        const imagen =
            producto.galeria[
                imagenActual
            ];


        mainImage.src = imagen;

        mainImage.alt =
            `${producto.nombre} - Vista ${imagenActual + 1}`;


        thumbnails
            .querySelectorAll(
                ".product-thumbnail"
            )
            .forEach(
                (thumbnail, index) => {

                    thumbnail.classList.toggle(
                        "active",
                        index === imagenActual
                    );

                }
            );

    }


    thumbnails.innerHTML = "";


    producto.galeria.forEach(
        (imagen, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";

            button.className =
                "product-thumbnail";


            const img =
                document.createElement(
                    "img"
                );


            img.src = imagen;

            img.alt =
                `${producto.nombre} - Vista ${index + 1}`;


            button.appendChild(img);

            thumbnails.appendChild(button);


            button.addEventListener(
                "click",
                () => {

                    mostrarImagen(index);

                }
            );

        }
    );


    if (prevButton) {

        prevButton.addEventListener(
            "click",
            () => {

                mostrarImagen(
                    imagenActual - 1
                );

            }
        );

    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            () => {

                mostrarImagen(
                    imagenActual + 1
                );

            }
        );

    }


    mostrarImagen(0);

}


/* =========================================
   CARGAR INFORMACIÓN DEL PRODUCTO
========================================= */

async function cargarProducto() {

    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");
    const producto = id ? await obtenerProductoDesdeAPI(id) : null;


    if (!producto) {
        return;
    }


    const titulo =
        document.querySelector(
            ".product-detail-info h1"
        );


    if (titulo) {

        titulo.textContent =
            producto.nombre;

    }


    const categoria =
        document.querySelector(
            ".product-detail-category"
        );


    if (categoria) {

        categoria.textContent =
            producto.categoria.toUpperCase();

    }


    const precio = document.querySelector(".product-detail-price");

    if (precio) {
        const descuento = Math.max(0, Math.min(100, Number(producto.descuento || 0)));
        if (descuento > 0) {
            precio.innerHTML = `
                <div class="product-detail-price-wrap">
                    <span class="product-detail-price-old">${formatearPrecio(producto.precio)}</span>
                    <strong>${formatearPrecio(precioFinalProducto(producto))}</strong>
                    <span class="product-detail-discount">-${descuento}%</span>
                </div>`;
        } else {
            precio.textContent = formatearPrecio(producto.precio);
        }
    }


    const descripcion =
        document.querySelector(
            ".product-description p"
        );


    if (descripcion) {

        descripcion.textContent =
            producto.descripcion;

    }


    const lista =
        document.querySelector(
            ".product-features ul"
        );


    if (lista) {

        lista.innerHTML = "";


        producto.caracteristicas.forEach(
            caracteristica => {

                const li =
                    document.createElement(
                        "li"
                    );


                li.innerHTML = `
                    <i class="fa-solid fa-check"></i>
                    ${caracteristica}
                `;


                lista.appendChild(li);

            }
        );

    }


    document.title =
        `${producto.nombre} | ModaShop 🇧🇴`;


    configurarGaleria(producto);

    configurarWhatsAppProducto(producto);

    configurarCantidad(producto);

    configurarBotonCarrito(producto);

}


/* =========================================
   WHATSAPP DEL PRODUCTO
========================================= */

function configurarWhatsAppProducto(
    producto
) {

    const boton =
        document.getElementById(
            "productWhatsapp"
        );


    if (!boton) {
        return;
    }


    const mensaje =
        `Hola, ModaShop 🇧🇴. Estoy interesado/a en la ${producto.nombre}. ¿Podrían darme más información?`;


    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;


    boton.href = url;

}


/* =========================================
   SELECTOR DE CANTIDAD
========================================= */

function configurarCantidad(
    producto
) {

    const minus =
        document.getElementById(
            "quantityMinus"
        );


    const plus =
        document.getElementById(
            "quantityPlus"
        );


    const quantity =
        document.getElementById(
            "productQuantity"
        );


    if (
        !minus ||
        !plus ||
        !quantity
    ) {

        return;

    }


    let cantidad = 1;


    minus.addEventListener(
        "click",
        () => {

            if (cantidad > 1) {

                cantidad--;

                quantity.textContent =
                    cantidad;

            }

        }
    );


    plus.addEventListener(
        "click",
        () => {

            cantidad++;

            quantity.textContent =
                cantidad;

        }
    );

}


/* =========================================
   BOTÓN AGREGAR AL CARRITO
========================================= */

function configurarBotonCarrito(
    producto
) {

    const boton =
        document.getElementById(
            "addToCartButton"
        );


    if (!boton) {
        return;
    }


    boton.addEventListener(
        "click",
        () => {

            const quantity =
                document.getElementById(
                    "productQuantity"
                );


            const cantidad =
                quantity
                    ? parseInt(
                        quantity.textContent
                    )
                    : 1;


            agregarAlCarrito(
                producto,
                cantidad
            );


            boton.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Agregado al carrito
            `;


            setTimeout(
                () => {

                    boton.innerHTML = `
                        <i class="fa-solid fa-bag-shopping"></i>
                        Agregar al carrito
                    `;

                },
                1500
            );

        }
    );

}




/* =========================================
   CATÁLOGO DINÁMICO DESDE MODASHOP ADMIN
========================================= */

async function obtenerProductosCatalogo(categoria = "") {
    try {
        const url = categoria
            ? `/api/products?category=${encodeURIComponent(categoria)}`
            : "/api/products";
        const response = await fetch(url);
        if (!response.ok) throw new Error("API unavailable");
        const data = await response.json();
        return Array.isArray(data.products) ? data.products : [];
    } catch {
        return Object.values(PRODUCTOS);
    }
}

function renderizarTarjetaProducto(producto) {
    return `
        <a href="producto.html?id=${encodeURIComponent(producto.id)}" class="product-card">
            <div class="product-image">
                <img src="${producto.imagenPrincipal}" alt="${producto.nombre}">
            </div>
            <div class="product-info">
                <span class="product-category">${producto.categoria}</span>
                <h2>${producto.nombre}</h2>
                <div class="product-bottom">
                    <span class="product-price-wrap">
                        ${producto.descuento > 0 ? `<span class="product-price-old">${formatearPrecio(producto.precio)}</span>` : ""}
                        <span class="${producto.descuento > 0 ? "product-price-sale" : "product-price"}">${formatearPrecio(precioFinalProducto(producto))}</span>
                        ${producto.descuento > 0 ? `<span class="product-discount-badge">-${producto.descuento}%</span>` : ""}
                    </span>
                    <span class="product-view">Ver producto <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            </div>
        </a>`;
}

async function cargarCatalogoDinamico() {
    const grid = document.getElementById("catalogProductGrid");
    if (!grid) return;
    const productos = await obtenerProductosCatalogo("billeteras");
    grid.innerHTML = productos.length
        ? productos.map(renderizarTarjetaProducto).join("")
        : `<div class="catalog-loading">Todavía no hay productos publicados en esta categoría.</div>`;
}

/* =========================================
   INICIAR
========================================= */

configurarWhatsApp();

actualizarContadorCarrito();

cargarProducto();
cargarCatalogoDinamico();
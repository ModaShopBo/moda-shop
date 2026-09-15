const COOKIE_NAME = "modashop_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const INITIAL_PRODUCT = {
  id: "guess-rosa",
  nombre: "Billetera Guess Rosa",
  categoria: "Billeteras para Mujer",
  categoriaSlug: "billeteras",
  tipo: "Réplica",
  precio: 187.5,
  imagenPrincipal: "billetera-guess-rosa-1.jpg",
  galeria: [
    "billetera-guess-rosa-1.jpg",
    "billetera-guess-rosa-2.jpg",
    "billetera-guess-rosa-3.jpg",
    "billetera-guess-rosa-4.jpg",
    "billetera-guess-rosa-5.jpg",
    "billetera-guess-rosa-6.jpg",
    "billetera-guess-rosa-7.jpg"
  ],
  descripcion: "Billetera Guess Rosa, ideal para complementar tu estilo y llevar tus objetos personales de manera práctica y elegante.",
  caracteristicas: [
    "Diseño femenino y moderno",
    "Tamaño práctico para uso diario",
    "Interior funcional",
    "Disponible en color rosa"
  ],
  stock: 0,
  publicado: true,
  descuento: 0,
  orden: 0
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders }
  });
}

function htmlHeaders(contentType = "text/html; charset=utf-8") {
  return { "Content-Type": contentType };
}

function calcularPrecioFinal(precio, descuento) {
  const precioNumero = Number(precio || 0);
  const descuentoNumero = Math.max(0, Math.min(100, Number(descuento || 0)));
  return descuentoNumero > 0
    ? Math.round(precioNumero * (1 - descuentoNumero / 100))
    : precioNumero;
}

function normalizeProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    categoriaSlug: row.categoria_slug,
    tipo: row.tipo,
    precio: Number(row.precio),
    imagenPrincipal: row.imagen_principal,
    galeria: JSON.parse(row.galeria_json || "[]"),
    descripcion: row.descripcion || "",
    caracteristicas: JSON.parse(row.caracteristicas_json || "[]"),
    stock: Number(row.stock || 0),
    publicado: Boolean(row.publicado),
    descuento: Math.max(0, Math.min(100, Number(row.descuento || 0))),
    orden: Number(row.orden || 0),
    precioFinal: calcularPrecioFinal(row.precio, row.descuento),
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en
  };
}

async function ensureSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL,
      categoria_slug TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'Producto',
      precio REAL NOT NULL DEFAULT 0,
      imagen_principal TEXT NOT NULL,
      galeria_json TEXT NOT NULL DEFAULT '[]',
      descripcion TEXT NOT NULL DEFAULT '',
      caracteristicas_json TEXT NOT NULL DEFAULT '[]',
      stock INTEGER NOT NULL DEFAULT 0,
      publicado INTEGER NOT NULL DEFAULT 1,
      descuento INTEGER NOT NULL DEFAULT 0,
      orden INTEGER NOT NULL DEFAULT 0,
      creado_en TEXT NOT NULL,
      actualizado_en TEXT NOT NULL
    )
  `).run();

  try { await env.DB.prepare("ALTER TABLE products ADD COLUMN descuento INTEGER NOT NULL DEFAULT 0").run(); } catch (_) {}
  try { await env.DB.prepare("ALTER TABLE products ADD COLUMN orden INTEGER NOT NULL DEFAULT 0").run(); } catch (_) {}

  // No reinsertamos automáticamente un producto de ejemplo.
  // Si el administrador elimina un producto, debe permanecer eliminado.

}

function base64url(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    textToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textToBytes(value));
  return base64url(new Uint8Array(signature));
}

async function createSession(secret) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `admin.${expires}`;
  const signature = await sign(payload, secret);
  return `${base64url(textToBytes(payload))}.${signature}`;
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const cookies = header.split(";").map(v => v.trim());
  const item = cookies.find(v => v.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

async function validSession(request, secret) {
  if (!secret) return false;
  const token = getCookie(request, COOKIE_NAME);
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  try {
    const payload = new TextDecoder().decode(Uint8Array.from(atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/") + "=="), c => c.charCodeAt(0)));
    const [role, expiresText] = payload.split(".");
    if (role !== "admin" || Number(expiresText) < Math.floor(Date.now() / 1000)) return false;
    const expected = await sign(payload, secret);
    return expected === signature;
  } catch {
    return false;
  }
}

function sessionCookie(value) {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${SESSION_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function safeFilename(name) {
  return String(name || "foto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

async function putImages(env, productId, files, startIndex = 0) {
  const urls = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (!(file instanceof File) || !file.type.startsWith("image/")) continue;
    if (file.size > 8 * 1024 * 1024) throw new Error("Cada imagen debe pesar como máximo 8 MB.");
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = `products/${productId}/${String(startIndex + index + 1).padStart(2, "0")}-${crypto.randomUUID()}.${extension}`;
    await env.PRODUCT_IMAGES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" }
    });
    urls.push(`/media/${key}`);
  }
  return urls;
}

async function handleApi(request, env, url) {
  await ensureSchema(env);
  const path = url.pathname;

  if (request.method === "GET" && path === "/api/products") {
    const category = url.searchParams.get("category");
    let result;
    if (category) {
      result = await env.DB.prepare("SELECT * FROM products WHERE publicado = 1 AND categoria_slug = ? ORDER BY orden ASC, creado_en DESC").bind(category).all();
    } else {
      result = await env.DB.prepare("SELECT * FROM products WHERE publicado = 1 ORDER BY orden ASC, creado_en DESC").all();
    }
    return json({ products: result.results.map(normalizeProduct) });
  }

  if (request.method === "GET" && path.startsWith("/api/products/")) {
    const id = decodeURIComponent(path.split("/").pop());
    const row = await env.DB.prepare("SELECT * FROM products WHERE id = ? AND publicado = 1").bind(id).first();
    if (!row) return json({ error: "Producto no encontrado" }, 404);
    return json({ product: normalizeProduct(row) });
  }

  if (request.method === "POST" && path === "/api/admin/login") {
    if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
      return json({ error: "El administrador aún no está configurado en Cloudflare." }, 500);
    }
    const body = await request.json().catch(() => ({}));
    if (!body.password || body.password !== env.ADMIN_PASSWORD) {
      return json({ error: "Contraseña incorrecta." }, 401);
    }
    const token = await createSession(env.ADMIN_SESSION_SECRET);
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
  }

  if (request.method === "POST" && path === "/api/admin/logout") {
    return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
  }

  if (path.startsWith("/api/admin/")) {
    if (!(await validSession(request, env.ADMIN_SESSION_SECRET))) {
      return json({ error: "No autorizado." }, 401);
    }

    if (request.method === "GET" && path === "/api/admin/me") {
      return json({ ok: true });
    }

    if (request.method === "GET" && path === "/api/admin/products") {
      const result = await env.DB.prepare("SELECT * FROM products ORDER BY orden ASC, creado_en DESC").all();
      return json({ products: result.results.map(normalizeProduct) });
    }

    if (request.method === "POST" && path === "/api/admin/products") {
      const form = await request.formData();
      const nombre = String(form.get("nombre") || "").trim();
      const categoria = String(form.get("categoria") || "").trim();
      const categoriaSlug = String(form.get("categoriaSlug") || slugify(categoria)).trim();
      const tipo = String(form.get("tipo") || "Producto").trim();
      const precio = Number(form.get("precio"));
      const descripcion = String(form.get("descripcion") || "").trim();
      const caracteristicas = String(form.get("caracteristicas") || "").split("\n").map(v => v.trim()).filter(Boolean);
      const stock = Math.max(0, Number.parseInt(form.get("stock") || "0", 10));
      const publicado = form.get("publicado") !== "false";
      const descuento = Math.max(0, Math.min(100, Number.parseInt(form.get("descuento") || "0", 10)));
      const maxOrder = await env.DB.prepare("SELECT COALESCE(MAX(orden), -1) AS maxOrden FROM products").first();
      const orden = Number(maxOrder?.maxOrden ?? -1) + 1;
      const files = form.getAll("imagenes").filter(v => v instanceof File && v.size > 0);

      if (!nombre || !categoria || !Number.isFinite(precio) || precio < 0 || files.length < 1 || files.length > 10) {
        return json({ error: "Completa nombre, categoría, precio y sube entre 1 y 10 imágenes." }, 400);
      }

      const idBase = slugify(nombre) || `producto-${Date.now()}`;
      let id = idBase;
      let suffix = 2;
      while (await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(id).first()) {
        id = `${idBase}-${suffix++}`;
      }

      const galeria = await putImages(env, id, files);
      const now = new Date().toISOString();
      await env.DB.prepare(`INSERT INTO products (id,nombre,categoria,categoria_slug,tipo,precio,imagen_principal,galeria_json,descripcion,caracteristicas_json,stock,publicado,descuento,orden,creado_en,actualizado_en) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id, nombre, categoria, categoriaSlug, tipo, precio, galeria[0], JSON.stringify(galeria), descripcion, JSON.stringify(caracteristicas), stock, publicado ? 1 : 0, descuento, orden, now, now).run();

      return json({ ok: true, product: { ...INITIAL_PRODUCT, id, nombre, categoria, categoriaSlug, tipo, precio, imagenPrincipal: galeria[0], galeria, descripcion, caracteristicas, stock, publicado, descuento, orden } }, 201);
    }

    if (request.method === "PUT" && path.startsWith("/api/admin/products/") && path !== "/api/admin/products/order") {
      const id = decodeURIComponent(path.split("/").pop());
      const existing = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
      if (!existing) return json({ error: "Producto no encontrado." }, 404);
      const form = await request.formData();
      const nombre = String(form.get("nombre") || existing.nombre).trim();
      const categoria = String(form.get("categoria") || existing.categoria).trim();
      const categoriaSlug = String(form.get("categoriaSlug") || existing.categoria_slug).trim();
      const tipo = String(form.get("tipo") || existing.tipo).trim();
      const precio = Number(form.get("precio"));
      const descripcion = String(form.get("descripcion") || "").trim();
      const caracteristicas = String(form.get("caracteristicas") || "").split("\n").map(v => v.trim()).filter(Boolean);
      const stock = Math.max(0, Number.parseInt(form.get("stock") || "0", 10));
      const publicado = form.get("publicado") !== "false";
      const descuento = Math.max(0, Math.min(100, Number.parseInt(form.get("descuento") ?? existing.descuento ?? "0", 10)));
      const files = form.getAll("imagenes").filter(v => v instanceof File && v.size > 0);
      let galeria = JSON.parse(existing.galeria_json || "[]");
      if (files.length) galeria = galeria.concat(await putImages(env, id, files, galeria.length));
      const now = new Date().toISOString();
      await env.DB.prepare(`UPDATE products SET nombre=?,categoria=?,categoria_slug=?,tipo=?,precio=?,imagen_principal=?,galeria_json=?,descripcion=?,caracteristicas_json=?,stock=?,publicado=?,descuento=?,actualizado_en=? WHERE id=?`)
        .bind(nombre, categoria, categoriaSlug, tipo, precio, galeria[0] || "", JSON.stringify(galeria), descripcion, JSON.stringify(caracteristicas), stock, publicado ? 1 : 0, descuento, now, id).run();
      return json({ ok: true });
    }

    if (request.method === "DELETE" && path.startsWith("/api/admin/products/") && path.endsWith("/images")) {
      const id = decodeURIComponent(path.split("/").slice(-2, -1)[0]);
      const image = url.searchParams.get("image");
      const existing = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
      if (!existing) return json({ error: "Producto no encontrado." }, 404);
      let images = JSON.parse(existing.galeria_json || "[]");
      if (!image || !images.includes(image)) return json({ error: "Imagen no encontrada." }, 404);
      images = images.filter(item => item !== image);
      if (image.startsWith("/media/")) {
        try {
          await env.PRODUCT_IMAGES.delete(image.slice("/media/".length));
        } catch (error) {
          console.error("No se pudo eliminar la imagen de R2:", error);
        }
      }
      await env.DB.prepare("UPDATE products SET imagen_principal=?, galeria_json=?, actualizado_en=? WHERE id=?").bind(images[0] || "", JSON.stringify(images), new Date().toISOString(), id).run();
      return json({ ok: true, galeria: images });
    }

    if (request.method === "POST" && path.endsWith("/duplicate")) {
      const id = decodeURIComponent(path.split("/").slice(-2, -1)[0]);
      const existing = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
      if (!existing) return json({ error: "Producto no encontrado." }, 404);
      const base = slugify(`${existing.nombre} copia`) || `producto-${Date.now()}`;
      let newId = base, suffix = 2;
      while (await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(newId).first()) newId = `${base}-${suffix++}`;
      const oldImages = JSON.parse(existing.galeria_json || "[]");
      const newImages = [];
      for (let i = 0; i < oldImages.length; i++) {
        const image = oldImages[i];
        if (image.startsWith("/media/")) {
          const key = image.slice("/media/".length);
          const obj = await env.PRODUCT_IMAGES.get(key);
          if (obj) {
            const ext = key.split(".").pop() || "jpg";
            const newKey = `products/${newId}/${String(i + 1).padStart(2, "0")}-${crypto.randomUUID()}.${ext}`;
            await env.PRODUCT_IMAGES.put(newKey, obj.body, { httpMetadata: { contentType: obj.httpMetadata?.contentType || "image/jpeg", cacheControl: "public, max-age=31536000, immutable" } });
            newImages.push(`/media/${newKey}`);
          }
        } else newImages.push(image);
      }
      const maxOrder = await env.DB.prepare("SELECT COALESCE(MAX(orden), -1) AS maxOrden FROM products").first();
      const now = new Date().toISOString();
      await env.DB.prepare(`INSERT INTO products (id,nombre,categoria,categoria_slug,tipo,precio,imagen_principal,galeria_json,descripcion,caracteristicas_json,stock,publicado,descuento,orden,creado_en,actualizado_en) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(newId, `${existing.nombre} copia`, existing.categoria, existing.categoria_slug, existing.tipo, existing.precio, newImages[0] || existing.imagen_principal, JSON.stringify(newImages.length ? newImages : oldImages), existing.descripcion, existing.caracteristicas_json, existing.stock, 0, existing.descuento || 0, Number(maxOrder?.maxOrden ?? -1) + 1, now, now).run();
      const row = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(newId).first();
      return json({ ok: true, product: normalizeProduct(row) }, 201);
    }

    if (request.method === "PUT" && path === "/api/admin/products/order") {
      const body = await request.json().catch(() => ({}));
      const ids = Array.isArray(body.ids) ? body.ids : [];
      for (let i = 0; i < ids.length; i++) await env.DB.prepare("UPDATE products SET orden=? WHERE id=?").bind(i, String(ids[i])).run();
      return json({ ok: true });
    }

    if (request.method === "DELETE" && path.startsWith("/api/admin/products/")) {
      const id = decodeURIComponent(path.split("/").pop());
      const existing = await env.DB.prepare("SELECT galeria_json FROM products WHERE id = ?").bind(id).first();
      if (!existing) return json({ error: "Producto no encontrado." }, 404);
      const images = JSON.parse(existing.galeria_json || "[]");

      // Primero eliminamos el registro de D1. Así, un problema aislado
      // con R2 nunca puede impedir que el producto desaparezca del admin.
      const result = await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();

      if (!result.success || Number(result.meta?.changes || 0) !== 1) {
        return json({ error: "No se pudo eliminar el producto de la base de datos." }, 500);
      }

      // Las imágenes son limpieza secundaria. Si una no existe o R2 falla,
      // el producto igualmente ya fue eliminado de D1.
      for (const image of images) {
        if (!String(image).startsWith("/media/")) continue;
        const key = String(image).slice("/media/".length);
        if (!key) continue;
        try {
          await env.PRODUCT_IMAGES.delete(key);
        } catch (error) {
          console.error("No se pudo eliminar una imagen de R2:", error);
        }
      }

      return json({ ok: true, deletedId: id });
    }
  }

  return json({ error: "Ruta no encontrada" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try { return await handleApi(request, env, url); }
      catch (error) {
        console.error(error);
        return json({ error: "Ocurrió un error en el servidor." }, 500);
      }
    }

    if (url.pathname.startsWith("/media/")) {
      const key = decodeURIComponent(url.pathname.slice("/media/".length));
      const object = await env.PRODUCT_IMAGES.get(key);
      if (!object) return new Response("Imagen no encontrada", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      return new Response(object.body, { headers });
    }

    return env.ASSETS.fetch(request);
  }
};

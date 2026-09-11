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
  publicado: true
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
      creado_en TEXT NOT NULL,
      actualizado_en TEXT NOT NULL
    )
  `).run();

  const existing = await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(INITIAL_PRODUCT.id).first();
  if (!existing) {
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO products (id,nombre,categoria,categoria_slug,tipo,precio,imagen_principal,galeria_json,descripcion,caracteristicas_json,stock,publicado,creado_en,actualizado_en) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(
        INITIAL_PRODUCT.id,
        INITIAL_PRODUCT.nombre,
        INITIAL_PRODUCT.categoria,
        INITIAL_PRODUCT.categoriaSlug,
        INITIAL_PRODUCT.tipo,
        INITIAL_PRODUCT.precio,
        INITIAL_PRODUCT.imagenPrincipal,
        JSON.stringify(INITIAL_PRODUCT.galeria),
        INITIAL_PRODUCT.descripcion,
        JSON.stringify(INITIAL_PRODUCT.caracteristicas),
        INITIAL_PRODUCT.stock,
        1,
        now,
        now
      ).run();
  }
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

async function putImages(env, productId, files) {
  const urls = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (!(file instanceof File) || !file.type.startsWith("image/")) continue;
    if (file.size > 8 * 1024 * 1024) throw new Error("Cada imagen debe pesar como máximo 8 MB.");
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = `products/${productId}/${String(index + 1).padStart(2, "0")}-${crypto.randomUUID()}.${extension}`;
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
      result = await env.DB.prepare("SELECT * FROM products WHERE publicado = 1 AND categoria_slug = ? ORDER BY creado_en DESC").bind(category).all();
    } else {
      result = await env.DB.prepare("SELECT * FROM products WHERE publicado = 1 ORDER BY creado_en DESC").all();
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
      const result = await env.DB.prepare("SELECT * FROM products ORDER BY creado_en DESC").all();
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
      await env.DB.prepare(`INSERT INTO products (id,nombre,categoria,categoria_slug,tipo,precio,imagen_principal,galeria_json,descripcion,caracteristicas_json,stock,publicado,creado_en,actualizado_en) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id, nombre, categoria, categoriaSlug, tipo, precio, galeria[0], JSON.stringify(galeria), descripcion, JSON.stringify(caracteristicas), stock, publicado ? 1 : 0, now, now).run();

      return json({ ok: true, product: { ...INITIAL_PRODUCT, id, nombre, categoria, categoriaSlug, tipo, precio, imagenPrincipal: galeria[0], galeria, descripcion, caracteristicas, stock, publicado } }, 201);
    }

    if (request.method === "PUT" && path.startsWith("/api/admin/products/")) {
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
      const files = form.getAll("imagenes").filter(v => v instanceof File && v.size > 0);
      let galeria = JSON.parse(existing.galeria_json || "[]");
      if (files.length) galeria = await putImages(env, id, files);
      const now = new Date().toISOString();
      await env.DB.prepare(`UPDATE products SET nombre=?,categoria=?,categoria_slug=?,tipo=?,precio=?,imagen_principal=?,galeria_json=?,descripcion=?,caracteristicas_json=?,stock=?,publicado=?,actualizado_en=? WHERE id=?`)
        .bind(nombre, categoria, categoriaSlug, tipo, precio, galeria[0] || existing.imagen_principal, JSON.stringify(galeria), descripcion, JSON.stringify(caracteristicas), stock, publicado ? 1 : 0, now, id).run();
      return json({ ok: true });
    }

    if (request.method === "DELETE" && path.startsWith("/api/admin/products/")) {
      const id = decodeURIComponent(path.split("/").pop());
      const existing = await env.DB.prepare("SELECT galeria_json FROM products WHERE id = ?").bind(id).first();
      if (!existing) return json({ error: "Producto no encontrado." }, 404);
      const images = JSON.parse(existing.galeria_json || "[]");
      for (const image of images) {
        const key = image.replace(/^\/media\//, "");
        if (key) await env.PRODUCT_IMAGES.delete(key);
      }
      await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
      return json({ ok: true });
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

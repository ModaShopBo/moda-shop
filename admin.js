const $ = (selector) => document.querySelector(selector);
const loginView = $("#loginView");
const adminView = $("#adminView");
const loginForm = $("#loginForm");
const productForm = $("#productForm");
const productList = $("#productList");
const productEditor = $("#productEditor");
const productImages = $("#productImages");
const imagePreview = $("#imagePreview");
const adminMessage = $("#adminMessage");
let products = [];

function message(el, text, success = false) { el.textContent = text || ""; el.className = `message${success ? " success" : ""}`; }
function money(value) { return `${Number(value).toFixed(2).replace(".", ",")} Bs.`; }

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Ocurrió un error.");
  return data;
}

async function checkSession() {
  try { await api("/api/admin/me"); showAdmin(); await loadProducts(); }
  catch { loginView.classList.remove("hidden"); adminView.classList.add("hidden"); }
}

function showAdmin() {
  loginView.classList.add("hidden"); adminView.classList.remove("hidden"); $("#logoutButton").classList.remove("hidden");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault(); message($("#loginMessage"), "Entrando...");
  try { await api("/api/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ password:$("#loginPassword").value }) }); showAdmin(); await loadProducts(); }
  catch(error) { message($("#loginMessage"), error.message); }
});

$("#logoutButton").addEventListener("click", async () => { await api("/api/admin/logout", {method:"POST"}).catch(()=>{}); location.reload(); });
$("#newProductButton").addEventListener("click", () => openEditor());
$("#closeEditor").addEventListener("click", closeEditor);
$("#cancelEditor").addEventListener("click", closeEditor);
productImages.addEventListener("change", previewFiles);

function previewFiles() {
  imagePreview.innerHTML = "";
  [...productImages.files].slice(0,10).forEach(file => { const img = document.createElement("img"); img.src = URL.createObjectURL(file); imagePreview.appendChild(img); });
}

async function loadProducts() {
  try { const data = await api("/api/admin/products"); products = data.products || []; renderProducts(); }
  catch(error) { message(adminMessage, error.message); }
}

function renderProducts() {
  if (!products.length) { productList.innerHTML = `<div class="empty">Todavía no hay productos administrados. Crea el primero.</div>`; return; }
  productList.innerHTML = products.map(product => `
    <article class="admin-product">
      <img src="${escapeHtml(product.imagenPrincipal)}" alt="${escapeHtml(product.nombre)}">
      <div><h3>${escapeHtml(product.nombre)}</h3><div class="admin-product-meta"><span>${money(product.precio)}</span><span>${escapeHtml(product.categoria)}</span><span>${product.publicado ? "Publicado" : "Oculto"}</span></div></div>
      <div class="admin-product-actions"><button class="small-button" data-edit="${escapeHtml(product.id)}">Editar</button><button class="small-button delete" data-delete="${escapeHtml(product.id)}">Eliminar</button></div>
    </article>`).join("");
  productList.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => openEditor(btn.dataset.edit)));
  productList.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => deleteProduct(btn.dataset.delete)));
}

function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char])); }

function openEditor(id = "") {
  productForm.reset(); imagePreview.innerHTML = ""; $("#productId").value = ""; $("#productPublished").checked = true;
  const product = products.find(p => p.id === id);
  if (product) {
    $("#editorTitle").textContent = "Editar producto"; $("#productId").value = product.id; $("#productName").value = product.nombre; $("#productPrice").value = product.precio; $("#productType").value = product.tipo; $("#productStock").value = product.stock; $("#productDescription").value = product.descripcion; $("#productFeatures").value = (product.caracteristicas || []).join("\n"); $("#productPublished").checked = product.publicado;
    const categoryValue = `${product.categoria}|${product.categoriaSlug}`; const option = [...$("#productCategory").options].find(o => o.value === categoryValue); if (option) $("#productCategory").value = categoryValue;
  } else { $("#editorTitle").textContent = "Nuevo producto"; }
  productEditor.classList.remove("hidden"); productEditor.scrollIntoView({behavior:"smooth", block:"start"});
}
function closeEditor() { productEditor.classList.add("hidden"); }

productForm.addEventListener("submit", async (event) => {
  event.preventDefault(); const button = $("#saveProductButton"); button.disabled = true; button.textContent = "Guardando..."; message($("#formMessage"), "");
  const [categoria, categoriaSlug] = $("#productCategory").value.split("|");
  const form = new FormData(); form.set("nombre", $("#productName").value); form.set("precio", $("#productPrice").value); form.set("categoria", categoria); form.set("categoriaSlug", categoriaSlug); form.set("tipo", $("#productType").value); form.set("stock", $("#productStock").value); form.set("publicado", $("#productPublished").checked ? "true" : "false"); form.set("descripcion", $("#productDescription").value); form.set("caracteristicas", $("#productFeatures").value); [...productImages.files].forEach(file => form.append("imagenes", file));
  const id = $("#productId").value;
  try { await api(id ? `/api/admin/products/${encodeURIComponent(id)}` : "/api/admin/products", { method:id ? "PUT" : "POST", body:form }); message($("#formMessage"), "Producto guardado correctamente.", true); await loadProducts(); setTimeout(closeEditor, 500); }
  catch(error) { message($("#formMessage"), error.message); }
  finally { button.disabled = false; button.textContent = "Guardar producto"; }
});

async function deleteProduct(id) {
  const product = products.find(p => p.id === id); if (!product) return;
  if (!confirm(`¿Eliminar "${product.nombre}"? Esta acción no se puede deshacer.`)) return;
  try { await api(`/api/admin/products/${encodeURIComponent(id)}`, {method:"DELETE"}); message(adminMessage, "Producto eliminado.", true); await loadProducts(); }
  catch(error) { message(adminMessage, error.message); }
}

checkSession();

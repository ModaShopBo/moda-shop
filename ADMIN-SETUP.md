# ModaShop Admin — configuración

El administrador usa Cloudflare Worker + D1 + R2.

1. `wrangler.jsonc` crea/declara la base D1 `modashop-db` y el bucket R2 `modashop-images`.
2. En Cloudflare > Worker `moda-shop` > Settings > Variables & Secrets, crea dos secretos:
   - `ADMIN_PASSWORD`: una contraseña fuerte elegida por ti.
   - `ADMIN_SESSION_SECRET`: una cadena larga y aleatoria (por ejemplo, 32+ caracteres).
3. Haz un nuevo deploy desde GitHub/Workers Builds.
4. Abre `https://TU-DOMINIO/admin.html`.
5. Entra con `ADMIN_PASSWORD`.

Las imágenes nuevas se almacenan en R2 y los datos de los productos en D1. El catálogo público consulta `/api/products`.


## Infraestructura conectada
- D1: modashop-db (database_id: 78e10f12-5647-4d54-9823-d72e3a96bc6c)
- R2: modashop-images (binding: PRODUCT_IMAGES)

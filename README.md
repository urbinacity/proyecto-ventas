# Garage Sale CABA

Catálogo frontend estático para vender productos usados y recibir consultas por Reddit.

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Agregar productos

1. Creá una carpeta dentro de `productos/`, por ejemplo `productos/ropa037/`.
2. Agregá allí un `producto.json` y una carpeta `fotos originales/` con las fotos sin comprimir.
3. Ejecutá `pnpm optimize-images`.
4. El script actualizará `src/data/products.ts` y generará las imágenes WebP en `public/productos/`.
5. Marcá `"disponible": false` en el JSON si más adelante querés agregar esa propiedad; por defecto los productos se cargan disponibles.

El optimizador recorre todos los productos y genera dos versiones WebP por imagen: una liviana para tarjetas y otra más grande para el detalle. Si ambas versiones ya existen, las saltea para no reprocesarlas. Los originales quedan fuera del deploy mediante `.gitignore`.

## Build

```bash
pnpm build
```

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import sharp from 'sharp'

const productsDir = join(process.cwd(), 'productos')
const outputDir = join(process.cwd(), 'public', 'productos')
const catalogPath = join(process.cwd(), 'src', 'data', 'products.ts')
const supported = new Set(['.jpg', '.jpeg', '.png', '.webp'])

await mkdir(outputDir, { recursive: true })
let entries

try {
  entries = await readdir(productsDir, { withFileTypes: true })
} catch {
  console.error(`No existe ${productsDir}. Creala con una carpeta por producto.`)
  process.exit(1)
}

const productEntries = entries.filter((entry) => entry.isDirectory() && entry.name !== 'originales').sort((a, b) => a.name.localeCompare(b.name))

if (productEntries.length === 0) {
  console.log('No se encontraron carpetas de productos.')
  process.exit(0)
}

const catalog = []
let optimizedCount = 0

for (const folder of productEntries) {
  const productDir = join(productsDir, folder.name)
  const productFile = join(productDir, 'producto.json')
  const metadata = JSON.parse(await readFile(productFile, 'utf8'))
  const imageDir = join(productDir, metadata.fotos_originales || 'fotos originales')
  const productOutputDir = join(outputDir, folder.name)
  await mkdir(productOutputDir, { recursive: true })

  let images = []
  try {
    images = (await readdir(imageDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && supported.has(extname(entry.name).toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    console.warn(`⚠ Sin carpeta de fotos: ${folder.name}`)
  }

  const imagePaths = []
  let cardImage = '/productos/placeholder-1.svg'
  for (const [index, image] of images.entries()) {
    const source = join(imageDir, image.name)
    const baseName = `${String(index + 1).padStart(2, '0')}`
    const cardPath = `/productos/${folder.name}/${baseName}-card.webp`
    await sharp(source).rotate().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(productOutputDir, `${baseName}-card.webp`))
    await sharp(source).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toFile(join(productOutputDir, `${baseName}-detail.webp`))
    if (index === 0) cardImage = cardPath
    imagePaths.push(`/productos/${folder.name}/${baseName}-detail.webp`)
    optimizedCount += 1
  }

  const notes = typeof metadata.notas === 'string' ? metadata.notas.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : []
  catalog.push({
    id: folder.name,
    name: metadata.nombre,
    category: metadata.categoria,
    price: metadata.precio_ars,
    condition: 'Usado',
    description: metadata.descripcion,
    details: notes,
    available: true,
    cardImage,
    images: imagePaths.length ? imagePaths : ['/productos/placeholder-1.svg'],
  })
  console.log(`✓ ${folder.name}: ${images.length} imagen(es)`)
}

const source = `// Archivo generado por pnpm optimize-images. Editá los producto.json y volvé a ejecutar el comando.\n\nexport type Product = {\n  id: string\n  name: string\n  category: string\n  price: number\n  condition: string\n  description: string\n  details: string[]\n  available: boolean\n  cardImage: string\n  images: string[]\n}\n\nexport const products: Product[] = ${JSON.stringify(catalog, null, 2)}\n`
await writeFile(catalogPath, source)
console.log(`\nListo: ${optimizedCount} imagen(es) optimizada(s), ${catalog.length} producto(s) en ${catalogPath}`)

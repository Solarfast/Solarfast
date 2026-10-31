import { defineConfig, loadEnv } from 'vite'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { escapeHtml, getPageMetadata, seoRoutes } from './src/lib/seo.js'

function routeMetadataPages(siteUrl) {
  return {
    name: 'solarfast-route-metadata',
    closeBundle() {
      const outputDirectory = path.resolve(import.meta.dirname, 'dist')
      const baseHtml = readFileSync(path.join(outputDirectory, 'index.html'), 'utf8')
      const logoUrl = `${siteUrl}/assets/solarfast-logo.png`

      for (const route of seoRoutes) {
        const metadata = getPageMetadata(route, '', 'nl')
        const canonicalUrl = siteUrl ? `${siteUrl}${route === '/' ? '/' : route}` : ''
        let html = baseHtml
          .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
          .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(metadata.description)}" />`)
          .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`)
          .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`)
          .replace(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${escapeHtml(siteUrl ? logoUrl : '/assets/solarfast-logo.png')}" />`)
          .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`)
          .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`)
          .replace(/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${escapeHtml(siteUrl ? logoUrl : '/assets/solarfast-logo.png')}" />`)

        if (metadata.noIndex) {
          html = html.replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n  </head>')
        }
        if (canonicalUrl) {
          html = html.replace(
            '</head>',
            `    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />\n    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />\n  </head>`,
          )
        }

        const relativeRoute = route === '/' ? '' : route.slice(1)
        const routeDirectory = path.join(outputDirectory, relativeRoute)
        mkdirSync(routeDirectory, { recursive: true })
        writeFileSync(path.join(routeDirectory, 'index.html'), html)
      }

      const robots = [
        'User-agent: *',
        'Allow: /',
        ...(siteUrl ? [`Sitemap: ${siteUrl}/sitemap.xml`] : []),
        '',
      ].join('\n')
      writeFileSync(path.join(outputDirectory, 'robots.txt'), robots)

      if (siteUrl) {
        const sitemapRoutes = seoRoutes.filter((route) => route !== '/results')
        const entries = sitemapRoutes.map((route) => {
          const url = `${siteUrl}${route === '/' ? '/' : route}`
          return `  <url><loc>${escapeHtml(url)}</loc></url>`
        }).join('\n')
        writeFileSync(
          path.join(outputDirectory, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
        )
      }

      let notFoundHtml = baseHtml
        .replace(/<title>[^<]*<\/title>/, '<title>Pagina niet gevonden | SolarFast</title>')
        .replace(/<meta name="description" content="[^"]*"\s*\/?>/, '<meta name="description" content="Deze pagina bestaat niet of is verplaatst." />')
        .replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n  </head>')
      if (siteUrl) {
        notFoundHtml = notFoundHtml.replace('<link rel="canonical" href="/" />', '')
      } else {
        notFoundHtml = notFoundHtml.replace('<link rel="canonical" href="/" />', '')
      }
      writeFileSync(path.join(outputDirectory, '404.html'), notFoundHtml)
    },
  }
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, import.meta.dirname, 'VITE_')
  const publicSiteUrl = String(environment.VITE_PUBLIC_SITE_URL || '')
    .trim()
    .replace(/\/+$/, '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      routeMetadataPages(publicSiteUrl),
    ],
    resolve: {
      alias: {
        '@assets': path.resolve(import.meta.dirname, './public/assets'),
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        }
      }
    }
  }
})

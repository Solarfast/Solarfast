const pageLoaders = {
  '/': () => import('../pages/HomePage.jsx'),
  '/calculator': () => import('../pages/CalculatorPage.jsx'),
  '/salderen-calculator': () => import('../pages/SalderenCalculatorPage.jsx'),
  '/results': () => import('../pages/ResultsPage.jsx'),
  '/hoe-werkt-het': () => import('../pages/HoeWerktHetPage.jsx'),
  '/aanbod': () => import('../pages/AanbodPage.jsx'),
  '/over-ons': () => import('../pages/OverOnsPage.jsx'),
  '/hyxipower': () => import('../pages/HyxiPowerPage.jsx'),
  '/warmtefonds': () => import('../pages/WarmtefondsPage.jsx'),
  '/waarom-solarfast': () => import('../pages/WaaromSolarFastPage.jsx'),
  '/faq': () => import('../pages/FAQPage.jsx'),
  '/video': () => import('../components/video/VideoTemplate.jsx'),
  '/privacy': () => import('../pages/PrivacyPage.jsx'),
  '*': () => import('../pages/NotFoundPage.jsx'),
}

const prefetchedRoutes = new Set()
const routePromises = new Map()

export function loadRoute(route) {
  const resolvedRoute = pageLoaders[route] ? route : '*'
  if (!routePromises.has(resolvedRoute)) {
    const request = pageLoaders[resolvedRoute]().catch((error) => {
      routePromises.delete(resolvedRoute)
      prefetchedRoutes.delete(resolvedRoute)
      throw error
    })
    routePromises.set(resolvedRoute, request)
  }
  return routePromises.get(resolvedRoute)
}

export function prefetchRoute(route) {
  if (!pageLoaders[route] || prefetchedRoutes.has(route)) return Promise.resolve()
  prefetchedRoutes.add(route)
  return loadRoute(route).catch(() => {})
}

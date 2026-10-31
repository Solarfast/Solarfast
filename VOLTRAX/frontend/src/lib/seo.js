const pages = {
  '/': {
    nl: {
      title: 'SolarFast | Zonnepanelen, batterijen en warmtepompen',
      description: 'Bekijk oplossingen voor opwek, opslag, verwarming en koeling. SolarFast helpt u een passende keuze te maken voor uw woning.',
    },
    en: {
      title: 'SolarFast | Solar panels, batteries and heat pumps',
      description: 'Explore energy generation, storage, heating and cooling. SolarFast helps you choose a suitable solution for your home.',
    },
  },
  '/aanbod': {
    nl: {
      title: 'Aanbod: energieoplossingen voor thuis | SolarFast',
      description: 'Ontdek zonnepanelen, thuisbatterijen, warmtepompen, airco en isolatie. Bekijk de productinformatie en bereken een indicatie.',
    },
    en: {
      title: 'Home energy solutions and products | SolarFast',
      description: 'Explore solar panels, home batteries, heat pumps, air conditioning and insulation, with product information and estimates.',
    },
  },
  '/hoe-werkt-het': {
    nl: {
      title: 'Zo werkt advies en installatie | SolarFast',
      description: 'Lees hoe SolarFast uw woning, energieverbruik en wensen meeneemt bij advies, levering en installatie van energieproducten.',
    },
    en: {
      title: 'How advice and installation work | SolarFast',
      description: 'Learn how SolarFast considers your home, energy use and goals when advising on energy products and installation.',
    },
  },
  '/over-ons': {
    nl: {
      title: 'Over SolarFast: energie voor uw woning',
      description: 'Maak kennis met SolarFast, groothandel en installateur van oplossingen voor opwek, opslag, verwarming en koeling.',
    },
    en: {
      title: 'About SolarFast: energy solutions for your home',
      description: 'Meet SolarFast, a wholesaler and installer of solutions for energy generation, storage, heating and cooling.',
    },
  },
  '/hyxipower': {
    nl: {
      title: 'HYXiPower thuisbatterij | SolarFast',
      description: 'Bekijk de HYXiPower All-in-One thuisbatterij en lees welke capaciteit en functies bij uw woning en aansluiting kunnen passen.',
    },
    en: {
      title: 'HYXiPower home battery | SolarFast',
      description: 'Explore the HYXiPower All-in-One home battery and review which capacity and features may fit your home and connection.',
    },
  },
  '/warmtefonds': {
    nl: {
      title: 'Informatie over het Nationaal Warmtefonds | SolarFast',
      description: 'Lees algemene informatie over financiering van verduurzaming en controleer actuele voorwaarden rechtstreeks bij het Warmtefonds.',
    },
    en: {
      title: 'Information about the Dutch Warmtefonds | SolarFast',
      description: 'Read general information about home energy financing and check current eligibility and terms with Warmtefonds directly.',
    },
  },
  '/waarom-solarfast': {
    nl: {
      title: 'Waarom SolarFast voor energie thuis?',
      description: 'Bekijk hoe SolarFast advies, producten en installatie afstemt op uw woning. De mogelijkheden verschillen per product en situatie.',
    },
    en: {
      title: 'Why choose SolarFast for home energy?',
      description: 'See how SolarFast matches advice, products and installation to your home. Available options depend on each project.',
    },
  },
  '/faq': {
    nl: {
      title: 'Veelgestelde vragen over energie thuis | SolarFast',
      description: 'Antwoorden op vragen over zonnepanelen, thuisbatterijen, warmtepompen, berekeningen, advies en installatie.',
    },
    en: {
      title: 'Home energy frequently asked questions | SolarFast',
      description: 'Answers to common questions about solar panels, home batteries, heat pumps, estimates, advice and installation.',
    },
  },
  '/calculator': {
    nl: {
      title: 'Energiecalculator voor uw woning | SolarFast',
      description: 'Bereken een indicatie voor uw energiesituatie op basis van uw eigen verbruik, tarieven, productgegevens en aannames.',
    },
    en: {
      title: 'Home energy calculator | SolarFast',
      description: 'Estimate your home energy situation using your own consumption, tariffs, product details and stated assumptions.',
    },
  },
  '/salderen-calculator': {
    nl: {
      title: 'Salderingscalculator 2027 | SolarFast',
      description: 'Bereken het geschatte verschil in variabele stroomkosten wanneer de salderingsregeling op 1 januari 2027 stopt.',
    },
    en: {
      title: 'Net-metering calculator 2027 | SolarFast',
      description: 'Estimate the change in variable electricity costs when the Dutch net-metering scheme ends on 1 January 2027.',
    },
  },
  '/results': {
    nl: {
      title: 'Uw energieadvies en berekening | SolarFast',
      description: 'Bekijk de indicatieve uitkomst van uw persoonlijke energiecalculator en de aannames waarop het rapport is gebaseerd.',
      noIndex: true,
    },
    en: {
      title: 'Your energy estimate and report | SolarFast',
      description: 'Review your personal calculator estimate and the assumptions used to prepare your report.',
      noIndex: true,
    },
  },
  '/video': {
    nl: {
      title: 'SolarFast: slimme energie voor thuis',
      description: 'Bekijk de SolarFast-film over energieoplossingen voor thuis.',
    },
    en: {
      title: 'SolarFast: smarter energy at home',
      description: 'Watch the SolarFast film about home energy solutions.',
    },
  },
  '/privacy': {
    nl: {
      title: 'Privacy | SolarFast',
      description: 'Lees hoe de SolarFast-website gegevens verwerkt voor berekeningen en productinformatie.',
    },
    en: {
      title: 'Privacy | SolarFast',
      description: 'Learn how the SolarFast website processes data for estimates and product information.',
    },
  },
}

export const seoRoutes = Object.keys(pages)

export function getPageMetadata(pathname, search = '', lang = 'nl') {
  const language = lang === 'en' ? 'en' : 'nl'
  const params = new URLSearchParams(search)
  const route = pathname === '/results' ? pages['/results'] : pages[pathname]
  if (!route) {
    return language === 'nl'
      ? { title: 'Pagina niet gevonden | SolarFast', description: 'Deze pagina bestaat niet of is verplaatst.', noIndex: true }
      : { title: 'Page not found | SolarFast', description: 'This page does not exist or has moved.', noIndex: true }
  }

  const metadata = { ...route[language] }
  if (pathname === '/calculator') {
    const product = params.get('product')
    const productMetadata = {
      solar: language === 'nl'
        ? { title: 'Zonnepanelen berekenen | SolarFast', description: 'Bereken een indicatie voor zonnepaneelopbrengst en besparing met uw eigen productie-, tarief- en investeringsgegevens.' }
        : { title: 'Estimate solar panel savings | SolarFast', description: 'Estimate solar panel savings using your own production, tariff and investment details.' },
      airco: language === 'nl'
        ? { title: 'Aircovermogen en besparing berekenen | SolarFast', description: 'Schat het benodigde aircovermogen op basis van verwarmde en gekoelde oppervlakte en uw isolatie.' }
        : { title: 'Estimate air conditioning capacity and savings | SolarFast', description: 'Estimate air conditioning capacity using heated and cooled area and your insulation details.' },
      insulation: language === 'nl'
        ? { title: 'Isolatiebesparing berekenen | SolarFast', description: 'Bereken een indicatie voor een isolatiemaatregel op basis van uw woning- en investeringsgegevens.' }
        : { title: 'Estimate insulation savings | SolarFast', description: 'Estimate an insulation measure using your home and investment details.' },
    }
    if (productMetadata[product]) Object.assign(metadata, productMetadata[product])
  }
  metadata.noIndex = Boolean(metadata.noIndex)
  return metadata
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

// Vaillant aroTHERM pro technical specifications:
// https://www.vaillant.nl/producten/arothermpro
// VAT-inclusive list prices, subsidy amounts, and final prices were supplied by the user.
const VAILLANT_SOURCE = 'https://www.vaillant.nl/producten/arothermpro'
const USER_PRICE_SOURCE = 'User-supplied VAT-inclusive list price, subsidy, and final price; installation scope not independently verified'

const vaillantModels = [
  {
    code: '55/7.1 A', kw: 5, volts: 230, scop35: 5.01, scop55: 3.7,
    allElectricCatalogPrice: 14227.79, allElectricSubsidy: 2350, allElectricPrice: 11877.79,
    hybridCatalogPrice: 9232.54, hybridSubsidy: 2350, hybridPrice: 6882.54,
  },
  {
    code: '75/7.1 A', kw: 7, volts: 230, scop35: 4.87, scop55: 3.62,
    allElectricCatalogPrice: 14603.49, allElectricSubsidy: 2800, allElectricPrice: 11803.49,
    hybridCatalogPrice: 9771.60, hybridSubsidy: 2800, hybridPrice: 6971.60,
  },
  {
    code: '115/7.1 A', kw: 11, volts: 400, scop35: 4.93, scop55: 3.66,
    allElectricCatalogPrice: 15975.63, allElectricSubsidy: 3700, allElectricPrice: 12275.63,
    hybridCatalogPrice: 11143.74, hybridSubsidy: 3700, hybridPrice: 7443.74,
  },
]

const vaillantProducts = vaillantModels.flatMap((spec) => {
  const {
    allElectricPrice, hybridPrice,
    allElectricCatalogPrice, allElectricSubsidy,
    hybridCatalogPrice, hybridSubsidy,
    ...technicalSpec
  } = spec
  return [
    {
      ...technicalSpec,
      minKw: spec.kw,
      maxKw: spec.kw,
      id: `vaillant-pro-${spec.kw}-all-electric`,
      brand: 'Vaillant',
      model: `aroTHERM pro VWL ${spec.code} ${spec.volts}V · R290 · ${spec.kw} kW · 200 L boiler`,
      config: 'all-electric',
      catalogPriceEur: allElectricCatalogPrice,
      subsidyEur: allElectricSubsidy,
      finalPriceEur: allElectricPrice,
      priceSource: USER_PRICE_SOURCE,
      source: VAILLANT_SOURCE,
      scopSource: 'Vaillant published product specifications',
    },
    {
      ...technicalSpec,
      minKw: spec.kw,
      maxKw: spec.kw,
      id: `vaillant-pro-${spec.kw}-hybrid`,
      brand: 'Vaillant',
      model: `aroTHERM pro VWL ${spec.code} ${spec.volts}V · R290 · ${spec.kw} kW · hybrid`,
      config: 'hybrid',
      catalogPriceEur: hybridCatalogPrice,
      subsidyEur: hybridSubsidy,
      finalPriceEur: hybridPrice,
      priceSource: USER_PRICE_SOURCE,
      source: VAILLANT_SOURCE,
      scopSource: 'Vaillant published product specifications',
    },
  ]
})

// WeHeat SCOP figures are preliminary illustrative assumptions for the existing
// ROI calculation only; they are not manufacturer-certified values.
const weheatConfigurations = [
  {
    model: 'Blackbird P60', kw: 6, minKw: 6, maxKw: 9,
    hybridCatalogPrice: 11050.63, hybridSubsidy: 2575, hybridPrice: 8475.63,
    allElectricCatalogPrice: 16580.03, allElectricSubsidy: 2575, allElectricPrice: 14005.03,
  },
  {
    model: 'Blackbird P80', kw: 8, minKw: 8, maxKw: 11,
    hybridCatalogPrice: 11630.52, hybridSubsidy: 3025, hybridPrice: 8605.52,
    allElectricCatalogPrice: 17233.43, allElectricSubsidy: 3025, allElectricPrice: 14208.43,
  },
  {
    model: 'Flint P40', kw: 4, minKw: 4, maxKw: 6,
    hybridCatalogPrice: 7922.48, hybridSubsidy: 2350, hybridPrice: 5572.48,
    allElectricCatalogPrice: 13068.00, allElectricSubsidy: 2350, allElectricPrice: 10718.00,
  },
  {
    model: 'Sparrow P60', kw: 6, minKw: 6, maxKw: 9,
    hybridCatalogPrice: 10617.75, hybridSubsidy: 2575, hybridPrice: 8042.75,
    allElectricCatalogPrice: 16147.15, allElectricSubsidy: 2575, allElectricPrice: 13572.15,
  },
]

const weheatProducts = weheatConfigurations.flatMap((spec) => [
  {
    id: `weheat-${spec.model.toLowerCase().replaceAll(' ', '-')}-hybrid`,
    brand: 'WeHeat',
    model: `${spec.model} · ${spec.minKw}–${spec.maxKw} kW · R290 · hybrid`,
    kw: spec.kw,
    minKw: spec.minKw,
    maxKw: spec.maxKw,
    config: 'hybrid',
    catalogPriceEur: spec.hybridCatalogPrice,
    subsidyEur: spec.hybridSubsidy,
    finalPriceEur: spec.hybridPrice,
    priceSource: USER_PRICE_SOURCE,
    scop35: 4.0,
    scop55: 3.0,
    scopEstimated: true,
    scopSource: 'Preliminary illustrative assumption; not manufacturer-certified',
  },
  {
    id: `weheat-${spec.model.toLowerCase().replaceAll(' ', '-')}-all-electric`,
    brand: 'WeHeat',
    model: `${spec.model} · ${spec.minKw}–${spec.maxKw} kW · R290 · 200 L boiler · all-electric`,
    kw: spec.kw,
    minKw: spec.minKw,
    maxKw: spec.maxKw,
    config: 'all-electric',
    catalogPriceEur: spec.allElectricCatalogPrice,
    subsidyEur: spec.allElectricSubsidy,
    finalPriceEur: spec.allElectricPrice,
    priceSource: USER_PRICE_SOURCE,
    scop35: 4.0,
    scop55: 3.0,
    scopEstimated: true,
    scopSource: 'Preliminary illustrative assumption; not manufacturer-certified',
  },
])

export const HEAT_PUMP_PRODUCTS = [...vaillantProducts, ...weheatProducts]

export const findHeatPump = (id) => HEAT_PUMP_PRODUCTS.find((product) => product.id === id)
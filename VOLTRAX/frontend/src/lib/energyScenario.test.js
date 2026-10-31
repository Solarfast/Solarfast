import assert from 'node:assert/strict'
import test from 'node:test'
import { buildEnergyScenario, calculateSolarCoverage, splitHeatPumpElectricity } from './energyScenario.js'

test('heat-pump demand increases total use without consuming all annual PV surplus', () => {
  const scenario = buildEnergyScenario({
    solarProduction: 6000,
    annualConsumption: 4000,
    gridExport: 3000,
    plannedHeatPumpKwh: 5000,
    plannedHeatPumpSpaceHeatingKwh: 4000,
    plannedHeatPumpHotWaterKwh: 1000,
    plannedEvKwh: 0,
    plannedSolarKwh: 0,
  })

  assert.equal(scenario.projectedConsumptionKwh, 9000)
  assert.equal(scenario.heatPumpSolarOverlapKwh, 750)
  assert.equal(scenario.heatPumpSeasonalGridImportKwh, 4250)
  assert.equal(scenario.projectedExportKwh, 2250)
  assert.ok(scenario.projectedExportKwh > 0)
})

test('heat-pump solar overlap is bounded by available generation surplus', () => {
  const scenario = buildEnergyScenario({
    solarProduction: 3000,
    annualConsumption: 2500,
    gridExport: 500,
    plannedHeatPumpKwh: 4000,
    plannedHeatPumpSpaceHeatingKwh: 3500,
    plannedHeatPumpHotWaterKwh: 500,
    plannedEvKwh: 0,
    plannedSolarKwh: 0,
  })

  assert.equal(scenario.heatPumpSolarOverlapKwh, 500)
  assert.equal(scenario.heatPumpSeasonalGridImportKwh, 3500)
  assert.equal(scenario.projectedExportKwh, 0)
})

test('self-sufficiency relevant total use grows by all heat-pump electricity', () => {
  const scenario = buildEnergyScenario({
    solarProduction: 3000,
    annualConsumption: 2500,
    gridExport: 500,
    plannedHeatPumpKwh: 4000,
    plannedHeatPumpSpaceHeatingKwh: 3500,
    plannedHeatPumpHotWaterKwh: 500,
    plannedEvKwh: 0,
    plannedSolarKwh: 0,
  })

  assert.ok(scenario.projectedConsumptionKwh > scenario.projectedSolarKwh)
})

test('heat-pump planning ignores projected export overrides and estimates seasonal export', () => {
  const scenario = buildEnergyScenario({
    solarProduction: 6000,
    annualConsumption: 4000,
    gridExport: 3000,
    plannedHeatPumpKwh: 5000,
    plannedHeatPumpSpaceHeatingKwh: 4000,
    plannedHeatPumpHotWaterKwh: 1000,
    plannedEvKwh: 0,
    plannedSolarKwh: 0,
    projectedGridExport: 5000,
  })

  assert.equal(scenario.projectedExportKwh, 2250)
  assert.equal(scenario.exportMethod, 'seasonal-load-estimate')
  assert.equal(scenario.forecastWasAdjusted, false)
})

test('non-heat-pump planned changes still honor an explicit export forecast', () => {
  const scenario = buildEnergyScenario({
    solarProduction: 6000,
    annualConsumption: 4000,
    gridExport: 3000,
    plannedHeatPumpKwh: 0,
    plannedEvKwh: 1000,
    plannedSolarKwh: 0,
    projectedGridExport: 1234,
  })

  assert.equal(scenario.projectedExportKwh, 1234)
  assert.equal(scenario.exportMethod, 'user-forecast')
  assert.equal(scenario.forecastWasAdjusted, false)
})

test('EV and airco annual consumption do not automatically erase solar export without a time profile', () => {
  const scenario = buildEnergyScenario({
    solarProduction: 6000,
    annualConsumption: 4000,
    gridExport: 3000,
    plannedHeatPumpKwh: 0,
    plannedAircoKwh: 700,
    plannedEvKwh: 2500,
  })

  assert.equal(scenario.projectedConsumptionKwh, 7200)
  assert.equal(scenario.projectedExportKwh, 3000)
  assert.equal(scenario.unprofiledLoadSolarOverlapKwh, 0)
  assert.equal(scenario.hasUnprofiledAdditionalLoads, true)
  assert.equal(scenario.exportMethod, 'unprofiled-load-conservative')
})

test('airco demand can be served by an available battery without an EV-style grid warning', () => {
  const scenario = buildEnergyScenario({
    solarProduction: 6000,
    annualConsumption: 4000,
    gridExport: 3000,
    plannedAircoKwh: 900,
    plannedEvKwh: 0,
    batteryCapacityKwh: 10.6,
  })

  assert.equal(scenario.projectedConsumptionKwh, 4900)
  assert.equal(scenario.aircoCanUseBattery, true)
  assert.equal(scenario.hasUnprofiledAdditionalLoads, false)
  assert.equal(scenario.hasUnprofiledEvLoad, false)
  // Annual export stays conservative; the battery API receives the higher
  // whole-home demand and recomputes the amount it can deliver to the home.
  assert.equal(scenario.projectedExportKwh, 3000)
})

test('unprofiled EV charging preserves the measured export even when added annual use is high', () => {
  const scenario = buildEnergyScenario({
    solarProduction: 6000,
    annualConsumption: 1000,
    gridExport: 5000,
    plannedEvKwh: 6000,
  })

  assert.equal(scenario.projectedExportKwh, 5000)
})

test('new solar-only customers get the entered generation and 70 percent export forecast', () => {
  const newSolarKwh = 4500
  const scenario = buildEnergyScenario({
    solarProduction: 0,
    annualConsumption: 4000,
    gridExport: 0,
    plannedSolarKwh: newSolarKwh,
    plannedHeatPumpKwh: 0,
    plannedEvKwh: 0,
    projectedGridExport: String(Math.round(newSolarKwh * 0.7)),
  })

  assert.equal(scenario.projectedSolarKwh, 4500)
  assert.equal(scenario.projectedExportKwh, 3150)
})

test('planned solar export estimate responds to daytime presence and never assigns more PV than exists', () => {
  const away = buildEnergyScenario({
    solarProduction: 0,
    annualConsumption: 4000,
    gridExport: 0,
    plannedSolarKwh: 4500,
    solarDaytimePresence: 'away',
  })
  const home = buildEnergyScenario({
    solarProduction: 0,
    annualConsumption: 4000,
    gridExport: 0,
    plannedSolarKwh: 4500,
    solarDaytimePresence: 'often',
  })

  assert.equal(away.plannedSolarDirectUseKwh, 1200)
  assert.equal(away.projectedExportKwh, 3300)
  assert.equal(home.plannedSolarDirectUseKwh, 2400)
  assert.equal(home.projectedExportKwh, 2100)
  assert.equal(away.projectedExportKwh + away.plannedSolarDirectUseKwh, 4500)
})

test('planned solar direct use and heat-pump overlap do not allocate the same surplus twice', () => {
  const scenario = buildEnergyScenario({
    solarProduction: 0,
    annualConsumption: 4000,
    gridExport: 0,
    plannedSolarKwh: 4500,
    plannedHeatPumpKwh: 2400,
    plannedHeatPumpSpaceHeatingKwh: 1800,
    plannedHeatPumpHotWaterKwh: 600,
    solarDaytimePresence: 'often',
  })

  assert.equal(scenario.plannedSolarDirectUseKwh, 2400)
  assert.equal(scenario.heatPumpSolarOverlapKwh, 390)
  assert.equal(scenario.projectedExportKwh, 1710)
  assert.ok(scenario.plannedSolarDirectUseKwh + scenario.heatPumpSolarOverlapKwh <= 4500)
})

test('all 16 solar, heat-pump, airco, and EV combinations preserve annual energy bounds', () => {
  for (let mask = 0; mask < 16; mask += 1) {
    const addSolar = Boolean(mask & 1)
    const addHeatPump = Boolean(mask & 2)
    const addAirco = Boolean(mask & 4)
    const addEv = Boolean(mask & 8)
    const scenario = buildEnergyScenario({
      solarProduction: 5000,
      annualConsumption: 4000,
      gridExport: 2000,
      plannedSolarKwh: addSolar ? 1200 : 0,
      plannedHeatPumpKwh: addHeatPump ? 2000 : 0,
      plannedHeatPumpSpaceHeatingKwh: addHeatPump ? 1600 : 0,
      plannedHeatPumpHotWaterKwh: addHeatPump ? 400 : 0,
      plannedAircoKwh: addAirco ? 600 : 0,
      plannedEvKwh: addEv ? 800 : 0,
    })

    assert.equal(scenario.projectedSolarKwh, 5000 + (addSolar ? 1200 : 0))
    assert.equal(
      scenario.projectedConsumptionKwh,
      4000 + (addHeatPump ? 2000 : 0) + (addAirco ? 600 : 0) + (addEv ? 800 : 0),
    )
    assert.equal(scenario.addedAircoKwh, addAirco ? 600 : 0)
    assert.equal(scenario.addedEvKwh, addEv ? 800 : 0)
    assert.ok(scenario.projectedExportKwh >= 0)
    assert.ok(scenario.projectedExportKwh <= scenario.projectedSolarKwh * 0.97)
    assert.ok(scenario.heatPumpSolarOverlapKwh <= 2000)
    assert.equal(scenario.heatPumpSeasonalGridImportKwh, (addHeatPump ? 2000 : 0) - scenario.heatPumpSolarOverlapKwh)
  }
})

test('heat-pump electricity is split between solar, both battery sources, and grid without overlap', () => {
  assert.deepEqual(splitHeatPumpElectricity({
    annualKwh: 2344,
    solarOverlapKwh: 234,
    solarBatterySupplyKwh: 300,
    cheapBatterySupplyKwh: 500,
  }), {
    totalKwh: 2344,
    solarKwh: 234,
    solarBatteryKwh: 300,
    cheapBatteryKwh: 500,
    batteryKwh: 800,
    gridKwh: 1310,
  })
})

test('heat-pump battery sources are capped at remaining heat-pump demand', () => {
  assert.deepEqual(splitHeatPumpElectricity({
    annualKwh: 2344,
    solarOverlapKwh: 234,
    solarBatterySupplyKwh: 2000,
    cheapBatterySupplyKwh: 3000,
  }), {
    totalKwh: 2344,
    solarKwh: 234,
    solarBatteryKwh: 2000,
    cheapBatteryKwh: 110,
    batteryKwh: 2110,
    gridKwh: 0,
  })
})

test('solar coverage excludes grid-charged battery power and never exceeds production', () => {
  const coverage = calculateSolarCoverage({
    annualSolarKwh: 3200,
    annualConsumptionKwh: 3800,
    directSolarKwh: 2600,
    solarBatteryKwh: 900,
  })
  assert.equal(coverage.solarUsedKwh, 3200)
  assert.equal(coverage.selfConsumptionPercent, 100)
  assert.equal(coverage.selfSufficiencyPercent, 3200 / 3800 * 100)

  const withoutGridChargedBattery = calculateSolarCoverage({
    annualSolarKwh: 3200,
    annualConsumptionKwh: 3800,
    directSolarKwh: 2600,
    solarBatteryKwh: 0,
  })
  assert.equal(withoutGridChargedBattery.solarUsedKwh, 2600)
  assert.equal(withoutGridChargedBattery.selfConsumptionPercent, 81.25)
})
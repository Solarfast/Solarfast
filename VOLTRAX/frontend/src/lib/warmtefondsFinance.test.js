import assert from 'node:assert/strict'
import test from 'node:test'
import { warmthfondsMonthlyPayment, WARMTEFONDS_RATES } from './warmtefondsFinance.js'

test('Warmtefonds 0% estimate is principal divided by term months', () => {
  assert.equal(warmthfondsMonthlyPayment(15000, 15, 0), 15000 / 180)
})

test('effective annual interest is converted to monthly payments like the Warmtefonds example', () => {
  const monthly = warmthfondsMonthlyPayment(29000, 20, 0.0502)
  assert.ok(Math.abs(monthly - 189.95) < 0.05)
  assert.equal(WARMTEFONDS_RATES[7], 0.0457)
  assert.equal(WARMTEFONDS_RATES[10], 0.046)
  assert.equal(WARMTEFONDS_RATES[15], 0.0493)
})

test('a €11,862.48 loan over 15 years at 4.93% is about €92.71 per month', () => {
  const monthly = warmthfondsMonthlyPayment(11862.48, 15, WARMTEFONDS_RATES[15])
  assert.ok(Math.abs(monthly - 92.71) < 0.01)
})

test('invalid amount or term does not produce a payment', () => {
  assert.equal(warmthfondsMonthlyPayment(0, 10, 0.046), null)
  assert.equal(warmthfondsMonthlyPayment(10000, 0, 0.046), null)
})

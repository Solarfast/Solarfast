import test from 'node:test'
import assert from 'node:assert/strict'
import { getCalculationErrorMessage } from './calculationError.js'

const copy = {
  licenseError: 'license',
  inputError: 'input',
  serverError: 'server',
  connectionError: 'connection',
  error: 'generic',
}

test('calculation errors explain license, input, server and connection failures', () => {
  assert.equal(getCalculationErrorMessage({ response: { status: 403 } }, copy), 'license')
  assert.equal(getCalculationErrorMessage({ response: { status: 422 } }, copy), 'input')
  assert.equal(getCalculationErrorMessage({ response: { status: 500 } }, copy), 'server')
  assert.equal(getCalculationErrorMessage({ isAxiosError: true }, copy), 'connection')
  assert.equal(getCalculationErrorMessage(new Error('invalid heat pump inputs'), copy), 'invalid heat pump inputs')
})

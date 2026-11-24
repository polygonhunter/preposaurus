import type { TestInfo } from '@playwright/test'

/**
 * Nummer des Versuchs: Jede Wiederholung (--repeat-each) und jeder Retry zählt eigen. Für eigene
 * Daten je Versuch, damit ein Retry nicht vom ersten Versuch abhängt (#272).
 */
export const attemptOf = (testInfo: TestInfo) =>
  testInfo.repeatEachIndex * (testInfo.project.retries + 1) + testInfo.retry

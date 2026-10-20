/**
 * Your adapters: one per ported screen, returning the ODIN spec built from YOUR data.
 * Example (V04 Outcome Distribution):
 *   V04: async () => buildOutcomeDistribution(await api.getOutcomeTotals()),
 */
export const adapters: Record<string, () => unknown | Promise<unknown>> = {};

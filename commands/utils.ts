export const formatRecs = (recs: string[]): string => recs.map(((rec, index) => `${index}: <${rec}>`)).join('\n')

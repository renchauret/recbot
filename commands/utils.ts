export const formatRecs = (recs: string[]) => recs.map(((rec, index) => `${index}: <${rec}>`)).join('\n')

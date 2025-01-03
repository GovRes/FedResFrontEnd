export function normalizeResponse(string: string) {
    let parsed = JSON.parse(string)
    console.log("normalizer", parsed)
    if (parsed.properties) {
        return JSON.stringify(parsed.properties) ;
    }
    return JSON.stringify(parsed);
}
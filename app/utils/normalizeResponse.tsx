export function normalizeResponse(string: string) {
    let parsed = JSON.parse(string)
    if (parsed.properties) {
        return JSON.stringify(parsed.properties) ;
    }
    return JSON.stringify(parsed);
}
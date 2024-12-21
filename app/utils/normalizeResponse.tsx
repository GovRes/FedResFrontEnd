export function normalizeResponse(string: string) {
    let parsed = JSON.parse(string)
    if (parsed.properties) {
        return parsed.properties ;
    }
    return parsed;
}
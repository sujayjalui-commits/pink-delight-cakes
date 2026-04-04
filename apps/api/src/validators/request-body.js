export async function readJsonBody(request) {
  try {
    const rawText = await request.text();
    const normalizedText = rawText.replace(/^\uFEFF/, "").trim();

    if (!normalizedText) {
      return null;
    }

    return JSON.parse(normalizedText);
  } catch {
    return null;
  }
}

export function chunkText(text: string, maxTokens = 7000, overlap = 300): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let i = 0;
  
    while (i < words.length) {
      const chunk = words.slice(i, i + maxTokens).join(' ');
      chunks.push(chunk);
      i += maxTokens - overlap;
    }
  
    return chunks;
  }
  
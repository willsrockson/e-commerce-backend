
export function generateSlug(title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace special chars with dashes
    .replace(/^-+|-+$/g, '');    // Trim dashes from start/end

  // Generate a random 6-char string to ensure uniqueness
  const uniqueSuffix = Math.random().toString(36).substring(2, 8); 

  return `${cleanTitle}-${uniqueSuffix}`;
}
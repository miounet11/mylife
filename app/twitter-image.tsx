// Twitter card uses same image as opengraph.
// Next.js route segment config must be statically analyzable in this file.
export const runtime = 'edge';
export { default, alt, size, contentType } from './opengraph-image';

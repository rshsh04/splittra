import { NextResponse } from 'next/server';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://splittra.app';

export async function GET() {
  // Static routes to include in sitemap
  const staticPaths = [
    '',
    'join',
    'privacy',
    'return',
    'support',
    'terms',
  ];

  const pages = staticPaths.map((path) => {
    const url = `${siteUrl}/${path}`.replace(/\/+$/g, '') || siteUrl + '/';
    return `  <url>\n    <loc>${url}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.join('\n')}\n</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

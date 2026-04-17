import type { VercelRequest, VercelResponse } from '@vercel/node';

// Main API router - delegates to api/ directory
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);
  
  // Redirect to API docs
  if (pathname === '/' || pathname === '') {
    return res.json({
      name: 'Agentia API',
      version: '1.0.0',
      message: 'Welcome to Agentia API',
      docs: '/api/openapi',
      endpoints: [
        'GET /api/stats',
        'GET /api/health',
        'POST /api/join',
        'GET /api/openapi'
      ]
    });
  }
  
  return res.status(404).json({ error: 'Not found' });
}

/**
 * Simple test endpoint for Cloudflare Functions
 */
export const onRequestGet = async () => {
  return new Response(JSON.stringify({
    message: 'Cloudflare Functions working!',
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
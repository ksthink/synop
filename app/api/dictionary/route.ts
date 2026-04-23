import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) return Response.json({ error: 'query required' }, { status: 400 })

  const apiKey = process.env.URIMALSAEM_API_KEY
  if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 })

  try {
    const url = new URL('https://stdict.korean.go.kr/api/search.do')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('q', q)
    url.searchParams.set('req_type', 'json')
    url.searchParams.set('start', '1')
    url.searchParams.set('num', '10')

    const res = await fetch(url.toString(), { next: { revalidate: 60 } })
    if (!res.ok) return Response.json({ error: 'API error' }, { status: res.status })
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ error: 'fetch failed' }, { status: 500 })
  }
}

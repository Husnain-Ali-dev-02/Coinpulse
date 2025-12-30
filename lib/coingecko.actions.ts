'use server';

import qs from 'query-string';

const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

export async function fetcher<T>(
  endpoint: string,
  params?: QueryParams,
  revalidate = 60,
): Promise<T> {
  type CGErrorResponse = {
    error_code?: number;
    error?: string;
    status?: { error_message?: string };
  };
  const base = BASE_URL || process.env.NEXT_PUBLIC_COINGECKO_BASE_URL;
  if (!base) {
    throw new Error('Missing COINGECKO base URL. Set COINGECKO_BASE_URL or NEXT_PUBLIC_COINGECKO_BASE_URL.');
  }

  const cleanBase = String(base).replace(/\/+$/, '');
  const cleanEndpoint = String(endpoint).replace(/^\/+/, '');

  const url = qs.stringifyUrl(
    {
      url: `${cleanBase}/${cleanEndpoint}`,
      query: params,
    },
    { skipEmptyString: true, skipNull: true },
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) headers['x-cg-pro-api-key'] = API_KEY;

  const response = await fetch(url, {
    headers,
    next: { revalidate },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => null);
    let errorBody: CoinGeckoErrorBody | null = null;
    try {
      errorBody = text ? JSON.parse(text) : null;
    } catch (e) {
      // ignore
    }

    const logPayload = { url, status: response.status, body: text };
    console.warn('CoinGecko API request failed:', JSON.stringify(logPayload));

    const message = (errorBody as CGErrorResponse)?.error ?? text ?? response.statusText;

    // If CoinGecko complains about Demo API key (error_code 10011), retry using the public API base
    const isDemoKeyError =
      ((errorBody as CGErrorResponse)?.error_code === 10011) ||
      String(message).toLowerCase().includes('demo api key');

    if (isDemoKeyError) {
      try {
        const publicBase = 'https://api.coingecko.com/api/v3';

        // Some endpoints (like /ohlc) do not accept 'interval' or 'precision' parameters on the public API.
        // Create a filtered params object for the retry.
        const publicParams: QueryParams | undefined = params ? { ...params } : undefined;
        if (publicParams) {
          const publicParamsRecord = publicParams as Record<string, unknown>;
          delete publicParamsRecord.interval;
          delete publicParamsRecord.precision;
        }

        const cleanPublicBase = publicBase.replace(/\/+$/, '');
        const publicUrl = qs.stringifyUrl(
          { url: `${cleanPublicBase}/${cleanEndpoint}`, query: publicParams },
          { skipEmptyString: true, skipNull: true },
        );

        console.info('Retrying CoinGecko request against public API', publicUrl);
        const publicResp = await fetch(publicUrl, { headers: { 'Content-Type': 'application/json' }, next: { revalidate } });

        if (publicResp.ok) {
          return publicResp.json();
        }

        const publicText = await publicResp.text().catch(() => null);
        console.error('Public CoinGecko retry failed:', JSON.stringify({ publicUrl, status: publicResp.status, body: publicText }));
      } catch (e) {
        console.error('Error while retrying public CoinGecko API', String(e));
      }
    }

    // Do not throw here to avoid crashing pages that call this helper from
    // server components. Return `null` as a safe fallback and log the issue.
    console.warn(`CoinGecko API error ${response.status}: ${message} (url: ${url})`);
    return null as unknown as T;
  }

  return response.json();
}

export async function getPools(
  id: string,
  network?: string | null,
  contractAddress?: string | null,
): Promise<PoolData> {
  const fallback: PoolData = {
    id: '',
    address: '',
    name: '',
    network: '',
  };

  if (network && contractAddress) {
    try {
      const poolData = await fetcher<{ data: PoolData[] }>(
        `/onchain/networks/${network}/tokens/${contractAddress}/pools`,
      );

      return poolData.data?.[0] ?? fallback;
    } catch (error) {
      console.log(error);
      return fallback;
    }
  }

  try {
    const poolData = await fetcher<{ data: PoolData[] }>('/onchain/search/pools', { query: id });

    return poolData.data?.[0] ?? fallback;
  } catch {
    return fallback;
  }
}
/**
 * Executes a webhook POST request, typically to n8n.
 *
 * @param webhookUrl The full URL to the webhook endpoint.
 * @param payload The data to post as JSON.
 * @returns A promise that resolves if the request was successful.
 */
export const executeWebhook = async (webhookPath: string, payload: unknown): Promise<void> => {
  try {
    // Falls VITE_N8N_BASE_URL nicht gesetzt ist, nutzt fetch() den relativen Pfad über den Vite-Proxy
    const baseUrl = import.meta.env.VITE_N8N_BASE_URL || ''
    const fullUrl = `${baseUrl}${webhookPath}`
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(
        `Webhook request failed with status ${response.status}: ${response.statusText}`
      )
    }

    // Webhook was successfully triggered
  } catch (error) {
    console.error('Error executing webhook:', error)
    // Rethrow to allow the UI to handle and display it
    throw error
  }
}

/**
 * Fetches data from a given webhook or API endpoint via GET request.
 *
 * @param url The full URL to the endpoint.
 * @returns A promise that resolves to the fetched JSON data.
 */
export const fetchGet = async <T = unknown>(path: string): Promise<T> => {
  try {
    const baseUrl = import.meta.env.VITE_N8N_BASE_URL || ''
    const fullUrl = `${baseUrl}${path}`
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Fetch request failed with status ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching data:', error)
    throw error
  }
}

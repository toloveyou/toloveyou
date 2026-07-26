import type {
  ResponsePayload,
  ResponseResult
} from '$lib/types/invitation';

const DISCORD_MESSAGE_ID_PATTERN = /^\d{15,22}$/;

export async function sendResponse(
  endpoint: string,
  payload: ResponsePayload
): Promise<ResponseResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const result = (await response.json().catch(() => null)) as
      | { ok?: unknown; messageId?: unknown; error?: unknown }
      | null;

    if (!response.ok || result?.ok !== true) {
      throw new Error(
        typeof result?.error === 'string'
          ? result.error
          : 'The answer could not be sent.'
      );
    }

    if (
      typeof result.messageId !== 'string' ||
      !DISCORD_MESSAGE_ID_PATTERN.test(result.messageId)
    ) {
      throw new Error('The response channel did not confirm delivery.');
    }

    return { ok: true, messageId: result.messageId };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The reply took too long. Check your connection and try again.');
    }

    if (error instanceof TypeError) {
      throw new Error('The answer could not be sent. Check your connection and try again.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

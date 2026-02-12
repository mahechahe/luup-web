import { toast } from 'sonner';

const MESSAGE_ERROR_SERVIDOR = 'Ha ocurrido un error interno del servidor';

/**
 * Dispatches a message to be shown based on the response body.
 *
 * @param {Object} body - The response body from the server.
 * @param {Object} body.data - The data from the response.
 * @param {boolean} [body.data.hideMessage=false] - Whether the message should be hidden.
 * @param {string} [body.data.message] - The message to display.
 * @param {Object} [body.data.data] - Additional data from the response.
 * @param {Array} [body.data.data.message] - Array of messages from ZOD validation.
 * @param {number} body.status - The HTTP status code of the response.
 * @returns {Function} A thunk that dispatches the showMessage action.
 */
export const paramShowMessageApi = async (body) => {
  if (!body) {
    toast.error(MESSAGE_ERROR_SERVIDOR);
    return;
  }

  /* Si es true, es por que no se muestra el mensaje */
  const isHiddenMessage = body?.data?.hideMessage ?? false;
  if (isHiddenMessage) return;

  if (body.status === 400) {
    /* Error 400 de ZOD */
    const dataMessageZod = body?.data?.data?.message ?? [];

    const getMessage =
      dataMessageZod?.length > 0
        ? dataMessageZod[0]?.message
        : MESSAGE_ERROR_SERVIDOR;

    toast.error(getMessage);
    return;
  }

  const actuallyMessage = body?.data?.message ?? MESSAGE_ERROR_SERVIDOR;

  if (body.status === 200) {
    toast.success(actuallyMessage);
  } else {
    toast.error(actuallyMessage);
  }
};

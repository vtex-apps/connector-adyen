/* eslint-disable @typescript-eslint/consistent-type-imports */

import { json } from 'co-body'
import {
  ApprovedAuthorization,
  AuthorizationRequest,
  FailedAuthorization,
} from '@vtex/payment-provider'

const APP_ID = process.env.VTEX_APP_ID as string

const handleAdyenWebhook = async (ctx: Context) => {
  const {
    clients: { vbase, apps, provider },
    vtex: { logger },
    headers,
    req,
  } = ctx

  const settings = await apps.getAppSettings(APP_ID)

  const { webhookUsername, webhookPassword, vtexAppKey, vtexAppToken } =
    settings

  const b64auth = (headers.authorization ?? '').split(' ')[1] || ''
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

  if (login !== webhookUsername || password !== webhookPassword) {
    ctx.status = 401

    logger.error({
      message: 'Webhook-missingCredentials',
    })

    return
  }

  const eventData: AdyenHookNotification = await json(req)

  const {
    notificationItems: [
      {
        NotificationRequestItem: {
          merchantReference,
          eventCode,
          pspReference,
          success,
          reason,
        },
      },
    ],
  } = eventData

  // eslint-disable-next-line no-console
  console.log('webhook ==>', {
    merchantReference,
    eventCode,
    pspReference,
    success,
    reason,
  })
  logger.info({
    message: 'Webhook-received',
    data: { merchantReference, eventCode, pspReference, success, reason },
  })

  let authRequest: AuthorizationRequest | null = null
  const [paymentId] = merchantReference.split('-')

  try {
    authRequest = await vbase.getJSON<AuthorizationRequest | null>(
      'adyenRequest',
      paymentId,
      true
    )

    // eslint-disable-next-line no-console
    console.log('webhook savedAuthRequest ==>', authRequest)
  } catch (error) {
    logger.error({
      message: 'Webhook-transactionFetchError',
      error,
      data: { merchantReference },
    })
  }

  if (!authRequest) {
    logger.error({
      message: 'Webhook-originalAuthorizationNotFound',
      data: { paymentId: merchantReference, pspReference, eventCode, success },
    })

    ctx.body = '[accepted]'

    return
  }

  if (eventCode === 'AUTHORISATION') {
    try {
      await vbase.saveJSON<AdyenHookNotification>(
        'adyenAuth',
        merchantReference,
        eventData
      )
    } catch (error) {
      logger.error({
        message: 'Webhook-transactionSaveError',
        error,
        data: { merchantReference, pspReference },
      })
    }

    const authResponse = {
      ...authRequest,
      authorizationId: pspReference,
      tid: pspReference,
      nsu: pspReference,
      status: success === 'true' ? 'approved' : 'denied',
      message: reason ?? null,
      code: null,
      acquirer: null,
    } as ApprovedAuthorization | FailedAuthorization

    try {
      provider.callback(
        authRequest.callbackUrl,
        { vtexAppKey, vtexAppToken },
        authResponse
      )
    } catch (error) {
      logger.error({
        message: 'Webhook-providerInboundError',
        error,
        data: authResponse,
      })
    }
  }

  let vbaseSavePromise: Promise<unknown> | null = null

  if (eventCode === 'CAPTURE') {
    vbaseSavePromise = vbase.saveJSON<TransactionEvent>(
      'adyenCapture',
      merchantReference,
      { notification: eventData }
    )
  }

  if (eventCode === 'REFUND') {
    vbaseSavePromise = vbase.saveJSON<TransactionEvent>(
      'adyenRefund',
      merchantReference,
      { notification: eventData }
    )
  }

  if (eventCode === 'CANCELLATION') {
    vbaseSavePromise = vbase.saveJSON<AdyenHookNotification>(
      'adyenCancellation',
      merchantReference,
      eventData
    )
  }

  try {
    await vbaseSavePromise
  } catch (error) {
    logger.error({
      message: 'Webhook-transactionSaveError',
      error,
      data: { merchantReference, pspReference, eventCode, success },
    })
  }

  ctx.body = '[accepted]'
}

const routes = {
  adyenWebhook: [handleAdyenWebhook],
}

export default routes

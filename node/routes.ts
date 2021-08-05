/* eslint-disable @typescript-eslint/consistent-type-imports */

import { json } from 'co-body'
import {
  ApprovedAuthorization,
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

  const {
    webhookUsername,
    webhookPassword,
    vtexAppKey,
    vtexAppToken,
  } = settings

  const b64auth = (headers.authorization ?? '').split(' ')[1] || ''
  const [login, password] = Buffer.from(b64auth, 'base64')
    .toString()
    .split(':')

  if (login !== webhookUsername || password !== webhookPassword) {
    ctx.status = 401

    logger.error({
      message: 'Webhook-missingCredentials',
    })

    return
  }

  const eventData: AdyenHookNotification = await json(req)

  const {
    // live,
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

  logger.info({
    message: 'Webhook-received',
    data: { merchantReference, eventCode, pspReference, success },
  })

  let transaction: StoredTransaction | null = null

  try {
    transaction = await vbase.getJSON<StoredTransaction | null>(
      'adyen',
      merchantReference,
      true
    )
  } catch (error) {
    logger.error({
      message: 'Webhook-transactionFetchError',
      error,
      data: { merchantReference },
    })
  }

  if (!transaction) {
    logger.warn({
      message: 'Webhook-transactionNotFound',
      data: { paymentId: merchantReference, pspReference, eventCode, success },
    })

    ctx.body = '[accepted]'

    return
  }

  if (eventCode === 'AUTHORISATION') {
    transaction.authorization = eventData

    try {
      await vbase.saveJSON<StoredTransaction>(
        'adyen',
        merchantReference,
        transaction
      )
    } catch (error) {
      logger.error({
        message: 'Webhook-transactionSaveError',
        error,
        data: { merchantReference, pspReference },
      })
    }

    const { authorizationRequest } = transaction

    const authResponse = {
      ...authorizationRequest,
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
        authorizationRequest.callbackUrl,
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
    transaction.capture = eventData
    vbaseSavePromise = vbase.saveJSON<StoredTransaction>(
      'adyen',
      merchantReference,
      transaction
    )
  }

  if (eventCode === 'REFUND') {
    transaction.refund = eventData

    vbaseSavePromise = vbase.saveJSON<StoredTransaction>(
      'adyen',
      merchantReference,
      transaction
    )
  }

  if (eventCode === 'CANCELLATION') {
    transaction.cancellation = eventData

    vbaseSavePromise = vbase.saveJSON<StoredTransaction>(
      'adyen',
      merchantReference,
      transaction
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

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/consistent-type-imports */

import {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  Cancellations,
  PaymentProvider,
  RefundRequest,
  RefundResponse,
  Refunds,
  SettlementRequest,
  SettlementResponse,
  Settlements,
  isCardAuthorization,
  Authorizations,
  CardAuthorization,
  PendingAuthorization,
  RedirectResponse,
} from '@vtex/payment-provider'

import { Clients } from './clients'
import { adyenService } from './services/adyen'

const APP_ID = process.env.VTEX_APP_ID as string

export default class Adyen extends PaymentProvider<Clients> {
  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    const {
      clients: { adyenSecure: adyen, vbase, apps },
      vtex: { logger },
    } = this.context

    const settings: AppSettings = await apps.getAppSettings(APP_ID)
    const existingAuthorization =
      await vbase.getJSON<AdyenHookNotification | null>(
        'adyenAuth',
        authorization.paymentId,
        true
      )

    logger.info({
      message: 'connectorAdyen-paymentRequest',
      data: { authorization, existingAuthorization },
    })

    if (existingAuthorization) {
      const [
        {
          NotificationRequestItem: { pspReference, reason, success },
        },
      ] = existingAuthorization.notificationItems

      if (success === 'true') {
        return Authorizations.approveCard(authorization as CardAuthorization, {
          tid: pspReference,
          authorizationId: pspReference,
        })
      }

      if (success === 'false') {
        return Authorizations.deny(authorization, {
          message: reason,
        })
      }
    }

    if (!isCardAuthorization(authorization)) {
      return Authorizations.deny(authorization, {
        message: 'Payment method not supported',
      })
    }

    await vbase.saveJSON<AuthorizationRequest | null>(
      'adyenRequest',
      authorization.paymentId,
      authorization
    )

    const adyenPaymentRequest = await adyenService.buildPaymentRequest({
      ctx: this.context,
      authorization,
      settings,
    })

    let adyenResponse = null

    try {
      adyenResponse = await adyen.payment(adyenPaymentRequest)
    } catch (error) {
      logger.error({
        error,
        message: 'connectorAdyen-adyenPaymentRequestError',
        data: adyenPaymentRequest.data,
      })
    }

    if (!adyenResponse) {
      return Authorizations.deny(authorization as CardAuthorization, {
        message: 'No Adyen Payment response',
      })
    }

    const { resultCode, pspReference, refusalReason } = adyenResponse

    if (adyenResponse.action?.url) {
      return {
        paymentId: authorization.paymentId,
        status: 'undefined',
        redirectUrl: adyenResponse.action.url,
      } as RedirectResponse
    }

    if (['Error', 'Refused', 'Cancelled'].includes(resultCode)) {
      return Authorizations.deny(authorization as CardAuthorization, {
        tid: pspReference,
        message: refusalReason,
      })
    }

    return {
      paymentId: authorization.paymentId,
      status: 'undefined',
      tid: pspReference,
    } as PendingAuthorization
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    const {
      clients: { adyen, vbase, apps },
      vtex: { logger },
    } = this.context

    const existingCancellation = await vbase.getJSON<TransactionEvent | null>(
      'adyenCancellation',
      cancellation.paymentId,
      true
    )

    logger.info({
      message: 'connectorAdyen-cancelRequest',
      data: { cancellation, existingCancellation },
    })

    if (existingCancellation) {
      if (existingCancellation.notification) {
        const [
          {
            NotificationRequestItem: {
              pspReference,
              eventCode,
              reason,
              success,
            },
          },
        ] = existingCancellation.notification.notificationItems

        if (success === 'true') {
          return Cancellations.approve(cancellation, {
            cancellationId: pspReference,
          })
        }

        return Cancellations.deny(cancellation, {
          code: eventCode,
          message: reason,
        })
      }

      return {
        ...cancellation,
        cancellationId: null,
        code: null,
        message: null,
      }
    }

    vbase.saveJSON<TransactionEvent>(
      'adyenCancellation',
      cancellation.paymentId,
      {
        notification: null,
      }
    )

    if (!cancellation.authorizationId) {
      logger.error({
        message: 'connectorAdyen-authorizationIdMissing',
        data: { cancellation },
      })

      throw new Error('Transaction not found')
    }

    const settings: AppSettings = await apps.getAppSettings(APP_ID)

    try {
      await adyen.cancel(
        cancellation.authorizationId,
        {
          merchantAccount: settings.merchantAccount,
          reference: cancellation.paymentId,
        },
        settings
      )
    } catch (error) {
      logger.error({
        error,
        message: 'connectorAdyen-adyenCancelRequestError',
        data: {
          pspReference: cancellation.authorizationId,
          request: {
            merchantAccount: settings.merchantAccount,
            reference: cancellation.paymentId,
          },
        },
      })
    }

    return {
      ...cancellation,
      cancellationId: null,
      code: null,
      message: null,
    }
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    const {
      clients: { adyen, vbase },
      vtex: { logger },
    } = this.context

    const existingRefund = await vbase.getJSON<TransactionEvent | null>(
      'adyenRefund',
      `${refund.paymentId}-${refund.value}`,
      true
    )

    logger.info({
      message: 'connectorAdyen-refundRequest',
      data: { refund, existingRefund },
    })

    if (existingRefund) {
      if (existingRefund.notification) {
        const [
          {
            NotificationRequestItem: {
              pspReference,
              eventCode,
              reason,
              success,
            },
          },
        ] = existingRefund.notification.notificationItems

        if (success === 'true') {
          return Refunds.approve(refund, {
            refundId: pspReference,
          })
        }

        return Refunds.deny(refund, {
          cancellationId: pspReference,
          code: eventCode,
          message: reason,
        })
      }

      return {
        ...refund,
        refundId: null,
        code: null,
        message: null,
      }
    }

    vbase.saveJSON<TransactionEvent>(
      'adyenRefund',
      `${refund.paymentId}-${refund.value}`,
      { notification: null }
    )

    const adyenAuth = await vbase.getJSON<AdyenHookNotification | null>(
      'adyenAuth',
      refund.paymentId,
      true
    )

    if (!adyenAuth) {
      logger.error({
        message: 'connectorAdyen-refundError-AdyenAuthNotFound',
        data: { refund },
      })

      throw new Error('Missing transaction data')
    }

    const refundRequest = await adyenService.buildRefundRequest({
      ctx: this.context,
      refund,
      authorization: adyenAuth,
    })

    try {
      await adyen.refund(refundRequest)
    } catch (error) {
      logger.error({
        error,
        message: 'connectorAdyen-adyenRefundRequestError',
        data: {
          pspReference: refundRequest.pspReference,
          request: refundRequest.data,
        },
      })
    }

    return {
      ...refund,
      refundId: null,
      code: null,
      message: null,
    }
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    const {
      clients: { adyen, vbase },
      vtex: { logger },
    } = this.context

    const existingSettlement = await vbase.getJSON<TransactionEvent | null>(
      'adyenCapture',
      `${settlement.paymentId}-${settlement.value}`,
      true
    )

    logger.info({
      message: 'connectorAdyen-settleRequest',
      data: { settlement, existingSettlement },
    })

    if (existingSettlement) {
      if (existingSettlement.notification) {
        const [
          {
            NotificationRequestItem: {
              pspReference,
              eventCode,
              reason,
              success,
            },
          },
        ] = existingSettlement.notification.notificationItems

        if (success === 'true') {
          return Settlements.approve(settlement, {
            settleId: pspReference,
          })
        }

        return Settlements.deny(settlement, {
          code: eventCode,
          message: reason,
        })
      }

      return {
        ...settlement,
        code: null,
        message: null,
        settleId: null,
      }
    }

    vbase.saveJSON<TransactionEvent>(
      'adyenCapture',
      `${settlement.paymentId}-${settlement.value}`,
      { notification: null }
    )

    const adyenAuth = await vbase.getJSON<AdyenHookNotification | null>(
      'adyenAuth',
      settlement.paymentId,
      true
    )

    if (!adyenAuth) {
      logger.error({
        message: 'connectorAdyen-settleError-adyenAuthNotFound',
        data: { settlement, adyenAuth },
      })

      throw new Error('Missing transaction data')
    }

    const adyenCaptureRequest = await adyenService.buildCaptureRequest({
      ctx: this.context,
      settlement,
      authorization: adyenAuth,
    })

    try {
      await adyen.capture(adyenCaptureRequest)
    } catch (error) {
      logger.error({
        error,
        message: 'connectorAdyen-adyenSettleRequestError',
        data: {
          pspReference: adyenCaptureRequest.pspReference,
          request: adyenCaptureRequest.data,
        },
      })
    }

    return {
      ...settlement,
      code: null,
      message: null,
      settleId: null,
    }
  }

  public inbound: undefined
}

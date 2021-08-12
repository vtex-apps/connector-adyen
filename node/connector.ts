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

    console.log('authorization ==>', authorization)
    const settings: AppSettings = await apps.getAppSettings(APP_ID)
    const existingAuthorization = await vbase.getJSON<AdyenHookNotification | null>(
      'adyenAuth',
      authorization.paymentId,
      true
    )

    logger.info({
      message: 'connectorAdyen-paymentRequest',
      data: { authorization, existingAuthorization },
    })

    console.log('existingAuthorization ==>', existingAuthorization)

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

    const adyenResponse = await adyen.payment(adyenPaymentRequest)

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

    console.log('cancellation ==>', cancellation)
    const existingCancellation = await vbase.getJSON<AdyenHookNotification | null>(
      'adyenCancellation',
      cancellation.paymentId,
      true
    )

    console.log('existingCancellation ==>', existingCancellation)
    logger.info({
      message: 'connectorAdyen-cancelRequest',
      data: { cancellation, existingCancellation },
    })

    if (existingCancellation) {
      const [
        {
          NotificationRequestItem: { pspReference, eventCode, reason, success },
        },
      ] = existingCancellation.notificationItems

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

    if (!cancellation.authorizationId) {
      logger.error({
        message: 'connectorAdyen-authorizationIdMissing',
        data: { cancellation },
      })

      throw new Error('Transaction not found')
    }

    const settings: AppSettings = await apps.getAppSettings(APP_ID)

    await adyen.cancel(
      cancellation.authorizationId,
      {
        merchantAccount: settings.merchantAccount,
        reference: cancellation.paymentId,
      },
      settings
    )

    return {
      ...cancellation,
      cancellationId: null,
      code: null,
      message: null,
    }
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    const {
      clients: { adyen, vbase, apps },
      vtex: { logger },
    } = this.context

    console.log('refund ==>', refund)
    const existingRefund = await vbase.getJSON<AdyenHookNotification | null>(
      'adyenRefund',
      `${refund.paymentId}-${refund.value}`,
      true
    )

    console.log('existingRefund ==>', existingRefund)

    logger.info({
      message: 'connectorAdyen-refundRequest',
      data: { refund, existingRefund },
    })

    if (existingRefund) {
      const [
        {
          NotificationRequestItem: { pspReference, eventCode, reason, success },
        },
      ] = existingRefund.notificationItems

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

    const adyenAuth = await vbase.getJSON<AdyenHookNotification | null>(
      'adyenAuth',
      refund.paymentId,
      true
    )

    if (!adyenAuth) {
      logger.error({
        message: 'connectorAdyen-adyenAuthNotFound',
        data: { refund, adyenAuth },
      })

      throw new Error('Missing transaction data')
    }

    const settings: AppSettings = await apps.getAppSettings(APP_ID)
    const refundRequest = await adyenService.buildRefundRequest({
      ctx: this.context,
      refund,
      authorization: adyenAuth,
      settings,
    })

    await adyen.refund(refundRequest)

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
      clients: { adyen, vbase, apps },
      vtex: { logger },
    } = this.context

    console.log('settlement ==>', settlement)

    const existingSettlement = await vbase.getJSON<AdyenHookNotification | null>(
      'adyenCapture',
      `${settlement.paymentId}-${settlement.value}`,
      true
    )

    console.log('existingSettlement ==>', existingSettlement)

    logger.info({
      message: 'connectorAdyen-settleRequest',
      data: { settlement, existingSettlement },
    })

    if (existingSettlement) {
      const [
        {
          NotificationRequestItem: { pspReference, eventCode, reason, success },
        },
      ] = existingSettlement.notificationItems

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

    const adyenAuth = await vbase.getJSON<AdyenHookNotification | null>(
      'adyenAuth',
      settlement.paymentId,
      true
    )

    if (!adyenAuth) {
      logger.error({
        message: 'connectorAdyen-adyenAuthNotFound',
        data: { settlement, adyenAuth },
      })

      throw new Error('Missing transaction data')
    }

    const {
      pspReference,
      amount: { currency },
    } = adyenAuth.notificationItems[0].NotificationRequestItem

    const settings: AppSettings = await apps.getAppSettings(APP_ID)

    await adyen.capture(
      pspReference,
      {
        merchantAccount: settings.merchantAccount,
        amount: {
          value: settlement.value * 100,
          currency,
        },
        reference: `${settlement.paymentId}-${settlement.value}`,
      },
      settings
    )

    return {
      ...settlement,
      code: null,
      message: null,
      settleId: null,
    }
  }

  public inbound: undefined
}

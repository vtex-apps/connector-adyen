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
    const transaction = await vbase.getJSON<StoredTransaction | null>(
      'adyen',
      authorization.paymentId,
      true
    )

    logger.info({
      message: 'connectorAdyen-paymentRequest',
      data: { authorization, transaction },
    })

    if (transaction?.authorization) {
      const [
        {
          NotificationRequestItem: { pspReference, reason, success },
        },
      ] = transaction.authorization.notificationItems

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

    await vbase.saveJSON<StoredTransaction | null>(
      'adyen',
      authorization.paymentId,
      { authorizationRequest: authorization }
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

    const storedTransaction = await vbase.getJSON<StoredTransaction | null>(
      'adyen',
      cancellation.paymentId,
      true
    )

    logger.info({
      message: 'connectorAdyen-cancelRequest',
      data: { cancellation, storedTransaction },
    })

    if (!storedTransaction?.authorization) {
      logger.error({
        message: 'connectorAdyen-storedTransactionNotFound',
        data: { cancellation, storedTransaction },
      })

      throw new Error('Transaction not found')
    }

    if (storedTransaction.cancellation) {
      const [
        {
          NotificationRequestItem: { pspReference, eventCode, reason, success },
        },
      ] = storedTransaction.cancellation.notificationItems

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

    const {
      pspReference,
    } = storedTransaction.authorization.notificationItems[0].NotificationRequestItem

    const settings: AppSettings = await apps.getAppSettings(APP_ID)

    await adyen.cancel(
      pspReference,
      {
        merchantAccount: settings.merchantAccount,
        reference: cancellation.requestId,
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

    const storedTransaction = await vbase.getJSON<StoredTransaction | null>(
      'adyen',
      refund.paymentId,
      true
    )

    logger.info({
      message: 'connectorAdyen-refundRequest',
      data: { refund, storedTransaction },
    })

    if (!storedTransaction?.authorization) {
      logger.error({
        message: 'connectorAdyen-storedTransactionNotFound',
        data: { refund, storedTransaction },
      })

      throw new Error('Missing transaction data')
    }

    if (storedTransaction.refund) {
      const [
        {
          NotificationRequestItem: { pspReference, eventCode, reason, success },
        },
      ] = storedTransaction.refund.notificationItems

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

    const {
      pspReference,
      amount: { currency },
    } = storedTransaction.authorization?.notificationItems[0].NotificationRequestItem

    const settings: AppSettings = await apps.getAppSettings(APP_ID)

    await adyen.refund(
      pspReference,
      {
        merchantAccount: settings.merchantAccount,
        amount: { value: refund.value * 100, currency },
        reference: refund.requestId,
      },
      settings
    )

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

    const storedTransaction = await vbase.getJSON<StoredTransaction | null>(
      'adyen',
      settlement.paymentId,
      true
    )

    logger.info({
      message: 'connectorAdyen-settleRequest',
      data: { settlement, storedTransaction },
    })

    if (!storedTransaction?.authorization) {
      logger.error({
        message: 'connectorAdyen-storedTransactionNotFound',
        data: { settlement, storedTransaction },
      })

      throw new Error('Missing transaction data')
    }

    if (storedTransaction.capture) {
      const [
        {
          NotificationRequestItem: { pspReference, eventCode, reason, success },
        },
      ] = storedTransaction.capture.notificationItems

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

    const {
      pspReference,
      amount: { currency },
    } = storedTransaction.authorization?.notificationItems[0].NotificationRequestItem

    const settings: AppSettings = await apps.getAppSettings(APP_ID)

    await adyen.capture(
      pspReference,
      {
        merchantAccount: settings.merchantAccount,
        amount: {
          value: settlement.value * 100,
          currency,
        },
        reference: settlement.paymentId,
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

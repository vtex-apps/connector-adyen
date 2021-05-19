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
  isTokenizedCard,
  Authorizations,
  ApproveSettlementArgs,
  ApproveRefundArgs,
} from '@vtex/payment-provider'

import { randomString } from './utils'
import { executeAuthorization } from './flow'
import { Clients } from './clients'

const merchantAccount = 'StevenBowenECOM'

export default class Adyen extends PaymentProvider<Clients> {
  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    if (this.isTestSuite) {
      return executeAuthorization(authorization, response =>
        this.callback(authorization, response)
      )
    }

    const {
      clients: { adyen },
      // vtex: { logger },
    } = this.context

    // GET TRANSACTION DETAILS

    let adyenResponse: AdyenPaymentResponse | null = null

    if (isCardAuthorization(authorization)) {
      const { card } = authorization

      if (!isTokenizedCard(card)) {
        const {
          number,
          expiration: { month: expiryMonth, year: expiryYear },
          holder: holderName,
          csc: cvc,
        } = card

        const {
          value,
          currency,
          reference,
          returnUrl,
          secureProxyUrl,
        } = authorization

        try {
          adyenResponse = await adyen.payment(
            {
              merchantAccount,
              amount: { value, currency },
              reference,
              paymentMethod: {
                type: 'scheme',
                number,
                expiryMonth,
                expiryYear,
                cvc,
                holderName,
              },
              returnUrl: returnUrl ?? '',
            },
            secureProxyUrl as string
          )
        } catch (err) {
          console.log(err)
        }

        if (!adyenResponse) throw new Error('No Adyen response')

        const { resultCode, pspReference, refusalReason } = adyenResponse

        if (resultCode === 'Authorised') {
          return Authorizations.approveCard(authorization, {
            tid: pspReference,
            authorizationId: pspReference,
          })
        }

        if (
          resultCode === 'Error' ||
          resultCode === 'Refused' ||
          resultCode === 'Cancelled'
        ) {
          return Authorizations.deny(authorization, {
            code: resultCode,
            message: refusalReason,
          })
        }
      }
    }

    throw new Error('Not implemented')
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }

    const {
      clients: { adyen },
      // vtex: { logger },
    } = this.context

    const { authorizationId } = cancellation

    // get transaction

    // if cancelled

    Cancellations.approve(cancellation, {
      cancellationId: '', // transaction.pspReference,
    })

    // else request cancel
    const cancelResponse = await adyen.cancel({
      merchantAccount,
      originalReference: authorizationId,
    })

    if (cancelResponse.response === '[cancel-received]') {
      // handle
    }

    throw new Error('Not implemented')
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      const refundArgs: ApproveRefundArgs = { refundId: 'abc123' }

      return Refunds.approve(refund, refundArgs)
    }

    const {
      clients: { adyen },
      // vtex: { logger },
    } = this.context

    if (!refund.tid) throw new Error('Not implemented')

    const refundResponse = await adyen.refund({
      merchantAccount,
      modificationAmount: refund.value,
      originalReference: refund.tid,
    })

    if (refundResponse.response === '[capture-received]') {
      return {
        ...refund,
        refundId: refundResponse.pspReference,
        code: null,
        message: null,
      }
    }

    throw new Error('Not implemented')
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      const settlementArgs: ApproveSettlementArgs = { settleId: '123abc' }

      return Settlements.deny(settlement, settlementArgs)
    }

    // const {
    //   paymentId,
    //   requestId,
    //   value,
    //   authorizationId,
    //   tid,
    //   recipients,
    //   transactionId,
    // } = settlement

    const {
      clients: { adyen },
      // vtex: { logger },
    } = this.context

    const captureResponse = await adyen.capture({
      merchantAccount,
      modificationAmount: settlement.value,
      originalReference: settlement.authorizationId,
    })

    if (captureResponse.response === '[capture-received]') {
      return {
        ...settlement,
        settleId: captureResponse.pspReference,
        code: null,
        message: null,
      }
    }

    throw new Error('Not implemented')
  }

  public inbound: undefined
}

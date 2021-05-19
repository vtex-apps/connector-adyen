/* eslint-disable @typescript-eslint/consistent-type-imports */
import { SecureExternalClient } from '@vtex/payment-provider'
import { InstanceOptions, IOContext, RequestConfig } from '@vtex/api'

const CHECKOUT_API_KEY =
  'AQEmhmfuXNWTK0Qc+iSDhmEuouq5R5xIAzvm2vHcSangnOYX0q2Z90wQwV1bDb7kfNy1WIxIIkxgBw==-63O7GcdLMtDgTS27uIR9QZEbvH2k89LHOgqQxyajFHs=-m5gbN:#jCUY{H;c>'

export default class Adyen extends SecureExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super('http://', context, options)
  }

  public async payment(
    data: AdyenPayment,
    secureProxyUrl: string
  ): Promise<AdyenPaymentResponse> {
    console.log(data)

    return this.http.post(`checkout-test.adyen.com/v67/payments`, data, {
      headers: {
        'X-API-Key': CHECKOUT_API_KEY,
        'X-Vtex-Use-Https': true,
      },
      secureProxy: secureProxyUrl,
      metric: 'Adyen-payment',
    } as RequestConfig)
  }

  public async capture(
    data: AdyenCaptureRequest
  ): Promise<AdyenModificationResponse> {
    return this.http.post(
      `pal-test.adyen.com/pal/servlet/Payment/v64/capture
    `,
      data,
      {
        headers: {
          'X-API-Key': CHECKOUT_API_KEY,
          'X-Vtex-Use-Https': true,
        },
        metric: 'Adyen-capture',
      }
    )
  }

  public async cancel(
    data: AdyenModificationRequest
  ): Promise<AdyenModificationResponse> {
    return this.http.post(
      `pal-test.adyen.com/pal/servlet/Payment/v64/cancel
    `,
      data,
      {
        headers: {
          'X-API-Key': CHECKOUT_API_KEY,
          'X-Vtex-Use-Https': true,
        },
        metric: 'Adyen-cancel',
      }
    )
  }

  public async refund(
    data: AdyenRefundRequest
  ): Promise<AdyenModificationResponse> {
    return this.http.post(
      `pal-test.adyen.com/pal/servlet/Payment/v64/cancel
    `,
      data,
      {
        headers: {
          'X-API-Key': CHECKOUT_API_KEY,
          'X-Vtex-Use-Https': true,
        },
        metric: 'Adyen-cancel',
      }
    )
  }
}

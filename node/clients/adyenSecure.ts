/* eslint-disable @typescript-eslint/consistent-type-imports */
import { SecureExternalClient } from '@vtex/payment-provider'
import {
  // ExternalClient,
  InstanceOptions,
  IOContext,
  RequestConfig,
} from '@vtex/api'

export default class AdyenSecure extends SecureExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super('http://checkout-test.adyen.com', context, options)
  }

  public async payment({
    data,
    settings,
    secureProxyUrl,
  }: AdyenPaymentRequest): Promise<AdyenPaymentResponse | null> {
    return this.http.post<AdyenPaymentResponse>(
      `/checkout/v67/payments`,
      data,
      {
        headers: {
          'X-API-Key': settings.apiKey,
          'X-Vtex-Use-Https': 'true',
        },
        secureProxy: secureProxyUrl,
        metric: 'connectorAdyen-payment',
      } as RequestConfig
    )
  }
}

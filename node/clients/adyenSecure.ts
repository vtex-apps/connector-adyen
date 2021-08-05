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
    try {
      const response = await this.http.postRaw<AdyenPaymentResponse>(
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

      return response.data
    } catch (error) {
      this.context.logger.error({
        error,
        message: 'connectorAdyen-adyenPaymentRequest',
        data,
      })

      return null
    }
  }
}

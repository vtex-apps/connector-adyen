/* eslint-disable @typescript-eslint/consistent-type-imports */
import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'
import {
  ApprovedAuthorization,
  FailedAuthorization,
} from '@vtex/payment-provider'

export default class Provider extends ExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super(`http://heimdall.vtexpayments.com.br/api`, context, options)
  }

  public async callback(
    url: string,
    { vtexAppKey, vtexAppToken }: { vtexAppKey: string; vtexAppToken: string },
    response: ApprovedAuthorization | FailedAuthorization
  ): Promise<void> {
    return this.http.post(url, response, {
      headers: {
        'X-Vtex-Use-Https': 'true',
        'Content-Type': 'application/json',
        'X-VTEX-API-AppKey': vtexAppKey,
        'X-VTEX-API-AppToken': vtexAppToken,
      },
    })
  }
}

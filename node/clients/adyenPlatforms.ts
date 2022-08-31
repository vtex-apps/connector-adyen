// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

export default class Platforms extends ExternalClient {
  constructor(ctx: IOContext, opts?: InstanceOptions) {
    super(
      `http://${ctx.workspace}--${ctx.account}.myvtex.com/_v/api/adyen-platforms`,
      ctx,
      opts
    )
  }

  public async getAccounts(ctx: Context, sellers: string[]): Promise<any> {
    return this.http.get(`/v0/account?seller=${sellers.join('&seller=')}`, {
      headers: {
        VtexIdclientAutCookie: ctx.vtex.authToken,
      },
      metric: 'connectorAdyen-getAccounts',
    })
  }
}

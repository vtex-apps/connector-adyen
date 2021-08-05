/* eslint-disable @typescript-eslint/consistent-type-imports */
import { ClientsConfig, IOClients, ServiceContext } from '@vtex/api'

import Adyen from './adyen'
import Platforms from './adyenPlatforms'
import AdyenSecure from './adyenSecure'
import Provider from './provider'

export class Clients extends IOClients {
  public get adyen() {
    return this.getOrSet('adyen', Adyen)
  }

  public get adyenSecure() {
    return this.getOrSet('adyenSecure', AdyenSecure)
  }

  public get provider() {
    return this.getOrSet('provider', Provider)
  }

  public get platforms() {
    return this.getOrSet('platforms', Platforms)
  }
}

declare global {
  type Context = ServiceContext<Clients>
}

const EIGHT_SECONDS = 8000

export const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: EIGHT_SECONDS,
    },
  },
}

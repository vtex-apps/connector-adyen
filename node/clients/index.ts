/* eslint-disable @typescript-eslint/consistent-type-imports */
import { ClientsConfig, IOClients, ServiceContext } from '@vtex/api'

import Adyen from './adyen'

export class Clients extends IOClients {
  public get adyen() {
    return this.getOrSet('adyen', Adyen)
  }
}

declare global {
  type Context = ServiceContext<Clients>
}

const EIGHT_SECONDS = 800

export const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: EIGHT_SECONDS,
    },
  },
}

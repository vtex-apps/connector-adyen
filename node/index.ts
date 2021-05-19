import { PaymentProviderService } from '@vtex/payment-provider'

import { clients } from './clients'
import connector from './connector'
import routes from './routes'

export default new PaymentProviderService({
  connector,
  clients,
  routes,
})

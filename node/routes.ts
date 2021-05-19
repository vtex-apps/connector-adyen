import { method } from '@vtex/api'

const handleAdyenWebhook = (ctx: Context) => {
  const { headers } = ctx

  const { username, password } = headers

  if (!username || !password) {
    ctx.status = 401

    return
  }

  // store response

  ctx.body = '[accepted]'
}

const routes = {
  adyenWebhook: method({ POST: [handleAdyenWebhook] }),
}

export default routes

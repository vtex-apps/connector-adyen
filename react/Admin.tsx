/* eslint-disable @typescript-eslint/consistent-type-imports */
import React, { FC, useState, useEffect } from 'react'
import { useIntl } from 'react-intl'
import { useQuery, useMutation } from 'react-apollo'
import {
  Layout,
  PageHeader,
  PageBlock,
  Input,
  Button,
  ToastProvider,
  ToastConsumer,
  Toggle,
} from 'vtex.styleguide'
import { useRuntime } from 'vtex.render-runtime'

import AppSettings from './graphql/appSettings.graphql'
import SaveAppSettings from './graphql/saveAppSettings.graphql'

const Admin: FC = () => {
  const { formatMessage } = useIntl()
  const { account } = useRuntime()

  const [settingsState, setSettingsState] = useState({
    merchantAccount: '',
    apiKey: '',
    productionAPI: '',
    webhookUsername: '',
    webhookPassword: '',
    vtexAppKey: '',
    vtexAppToken: '',
    useAdyenPlatforms: false,
  })

  const [settingsLoading, setSettingsLoading] = useState(false)

  const { data } = useQuery(AppSettings, {
    variables: {
      version: process.env.VTEX_APP_VERSION,
    },
    ssr: false,
  })

  const [saveSettings] = useMutation(SaveAppSettings)

  useEffect(() => {
    if (!data?.appSettings?.message) return

    const parsedSettings = JSON.parse(data.appSettings.message)

    setSettingsState(parsedSettings)
  }, [data, account, formatMessage])

  const handleSaveSettings = async (showToast: any) => {
    setSettingsLoading(true)

    await saveSettings({
      variables: {
        version: process.env.VTEX_APP_VERSION,
        settings: JSON.stringify(settingsState),
      },
    })
      .catch((err) => {
        console.error(err)
        showToast({
          message: formatMessage({
            id: 'admin/adyen.saveSettings.failure',
          }),
          duration: 5000,
        })
        setSettingsLoading(false)
      })
      .then(() => {
        showToast({
          message: formatMessage({
            id: 'admin/adyen.saveSettings.success',
          }),
          duration: 5000,
        })

        setSettingsLoading(false)
      })
  }

  return (
    <ToastProvider positioning="window">
      <ToastConsumer>
        {({ showToast }: { showToast: any }) => (
          <Layout
            pageHeader={
              <PageHeader
                title={formatMessage({
                  id: 'admin/adyen.title',
                })}
              />
            }
          >
            <PageBlock>
              <section className="pb4">
                <Input
                  label={formatMessage({
                    id: 'admin/adyen.settings.adyenMerchantAccount.label',
                  })}
                  value={settingsState.merchantAccount}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      merchantAccount: e.currentTarget.value,
                    })
                  }
                  helpText={formatMessage({
                    id: 'admin/adyen.settings.adyenMerchantAccount.helpText',
                  })}
                  token
                />
              </section>
              <section className="pb4">
                <Input
                  label={formatMessage({
                    id: 'admin/adyen.settings.adyenApiKey.label',
                  })}
                  value={settingsState.apiKey}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      apiKey: e.currentTarget.value,
                    })
                  }
                  helpText={formatMessage({
                    id: 'admin/adyen.settings.adyenApiKey.helpText',
                  })}
                  token
                />
              </section>
              <section className="pb4">
                <Input
                  label={formatMessage({
                    id: 'admin/adyen.settings.adyenProductionAPI.label',
                  })}
                  value={settingsState.productionAPI}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      productionAPI: e.currentTarget.value,
                    })
                  }
                  helpText={formatMessage({
                    id: 'admin/adyen.settings.adyenProductionAPI.helpText',
                  })}
                  token
                />
              </section>
              <section className="pb4">
                <Input
                  label={formatMessage({
                    id: 'admin/adyen.settings.adyenWebhookUsername.label',
                  })}
                  value={settingsState.webhookUsername}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      webhookUsername: e.currentTarget.value,
                    })
                  }
                  helpText={formatMessage({
                    id: 'admin/adyen.settings.adyenMerchantAccount.helpText',
                  })}
                  token
                />
              </section>
              <section className="pb4">
                <Input
                  label={formatMessage({
                    id: 'admin/adyen.settings.adyenWebhookPassword.label',
                  })}
                  value={settingsState.webhookPassword}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      webhookPassword: e.currentTarget.value,
                    })
                  }
                  helpText={formatMessage({
                    id: 'admin/adyen.settings.adyenMerchantAccount.helpText',
                  })}
                  token
                />
              </section>
              <section className="pb4">
                <Input
                  label={formatMessage({
                    id: 'admin/adyen.settings.vtexAppKey.label',
                  })}
                  value={settingsState.vtexAppKey}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      vtexAppKey: e.currentTarget.value,
                    })
                  }
                  token
                />
              </section>
              <section className="pb6">
                <Input
                  label={formatMessage({
                    id: 'admin/adyen.settings.vtexAppToken.label',
                  })}
                  value={settingsState.vtexAppToken}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      vtexAppToken: e.currentTarget.value,
                    })
                  }
                  helpText={formatMessage({
                    id: 'admin/adyen.settings.vtexAppToken.helpText',
                  })}
                  token
                />
              </section>
              <section className="pb4">
                <Toggle
                  label={
                    settingsState.useAdyenPlatforms
                      ? formatMessage({
                          id: 'admin/adyen.settings.adyenPlatforms.active',
                        })
                      : formatMessage({
                          id: 'admin/adyen.settings.adyenPlatforms.inactive',
                        })
                  }
                  size="large"
                  checked={settingsState.useAdyenPlatforms}
                  onChange={() =>
                    setSettingsState({
                      ...settingsState,
                      useAdyenPlatforms: !settingsState.useAdyenPlatforms,
                    })
                  }
                  helpText={formatMessage({
                    id: 'admin/adyen.settings.adyenPlatforms.helpText',
                  })}
                />
              </section>

              <section className="pt4">
                <Button
                  variation="primary"
                  onClick={() => handleSaveSettings(showToast)}
                  isLoading={settingsLoading}
                  disabled={
                    !settingsState.merchantAccount ||
                    !settingsState.apiKey ||
                    !settingsState.vtexAppKey ||
                    !settingsState.vtexAppToken
                  }
                >
                  {formatMessage({
                    id: 'admin/adyen.saveSettings.buttonText',
                  })}
                </Button>
              </section>
            </PageBlock>
          </Layout>
        )}
      </ToastConsumer>
    </ToastProvider>
  )
}

export default Admin

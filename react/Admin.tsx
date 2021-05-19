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
  Toggle,
  ToastProvider,
  ToastConsumer,
} from 'vtex.styleguide'
import { useRuntime } from 'vtex.render-runtime'

import AppSettings from './graphql/appSettings.graphql'
import SaveAppSettings from './graphql/saveAppSettings.graphql'

const Admin: FC = () => {
  const { formatMessage } = useIntl()
  const { account } = useRuntime()

  const [settingsState, setSettingsState] = useState({
    adyenToken: '',
    vtexAppKey: '',
    vtexAppToken: '',
    isLive: false,
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
      .catch(err => {
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
                    id: 'admin/adyen.settings.adyenToken.label',
                  })}
                  value={settingsState.adyenToken}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      adyenToken: e.currentTarget.value,
                    })
                  }
                  helpText={formatMessage({
                    id: 'admin/adyen.settings.adyenToken.helpText',
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
              <section className="pb4">
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
              <section className="pv4">
                <Toggle
                  semantic
                  label={formatMessage({
                    id: 'admin/adyen.settings.isLive.label',
                  })}
                  size="large"
                  checked={settingsState.isLive}
                  onChange={() => {
                    setSettingsState({
                      ...settingsState,
                      isLive: !settingsState.isLive,
                    })
                  }}
                  helpText={formatMessage({
                    id: 'admin/adyen.settings.isLive.helpText',
                  })}
                />
              </section>
              <section className="pt4">
                <Button
                  variation="primary"
                  onClick={() => handleSaveSettings(showToast)}
                  isLoading={settingsLoading}
                  disabled={
                    !settingsState.adyenToken ||
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

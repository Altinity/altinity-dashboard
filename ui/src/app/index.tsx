import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppLayout } from '@app/AppLayout/AppLayout';
import { AppRoutes } from '@app/routes';
import '@app/app.css';
import { Alert, AlertActionCloseButton, AlertGroup, AlertVariant } from '@patternfly/react-core';
import { useState } from 'react';

export interface AlertData {
  title: string
  variant: string
}

interface AlertDataInternal extends AlertData {
  key: number
}

export type AddAlertType = (data: AlertData) => void

const App: React.FunctionComponent = () => {
  const [alerts, setAlerts] = useState(new Array<AlertDataInternal>())
  const addAlert: AddAlertType = (data: AlertData): void => {
    setAlerts([...alerts, {title: data.title, variant: data.variant, key: new Date().getTime()}])
  }
  const removeAlert = (key: number): void => {
    setAlerts([...alerts.filter(a => a.key !== key)])
  }
  return (
    <Router>
      <AppLayout>
        <AlertGroup isToast isLiveRegion>
          {alerts.map(({ key, variant, title }) => (
            <Alert
              variant={AlertVariant[variant]}
              title={title}
              actionClose={
                <AlertActionCloseButton
                  title={title}
                  variantLabel={`${variant} alert`}
                  onClose={() => removeAlert(key)}
                />
              }
              key={key} />
          ))}
        </AlertGroup>
        <AppRoutes addAlert={addAlert} />
      </AppLayout>
    </Router>
  )
}

export default App;

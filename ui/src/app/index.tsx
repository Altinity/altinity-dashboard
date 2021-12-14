import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppLayout } from '@app/AppLayout/AppLayout';
import { AppRoutes } from '@app/routes';
import '@app/app.css';
import { Alert, AlertActionCloseButton, AlertGroup, AlertVariant } from '@patternfly/react-core';
import { useState } from 'react';
import { AddAlertContextProvider, AddAlertType } from '@app/utils/alertContext';

interface AlertData {
  title: string
  variant: AlertVariant
  key: number
}

const App: React.FunctionComponent = () => {
  const [alerts, setAlerts] = useState(new Array<AlertData>())
  const addAlert: AddAlertType = (title: string, variant: AlertVariant): void => {
    setAlerts([...alerts, {title: title, variant: variant, key: new Date().getTime()}])
  }
  const removeAlert = (key: number): void => {
    setAlerts([...alerts.filter(a => a.key !== key)])
  }
  return (
    <Router>
      <AddAlertContextProvider value={addAlert}>
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
          <AppRoutes/>
        </AppLayout>
      </AddAlertContextProvider>
    </Router>
  )
}

export default App;

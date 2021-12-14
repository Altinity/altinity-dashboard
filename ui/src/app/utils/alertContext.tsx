import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';

export type AddAlertType = (title: string, variant: AlertVariant) => void
export const AddAlertContext = React.createContext<AddAlertType>(() => {return undefined})
export const AddAlertContextProvider = AddAlertContext.Provider

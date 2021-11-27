import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { AppRoutesProps } from '@app/routes';
import { useState } from 'react';

// ToggleModalProps are the properties of the ToggleModal component
export interface ToggleModalProps extends AppRoutesProps {
  modal: React.FunctionComponent<ToggleModalSubProps>
  onToggle?: (open: boolean) => void
}

// ToggleModalSubProps are the properties of the Modal within the ToggleModal component
export interface ToggleModalSubProps extends AppRoutesProps {
  isModalOpen: boolean
  closeModal: () => void
}

export const ToggleModal: React.FunctionComponent<ToggleModalProps> = (props: ToggleModalProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleStateChange = (open: boolean): void => {
    setIsModalOpen(open)
    if (props.onToggle) {
      props.onToggle(open)
    }
  }
  return (
    <React.Fragment>
      <Button variant="primary" onClick={() => handleStateChange(!isModalOpen)}>
        +
      </Button>
      {props.modal({
        addAlert: props.addAlert,
        isModalOpen: isModalOpen,
        closeModal: () => { handleStateChange(false) },
      })}
    </React.Fragment>
  )
}

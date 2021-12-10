import React from 'react';
import { Modal, Button, ButtonVariant, ModalVariant } from '@patternfly/react-core';

export const SimpleModal: React.FunctionComponent<
  {
    title: string
    actionButtonText: string
    actionButtonVariant?: ButtonVariant
    cancelButtonText?: string
    isModalOpen: boolean
    onActionClick?: () => void
    onClose: () => void
    positionTop?: boolean
  }> = (props) => {
  const actionButtonVariant = props.actionButtonVariant ? props.actionButtonVariant : ButtonVariant.primary
  const cancelButtonText = props.cancelButtonText ? props.cancelButtonText : "Cancel"
  const closeModal = () => {
    props.onClose()
  }
  const actionClick = () => {
    closeModal()
    if (props.onActionClick) {
      props.onActionClick()
    }
  }
  return (
    <Modal
      variant={ModalVariant.small}
      position={props.positionTop ? "top" : undefined}
      title={props.title}
      isOpen={props.isModalOpen}
      onClose={closeModal}
      actions={[
        <Button key="confirm" variant={actionButtonVariant} onClick={actionClick}>
          {props.actionButtonText}
        </Button>,
        <Button key="cancel" variant="link" onClick={closeModal}>
          {cancelButtonText}
        </Button>
      ]}
    >
      {props.children}
    </Modal>
  )
}

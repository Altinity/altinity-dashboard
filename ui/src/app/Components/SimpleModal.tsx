import React from 'react';
import { Modal, Button, ButtonVariant, ModalVariant } from '@patternfly/react-core';

export class SimpleModal extends React.Component<
  {
    title: string
    actionButtonText: string
    actionButtonVariant?: ButtonVariant
    cancelButtonText?: string
    isModalOpen: boolean
    onActionClick?: () => void
    onClose: () => void
    positionTop?: boolean
  },
  {
    actionButtonVariant: ButtonVariant
    cancelButtonText: string
  }> {
  private readonly closeModal: () => void;
  private readonly actionClick: () => void;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(props) {
    super(props);
    this.state = {
      actionButtonVariant: this.props.actionButtonVariant ? this.props.actionButtonVariant : ButtonVariant.primary,
      cancelButtonText: this.props.cancelButtonText ? this.props.cancelButtonText : "Cancel"
    };
    this.closeModal = () => {
      this.props.onClose()
    };
    this.actionClick = () => {
      this.closeModal()
      if (this.props.onActionClick) {
        this.props.onActionClick()
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    return (
      <React.Fragment>
        <Modal
          variant={ModalVariant.small}
          position={this.props.positionTop ? "top" : undefined}
          title={this.props.title}
          isOpen={this.props.isModalOpen}
          onClose={this.closeModal}
          actions={[
            <Button key="confirm" variant={this.state.actionButtonVariant} onClick={this.actionClick}>
              {this.props.actionButtonText}
            </Button>,
            <Button key="cancel" variant="link" onClick={this.closeModal}>
              {this.state.cancelButtonText}
            </Button>
          ]}
        >
          {this.props.children}
        </Modal>
      </React.Fragment>
    );
  }
}

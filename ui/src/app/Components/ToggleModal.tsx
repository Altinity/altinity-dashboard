import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { ReactElement } from 'react';

export class ToggleModal extends React.Component<
  {
    modal: (isModalOpen: boolean, closeModal: () => void) => ReactElement
  },
  {
    isModalOpen: boolean,
  }> {
  private readonly handleModalToggle: () => void;
  private readonly closeModal: () => void;
  constructor(props) {
    super(props)
    this.state = {
      isModalOpen: false,
    }
    this.handleModalToggle = () => {
      this.setState(({ isModalOpen }) => ({
        isModalOpen: !isModalOpen
      }))
    }
    this.closeModal = () => {
      this.setState({
        isModalOpen: false
      })
    }
  }
  render() {
    return (
      <React.Fragment>
        <Button variant="primary" onClick={this.handleModalToggle}>
          +
        </Button>
        {this.props.modal(this.state.isModalOpen, this.closeModal)}
      </React.Fragment>
    );
  }
}

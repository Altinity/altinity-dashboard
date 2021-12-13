import * as React from 'react';
import {
  ButtonVariant,
  ClipboardCopy,
  Grid, GridItem, Modal, Split, SplitItem
} from '@patternfly/react-core';
import { useState } from 'react';
import { TextInput } from '@patternfly/react-core/src/components/TextInput/index';
import { Button } from '@patternfly/react-core/src/components/Button/index';
import EyeIcon from '@patternfly/react-icons/dist/esm/icons/eye-icon';
import EyeSlashIcon from '@patternfly/react-icons/dist/esm/icons/eye-slash-icon';
import { ToggleModal, ToggleModalSubProps } from '@app/Components/ToggleModal';
import jsSHA from 'jssha';

export const StringHasher: React.FunctionComponent<{
  DefaultHidden?: boolean
  title?: string
  valueName?: string
}> = (props) => {
  const [isInputHidden, setIsInputHidden] = useState(props.DefaultHidden === undefined ? true : props.DefaultHidden)
  const [inputValue, setInputValue] = useState("")
  const [hashValue, setHashValue] = useState("")
  const title = props.title ? props.title : "String Hash Tool"
  const valueName = props.valueName ? props.valueName : "string"
  const onValueChange = (value: string) => {
    setInputValue(value)
    const jh = new jsSHA('SHA-256', 'TEXT')
    jh.update(value)
    const hash = jh.getHash("HEX")
    setHashValue(hash)
  }
  return (
    <React.Fragment>
      <ToggleModal
        buttonVariant={ButtonVariant.link}
        buttonText={title}
        buttonInline={true}
        modal={(props: ToggleModalSubProps) => {
          return (
            <Modal title={title}
                   variant="small"
                   isOpen={props.isModalOpen}
                   onClose={props.closeModal}
            >
              <Grid hasGutter>
                <GridItem span={12}>
                  <div>Enter a {valueName}:</div>
                  <Split>
                    <SplitItem isFilled={true}>
                      <TextInput
                        isRequired
                        type={isInputHidden ? 'password' : 'text'}
                        value={inputValue}
                        onChange={onValueChange}
                      />
                    </SplitItem>
                    <SplitItem>
                      <Button
                        variant="control"
                        onClick={() => setIsInputHidden(!isInputHidden)}
                      >
                        {isInputHidden ? <EyeIcon /> : <EyeSlashIcon />}
                      </Button>
                    </SplitItem>
                  </Split>
                </GridItem>
                <GridItem span={12}>
                  <div>Hex hash using sha-256:</div>
                  <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
                    {hashValue}
                  </ClipboardCopy>
                </GridItem>
              </Grid>
            </Modal>
          )
        }}
      />
    </React.Fragment>
  )
}

import React, { ComponentProps } from 'react';
import { Operators } from '@app/Operators/Operators';
import { Story } from '@storybook/react';

//👇 This default export determines where your story goes in the story list
export default {
  title: 'Components/Instances',
  component: Operators,
};

//👇 We create a “template” of how args map to rendering
const Template: Story<ComponentProps<typeof Operators>> = (args) => <Operators {...args} />;

export const SupportStory = Template.bind({});
SupportStory.args = {
  /*👇 The args you need here will depend on your component */
};

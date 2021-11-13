import * as React from 'react';
import { PageSection, Title } from '@patternfly/react-core';
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css";

const Devel: React.FunctionComponent = () => (
    <PageSection>
      <Title headingLevel="h1" size="lg">Developer Tools</Title>
      <SwaggerUI url="/apidocs.json" />
    </PageSection>
)

export { Devel };

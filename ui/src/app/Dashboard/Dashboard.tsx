import * as React from 'react';
import { Gallery, PageSection, Title } from '@patternfly/react-core';
import { Card, CardTitle, CardBody, CardFooter } from '@patternfly/react-core';

interface Pod {
  name: string
}

class PodList extends React.Component {
  state = {
    pods: new Array<Pod>()
  }
  componentDidMount() {
    fetch('/api/v1/pods')
      .then(res => res.json())
      .then(res => {
        return res as Pod[]
      })
      .then(res => {
        this.setState({ pods: res })
      })
  }
  render() {
    return (
      <ul>
        <Gallery hasGutter>
        {
          this.state.pods.map(pod => (
            <Card key={pod.name}>
              <CardTitle>Pod</CardTitle>
              <CardBody>{pod.name}</CardBody>
            </Card>
          ))
        }
        </Gallery>
      </ul>
    )
  }
}

const Dashboard: React.FunctionComponent = () => (
    <PageSection>
      <Title headingLevel="h1" size="lg">Altinity Dashboard</Title>
      <PageSection>
        <Title headingLevel="h2" size="md">Running Pods</Title>
        <PodList/>
      </PageSection>
    </PageSection>
)

export { Dashboard };

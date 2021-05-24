import React, { Component } from 'react';
import { get, post } from 'axios';
import styled from 'styled-components';
import Command from './containers/command';
import CresControl from './containers/cresControl';

const Container = styled.div`
  display: grid;
  grid:
    'cres command'
    'cres response';
  margin: 15px 5px;
  height: 600px;
  gap: 10px;
`;

const ResponseContainer = styled.div`
  grid-area: response;
  font-size: 150%;
`;

const Response = styled.pre`
  border: 1px solid black;
  padding: 10px 10px;
`;

const isNumeric = num => +num === +num; // eslint-disable-line no-self-compare

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      response: [],
      manualFrequency: 150,
      ps1: 0,
      ps2: 0,
      pd: 0,
      delay: 500,
      command: '',
      codesToggled: false,
      timeSyncToggled: false,
      freezeToggled: false,
    };

    [
      'manualFrequencyEnter',
      'manualEnter',
      'timeEnter',
      'enterCommand',
      'globalStat',
      'inputChange',
      'onToggle',
    ].forEach(funcName => {
      this[funcName] = this[funcName].bind(this);
    });
  }

  async componentDidMount() {
    // await post('/api/connect');
    this.setState({ response: 'Connected' });
  }

  onToggle(name) {
    const that = this;
    return async function namedOnToggle() {
      const { [name]: toggle, delay, ps1, ps2, pd } = that.state;
      switch (name) {
        case 'codesToggled':
          if (!toggle) await post('/api/manual_codes', { ps1, ps2, pd });
          else await post('/api/firmware');
          break;
        case 'timeSyncToggled':
          if (!toggle) await post('/api/timesync/on', { delay });
          else await post('/api/timesync/off');
          break;
        case 'freezeToggled':
          if (!toggle) await post('/api/freeze/on');
          else await post('/api/freeze/off');
          break;
        default:
          break;
      }
      that.setState({ [name]: !toggle });
    };
  }

  async manualFrequencyEnter() {
    const { manualFrequency } = this.state;
    await post('/api/manual_frequency', { manualFrequency });
    this.setState({ response: 'Frequency Code Entered' });
  }

  async manualEnter() {
    const { ps1, ps2, pd } = this.state;
    await post('/api/manual_codes', { ps1, ps2, pd });
    this.setState({ response: 'Codes Entered', codesToggled: true });
  }

  async timeEnter() {
    const { delay } = this.state;
    await post('/api/timesync/on', { delay });
    this.setState({ response: 'Time Sync Entered', timeSyncToggled: true });
  }

  async enterCommand() {
    let { command } = this.state;
    command = command.trim();
    const {
      data: { response },
    } = await get('/api/command', { params: { command } });
    const newState = { response };
    if (command.slice(0, 2) === 'sf') newState.manualFrequency = command.slice(3);
    if (command.slice(0, 5) === 'mp3 1') {
      const [ps1, ps2, pd] = command.slice(6).split(' ');
      newState.ps1 = ps1;
      newState.ps2 = ps2;
      newState.pd = pd;
      newState.codesToggled = true;
    }
    if (command.slice(0, 5) === 'mp3 0') newState.codesToggled = false;
    if (command.slice(0, 10) === 'timesync 1') {
      newState.delay = command.slice(11);
      newState.timeSyncToggled = true;
    }
    if (command.slice(0, 10) === 'timesync 0') newState.timeSyncToggled = false;
    if (command === 'frz 1') newState.freezeToggled = true;
    if (command === 'frz 0') newState.freezeToggled = false;
    this.setState(newState);
  }

  async globalStat() {
    const {
      data: { response },
    } = await get('/api/command', { params: { command: 'GlobalStat' } });
    this.setState({ response });
  }

  inputChange({ target: { name, value: v } }) {
    let value = v;
    if (isNumeric(value)) value = value.toString().replace(/^[0]+/g, '') || 0;
    this.setState({ [name]: value });
  }

  render() {
    const { response, manualFrequency, ps1, ps2, pd, delay, command, codesToggled, timeSyncToggled, freezeToggled } =
      this.state;
    return (
      <Container>
        <CresControl
          inputChange={this.inputChange}
          manualFrequency={manualFrequency}
          manualFrequencyEnter={this.manualFrequencyEnter}
          ps1={ps1}
          ps2={ps2}
          pd={pd}
          manualEnter={this.manualEnter}
          delay={delay}
          timeEnter={this.timeEnter}
          onToggle={this.onToggle}
          codesToggled={codesToggled}
          timeSyncToggled={timeSyncToggled}
          freezeToggled={freezeToggled}
        />
        <Command
          command={command}
          inputChange={this.inputChange}
          enterCommand={this.enterCommand}
          globalStat={this.globalStat}
        />
        <ResponseContainer>
          <Response>{response}</Response>
        </ResponseContainer>
      </Container>
    );
  }
}

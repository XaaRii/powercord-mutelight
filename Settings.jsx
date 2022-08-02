const { React } = require('powercord/webpack');
const { SwitchItem, TextInput } = require('powercord/components/settings');
const { Button } = require("powercord/components/");

module.exports = class Settings extends React.Component {
  render () {
    const { getSetting, toggleSetting, updateSetting } = this.props;

    return (
      <div>
        <SwitchItem
          note={'Use YeeLight lights with Lightify'}
          value={getSetting('YeeLight', false)}
          onChange={() => toggleSetting('YeeLight')}
        >
          Yeelight
        </SwitchItem>
        <SwitchItem
          note={'Use Lifx lights with Lightify'}
          value={getSetting('Lifx', false)}
          onChange={() => toggleSetting('Lifx')}
        >
          Lifx
        </SwitchItem>
        <SwitchItem
          note={'Turn on the light if the light is off'}
          value={getSetting('AutoOn', true)}
          onChange={() => toggleSetting('AutoOn')}
        >
          Auto-On
        </SwitchItem>
        <TextInput
          note={'Set the IP address of the YeeLight light you want to use!'}
          value={getSetting('BulbIP', '192.168.0.100')}
          onChange={val => updateSetting('BulbIP', val)}
        >
          Yeelight Device IP
        </TextInput>
        <TextInput
          note={'Enter the device name of the Lifx lamp you want to pulse!'}
          value={getSetting('LifxName', 'MyCeilingLight')}
          onChange={val => updateSetting('LifxName', val)}
        >
          Lifx Device Name
        </TextInput>
        <TextInput
          note={'Set the brightness of the YeeLight light when it\'s pulsed.'}
          value={getSetting('BulbBright', 100)}
          onChange={(val) => updateSetting('BulbBright', (Number(val) && Number(val) >= 1) ? Number(val) : 1, 100)}
        >
          YeeLight Brightness
        </TextInput>
        <TextInput
          note={'Set the color you want the light to flash when you mute yourself. For example, #00ff00 would make it green.'}
          value={getSetting('BulbColor', '#7289DA')}
          onChange={val => updateSetting('BulbColor', val)}
        >
          Lamp Color
        </TextInput>
        <TextInput
          note={'Set the time the light needs to stay the mention color for when you are mentioned.'}
          value={getSetting('BulbDuration', 250)}
          onChange={(val) => updateSetting('BulbDuration', (Number(val) && Number(val) >= 1) ? Number(val) : 1)}
        >
          Pulse Duration
        </TextInput>
        <TextInput
          note={'Pulse should be triggered once every x seconds while muted.\nThis also changes how often Mute Light checks for selfmute.'}
          value={getSetting('PulseTime', 5)}
          onChange={(val) => updateSetting('PulseTime', (Number(val) && Number(val) >= 1) ? Number(val) : 1)}
        >
          Time between pulses
        </TextInput>
        {/* <Button onClick={() => this.props.onConfirmTBP()}>Confirm Time between pulses</Button> */}
      </div>
    );
  }
};

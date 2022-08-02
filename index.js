const { Plugin } = require('powercord/entities');
const { getModule } = require('powercord/webpack');
const { exec } = require('child_process');
const Settings = require('./Settings.jsx');
var muted = false
var mutechecktimer = new timer();
var settingscheck = new timer();
var lastTBP = 5

function hexToHSL(hex) {
    const result = (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(hex);
    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
        s;
    const l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    const HSL = {};
    HSL.h = Math.round(h * 65535);
    HSL.s = Math.round(s * 65535);
    HSL.l = Math.round(l * 65535);
    return HSL;
}

function _pulse(pyName, settings) {
    if (settings.get('YeeLight', false) === true) {
        const hex = settings.get('BulbColor', '#7289DA');
        const result = (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(hex);
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        const color = `${r},${g},${b}`;
        exec(`${pyName} ${__dirname}/pulse_yeelight.py ${settings.get('BulbIP', '192.168.0.100')} ${color} ${settings.get('PulseDuration', 250)} ${settings.get('AutoOn', true)} ${settings.get('BulbBright', 100)}`);
    }
    if (settings.get('Lifx', false) === true) {
        const hsl = hexToHSL(settings.get('BulbColor', '#7289DA'));
        const name = settings.get('LifxName', 'MyCeilingLight');
        console.log(hsl.h, hsl.s, hsl.l);
        exec(`${pyName} ${__dirname}/pulse_lifx.py ${name} ${hsl.h},${hsl.s},${hsl.l} ${settings.get('PulseDuration', 250)} ${settings.get('AutoOn', true)}`, (error, stdout, stderr) => {
            console.log(stdout);
            console.log(error);
            console.log(stderr);
        });
    }
}
function _noPY() {
    powercord.api.notices.sendAnnouncement('pwlmutelight-no-py', {
        color: 'red',
        message: 'Python 3.x is required for the plugin [Pawele] Mute light to function.',
        button: {
            text: 'Download',
            onClick: () => {
                require('electron').shell.openExternal('https://www.python.org/downloads');
            }
        }
    });
}

function _needsDeps(pyName,) {
    powercord.api.notices.sendAnnouncement('pwlmutelight-no-deps', {
        color: 'blue',
        message: '[Pawele] Mute light plugin needs to install additional dependencies.',
        button: {
            text: 'Install',
            onClick: () => {
                exec(`${pyName} -m pip install -r ${__dirname}/requirements.txt`, (error) => {
                    if (error) {
                        powercord.api.notices.sendToast("pwlmutelight-reloaded-f", {
                            header: "[Pawele] Mute light",
                            content: `Something fucked up!`,
                            type: "danger",
                            timeout: 5000,
                        });
                    } else {
                        powercord.pluginManager.remount(this.entityID)
                        powercord.api.notices.sendToast("pwlmutelight-reloaded-s", {
                            header: "[Pawele] Mute light",
                            content: `Dependencies installed successfully!`,
                            type: "success",
                            timeout: 5000,
                        });
                    }
                })
            }
        }
    });
}

async function _checkMute(pyName, settings) {
    settingscheck.start(function () {
        var PulseTime = settings.get('PulseTime', 5)
        if (PulseTime !== lastTBP) {
            lastTBP = PulseTime
            mutechecktimer.set_interval(PulseTime * 1000);
        }
    }, 1000, false);
    mutechecktimer.start(function () {
        var selfmute = getModule(["isSelfMute"], false).isSelfMute()
        if (muted !== selfmute) {
            muted = selfmute
        }
        if (selfmute) _pulse(pyName, settings);
    }, 5000, false)

}

module.exports = class Xmutelight extends Plugin {
    async startPlugin() {
        powercord.api.settings.registerSettings(this.entityID, {
            category: this.entityID,
            label: 'Mute light', // Label that appears in the settings menu
            render: Settings // The React component to render. In this case, the imported Settings file
        });
        const pyName = process.platform === 'win32' ? 'python' : 'python3';
        exec(`${pyName} --version`, { windowsHide: true }, (error) => {
            if (error) {
                _noPY();
            }
        });
        exec(`${pyName} -c "import yeelight"`, (error, stdout, stderr) => {
            if (stderr || stdout) {
                _needsDeps(pyName);
            }
        });
        exec(`${pyName} -c "import lifxlan"`, (error, stdout, stderr) => {
            if (stderr || stdout) {
                _needsDeps(pyName);
            }
        });
        _checkMute(pyName, this.settings)
    }
    pluginWillUnload() {
        powercord.api.settings.unregisterSettings(this.entityID);
        mutechecktimer.stop();
        settingscheck.stop();
    }
};

function timer() {
    /*
     * var timer_1 = new timer();
     * timer_1.start(function() { ... }, 2000, false);
     * timer_1.set_interval(4000);
     * timer_1.stop();
     * // last param is a boolean if it needs to run at 0
    */
    var timer = {
        running: false,
        iv: 5000,
        timeout: false,
        cb: function () { },
        start: function (cb, iv, sd) {
            var elm = this;
            clearInterval(this.timeout);
            this.running = true;
            if (cb) this.cb = cb;
            if (iv) this.iv = iv;
            if (sd) elm.execute(elm);
            this.timeout = setTimeout(function () { elm.execute(elm) }, this.iv);
        },
        execute: function (e) {
            if (!e.running) return false;
            e.cb();
            e.start();
        },
        stop: function () {
            this.running = false;
        },
        set_interval: function (iv) {
            clearInterval(this.timeout);
            this.start(false, iv);
        }
    };
    return timer;
}

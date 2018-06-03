import Tuna from 'tunajs'
import options from '../services/options'

const SIDE_BUY = 1;
const SIDE_SELL = 0;

class Sfx {
	
	constructor() {
		this.timestamp = +new Date();

		this.context = new (window.AudioContext || window.webkitAudioContext);
		
		var tuna = new Tuna(this.context);

		this.output = new tuna.PingPongDelay({
			wetLevel: 0.5, //0 to 1
			feedback: 0.01, //0 to 1
			delayTimeLeft: 175, //1 to 10000 (milliseconds)
			delayTimeRight: 100 //1 to 10000 (milliseconds)
		});

		var filter = new tuna.Filter({
			frequency: 700, //20 to 22050
			Q: 10, //0.001 to 100
			gain: -10, //-40 to 40 (in decibels)
			filterType: "highpass", //lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass
			bypass: 0
		});

		this.output.connect(filter);
		filter.connect(this.context.destination);
	}

	tradeToSong(factor, side) {
		const now = +new Date();
		const osc = [];

		setTimeout(() => {
			const smallTradesCompressor = options.audioVolume > 10 ? 5 : 10;

			if (side) {
				if (factor >= 10) {
					[659.26, 830.6, 987.76, 1318.52].forEach((f, i, a) => setTimeout(() => this.play(f, .05 + Math.sqrt(factor) / 10, .1 + factor * .1), i * 80));
				} else if (factor >= 1) {
					[659.26, 830.6].forEach((f, i) => setTimeout(() => this.play(f, .05 + Math.sqrt(factor) / 10, .1 + factor * .1), i * 80));
				} else {
					this.play(659.26, Math.sqrt(factor) / smallTradesCompressor, .1 + Math.sqrt(factor) / 10);
				}
			} else {
				if (factor >= 10) {
					[493.88, 369.99, 293.66, 246.94].forEach((f, i, a) => setTimeout(() => this.play(f, .05 + Math.sqrt(factor) / 10, i > 2 ? .1 + factor * .1 : .2), i > 2 ? 80 * 3 : i * 80));
				} else if (factor >= 1) {					
					[493.88, 392].forEach((f, i) => setTimeout(() => this.play(f, .05 + Math.sqrt(factor) / 10, .1 + factor * .1), i * 80));
				} else {
					this.play(493.88, Math.sqrt(factor) / smallTradesCompressor, .1 + Math.sqrt(factor) / 10);
				}
			}
		}, this.timestamp - now);

		this.timestamp = Math.max(this.timestamp, now) + 80;
	}
	
	play(frequency, value = .5, length = .1, output = 'output') {
		const time = this.context.currentTime;
		const oscillator = this.context.createOscillator();
		const gain = this.context.createGain();

		oscillator.frequency.value = frequency;
		oscillator.type = 'triangle';

		oscillator.onended = () => {
			oscillator.disconnect();
		}				

		gain.connect(this[output]);
		oscillator.connect(gain);

		value *= options.audioVolume;

		gain.gain.value = Math.min(2, value * .2);
		gain.gain.setValueAtTime(gain.gain.value, time)
		gain.gain.exponentialRampToValueAtTime(0.01, time + length);

		oscillator.start(time);
		oscillator.stop(time + length);
	}
}


export default Sfx;
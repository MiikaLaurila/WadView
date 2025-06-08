const BUFFER_SIZE = 8192;

class MidiAudioProcessor extends AudioWorkletProcessor {
	activeBuffers = null;
	pendingBuffers = null;
	currentBufferIndex = 0;
	hasRequestedBuffers = false;
	volume = 0.5;
	finalBuffer = false;

	constructor() {
		super();
		this.port.onmessage = this.handleMessage.bind(this);
	}

	handleMessage(message) {
		const { command, data } = message.data;
		if (command === "processed-data") {
			this.pendingBuffers = [
				new Float32Array(data.buffers[0]),
				new Float32Array(data.buffers[1]),
			];
			this.finalBuffer = data.isFinal;
			this.hasRequestedBuffers = false;
		}
		if (command === "set-volume") {
			this.volume = data.volume;
		}
	}

	process(_inputs, outputs) {
		const output = outputs[0];
		let allBuffersEmpty = false;

		// Check if current buffer is exhausted
		if (this.activeBuffers && this.currentBufferIndex >= BUFFER_SIZE) {
			this.activeBuffers = null;
			this.currentBufferIndex = 0;
		}

		// Activate pending buffers if available
		if (!this.activeBuffers && this.pendingBuffers) {
			this.activeBuffers = this.pendingBuffers;
			this.pendingBuffers = null;
			this.currentBufferIndex = 0;
			this.requestNewBuffers();
		}

		// Process audio data
		if (this.activeBuffers) {
			this.fillOutput(output);
		} else {
			this.fillSilence(output);
			allBuffersEmpty = true;
		}

		// Request new buffers if needed
		if (allBuffersEmpty && !this.hasRequestedBuffers) {
			this.requestNewBuffers();
		}

		return true;
	}

	fillOutput(output) {
		const leftChannel = output[0];
		const rightChannel = output[1];
		const samplesToCopy = Math.min(
			leftChannel.length,
			BUFFER_SIZE - this.currentBufferIndex,
		);

		for (let i = 0; i < samplesToCopy; i++) {
			const index = this.currentBufferIndex + i;
			leftChannel[i] = this.activeBuffers[0][index] * this.volume;
			rightChannel[i] = this.activeBuffers[1][index] * this.volume;
		}

		if (samplesToCopy < leftChannel.length) {
			for (let i = samplesToCopy; i < leftChannel.length; i++) {
				leftChannel[i] = 0;
				rightChannel[i] = 0;
			}
			this.activeBuffers = null;
			this.currentBufferIndex = 0;
		} else {
			this.currentBufferIndex += samplesToCopy;
		}
	}

	fillSilence(output) {
		for (const channel of output) {
			channel.fill(0);
		}
	}

	requestNewBuffers() {
		if (this.finalBuffer) {
			this.port.postMessage({ command: "end-song" });
		} else {
			this.port.postMessage({ command: "process" });
			this.hasRequestedBuffers = true;
		}
	}
}

registerProcessor("midi-audio-processor", MidiAudioProcessor);

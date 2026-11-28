class FadeProbe extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const samples = inputs[0]?.[0];
    const count = outputs[0][0].length;
    let energy = 0;

    for (const sampleCur of samples ?? []) {
      energy += sampleCur * sampleCur;
    }

    this.port.postMessage({ frame: currentFrame, count, energy });

    return true;
  }
}

registerProcessor('active-book-fade-probe', FadeProbe);

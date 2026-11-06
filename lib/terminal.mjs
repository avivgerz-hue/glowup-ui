// Progress follows real work. No delays, dependencies, telemetry or forced color.
export function terminalProgress({ stream = process.stderr, output = process.stdout, env = process.env, disabled = false } = {}) {
  const enabled = !disabled && stream.isTTY && output.isTTY && !env.CI && env.TERM !== 'dumb' && !Object.hasOwn(env, 'NO_COLOR');
  let frame = 0, active = false;
  const frames = ['[=   ]', '[==  ]', '[ ===]', '[  ==]'];
  return {
    update(message) {
      if (!enabled) return;
      // Only static installer messages belong here, never arbitrary paths/input.
      stream.write(`\r\x1b[2K${frames[frame++ % frames.length]} GLOWUP UI · ${message}`);
      active = true;
    },
    finish() {
      if (active) stream.write('\r\x1b[2K');
      active = false;
    },
  };
}

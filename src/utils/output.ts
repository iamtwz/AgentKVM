export interface CLIOutput {
  success: boolean;
  data?: unknown;
  error?: string;
}

let jsonMode = false;

export function setJsonMode(enabled: boolean): void {
  jsonMode = enabled;
}

export function isJsonMode(): boolean {
  return jsonMode;
}

export function printResult(output: CLIOutput): void {
  if (jsonMode) {
    console.log(JSON.stringify(output));
  } else if (output.success) {
    if (output.data !== undefined) {
      if (typeof output.data === 'string') {
        console.log(output.data);
      } else {
        console.log(JSON.stringify(output.data, null, 2));
      }
    }
  } else {
    console.error(`Error: ${output.error}`);
  }
}

export function printSuccess(data?: unknown): void {
  printResult({ success: true, data });
}

export function printError(error: string): void {
  printResult({ success: false, error });
  process.exit(1);
}

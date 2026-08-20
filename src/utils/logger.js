import chalk from "chalk";

export const log = {
  title: (msg) => console.log(chalk.cyan.bold(msg)),
  info: (msg) => console.log(chalk.blue(msg)),
  success: (msg) => console.log(chalk.green(msg)),
  warn: (msg) => console.log(chalk.yellow(msg)),
  error: (msg) => console.log(chalk.red(msg)),
  step: (msg) => console.log(chalk.magenta(`\u2192 ${msg}`)),
};

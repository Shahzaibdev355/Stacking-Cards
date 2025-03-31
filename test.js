#!/usr/bin/env node

import { exec } from "child_process";
import readline from "readline/promises"; // Use promise-based readline
import chalk from "chalk";
import fs from "fs";

// Create a single readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to execute shell commands
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout.trim());
      }
    });
  });
};

// Git-related functions
const checkRepoStatus = async () => {
  console.log(chalk.blue("\nChecking repository status..."));
  try {
    console.log(`Current directory: ${process.cwd()}`);
    if (!fs.existsSync(".git")) {
      console.log(chalk.red("No Git repository found in the current directory."));
      console.log(chalk.yellow("Exiting Git Assistant..."));
      process.exit(1);
    }
    console.log(chalk.blue("Git repository found. Checking status..."));
    const status = await runCommand("git status");
    console.log(chalk.green(status));
  } catch (error) {
    console.error(chalk.red("Failed to check repository status:"), error.message);
    console.log(chalk.yellow("Exiting Git Assistant..."));
    process.exit(1);
  }
};

const addChanges = async () => {
  console.log(chalk.blue("\nAdding all changes to staging..."));
  try {
    await runCommand("git add .");
    console.log(chalk.green("All changes added to staging."));
  } catch (error) {
    console.log(chalk.red("Failed to add changes:"), error.message);
  }
};

const commitChanges = async () => {
  try {
    const message = await rl.question(chalk.yellow("Enter commit message: "));

    if (!message.trim()) {
      console.log(chalk.red("Commit message cannot be empty."));
      return commitChanges(); // Retry if message is empty
    }

    const commit = await runCommand(`git commit -m "${message}"`);
    console.log(chalk.green(commit || "Changes committed successfully."));
  } catch (error) {
    console.log(chalk.red("Failed to commit changes:"), error.message);
  }

  showMenu();
};

const pushToMaster = async () => {
  console.log(chalk.blue("\nPushing changes to the master branch..."));
  try {
    const push = await runCommand("git push origin master");
    console.log(chalk.green(push || "Changes pushed to the master branch."));
  } catch (error) {
    console.log(chalk.red("Failed to push changes:"), error.message);
  }
};

// Interactive menu options
const menuOptions = [
  "Check repository status",
  "Add changes",
  "Commit changes",
  "Push to master branch",
  "Exit",
];

let selectedOption = 0;

const showMenu = () => {
  console.clear();
  console.log(chalk.bold.green("Git Assistant\n"));
  menuOptions.forEach((option, index) => {
    if (index === selectedOption) {
      console.log(chalk.black.bgYellow(`> ${option}`));
    } else {
      console.log(`  ${option}`);
    }
  });
};

const handleMenuSelection = async () => {
  console.log(`Selected option: ${selectedOption}`);
  switch (selectedOption) {
    case 0:
      await checkRepoStatus();
      break;
    case 1:
      await addChanges();
      break;
    case 2:
      await commitChanges();
      return; // Avoid redrawing menu until commit is completed
    case 3:
      await pushToMaster();
      break;
    case 4:
      console.log(chalk.green("Goodbye!"));
      rl.close(); // Close readline interface before exiting
      process.exit(0);
      break;
    default:
      console.log(chalk.red("Unknown option selected."));
  }
  showMenu();
};

// Enable keypress handling
import * as legacyReadline from "readline"; // Use legacy `readline` for `emitKeypressEvents`

legacyReadline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on("keypress", (str, key) => {
  if (key.name === "c" && key.ctrl) {
    console.log(chalk.green("\nExiting Git Assistant. Goodbye!"));
    rl.close(); // Ensure readline closes
    process.exit(0);
  }

  if (key.name === "up") {
    selectedOption = (selectedOption - 1 + menuOptions.length) % menuOptions.length;
    showMenu();
  } else if (key.name === "down") {
    selectedOption = (selectedOption + 1) % menuOptions.length;
    showMenu();
  } else if (key.name === "return") {
    handleMenuSelection();
  }
});

// Start the application
(async () => {
  showMenu();
})();

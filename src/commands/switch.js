const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

const CONFIG_PATH = path.join(os.homedir(), '.switchy.json');

module.exports = function switchProfile(profileName) {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log(chalk.red('❌ No profile found. Please run "switchy setup" first.'));
    return;
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  const profile = config[profileName];

  if (!profile) {
    console.log(chalk.red(`❌ Profile "${profileName}" not found.`));
    return;
  }

  try {
    console.log(chalk.yellow(`🔁 Switching to ${profileName} profile...`));

    // Set global Git identity
    execSync(`git config --global user.name "${profile.name}"`);
    execSync(`git config --global user.email "${profile.email}"`);

    // GitHub CLI logout (fix: remove -y, use echo to confirm)
    try {
      execSync(`echo y | gh auth logout -h github.com`);
    } catch (logoutErr) {
      console.log(chalk.gray('ℹ️  No active GitHub login to log out of. Skipping logout.'));
    }

    // GitHub CLI login with token
    execSync(`gh auth login --with-token`, {
      input: `${profile.token}\n`
    });


    console.log(chalk.green(`✅ Now using ${profile.name} <${profile.email}>`));
    console.log(chalk.gray('────────────────────────────────────────────'));
    console.log(chalk.yellowBright('⚠️  Note for VS Code users:'));
    console.log(
      chalk.white(
        '  VS Code may still use your previous GitHub login in Source Control.'
      )
    );
    console.log(
      chalk.white(
        '  If pushing/pulling fails in the UI, sign out from VS Code and re-login with the correct GitHub account.'
      )
    );
    console.log(
      chalk.white(
        '  Terminal Git commands (`git push`, `git pull`) will work correctly.'
      )
    );
    console.log(chalk.gray('────────────────────────────────────────────'));
  } catch (err) {
    console.error(chalk.red('⚠️  Failed to switch account:'), err.message);
  }
};

const core = require('@actions/core');
const github = require('@actions/github');

const { ctx } = github;

const BASE_COMMAND = `/virtru`;
const SS_CHANNEL = 'github';

const env = core.getInput('env', { required: true, default: '' });
let urlEnv = '';
if (env === 'development') {
  urlEnv = '.develop';
} else if (env === 'staging') {
  urlEnv = '.staging';
}

const baseUrl = `https://secure${urlEnv}.virtru.com/secure-share`;
const linkRef = `?ch=${SS_CHANNEL}&oid=${ctx.payload.repository.full_name}/${ctx.issue.issue_number}`;


function log() {
  return {
    info: console.log,
    warn: console.warn,
    error: console.error,
  };
}

function ensureCorrectEvent() {
  if (ctx.eventName !== 'issue_comment') {
    core.setFailed('This action only works on issue comments');
    throw new Error('This action only works on issue comments');
  }
}

function emit(body) {
  github.rest.issues.createComment({ ...ctx.issue, body });
}

function emitHelp() {
  emit(
    `@${ctx.actor} see help\n` +
      `\n` +
      '---\n' +
      `\n` +
      '```\n' +
      `Virtru request enables you to request data from another party securely.\n` +
      `\n` +
      `To request data from another party, use the following command:\n` +
      `\n` +
      `${BASE_COMMAND} request <email-address> <github-username>\n` +
      `Usage:\n` +
      `    \n` +
      `    email-address: The email address you want to have access to the shared data\n` +
      `        E.g. bob@example.com\n` +
      `    \n` +
      `    github-username: The username of the person you want notified when requesting shared data.\n` +
      `        E.g. @bob\n` +
      `    \n` +
      `    options: Alternate options.\n` +
      `        - email: used to specify that you want to use basic email and not github integration to recieve data\n` +
      '```'
  );
}

function emitError(err) {
  emit(
    `@${ctx.actor} invalid use of command. For help \`/virtru help\`\n\n` +
      '---\n' +
      '```\n' +
      `> ${ctx.payload.comment.body}\n\n` +
      `error: ${err.message}\n` +
      '```'
  );
}

function runCommandRequest(args) {
  try {
    if (args.length < 2) {
      throw new Error('Invalid number of arguments');
    }
    const [email, githubUsername, opts] = args;
    log.info('Request command args', { email, githubUsername, opts });

    if (!/^(.+)@(.+)$/.test(email)) {
      log.error('Invalid email address', email);
      throw new Error('Invalid email address');
    }

    if (!/^@[a-zA-Z0-9_-]/.test(githubUsername)) {
      log.error('Invalid username', githubUsername);
      throw new Error('Invalid github username');
    }

    let link = `${baseUrl}/${email}`;

    // Add the integration reference
    if (opts === 'int') link += linkRef;

    // Success and failure messages
    emit(
      `${githubUsername} you have been asked to securely share data with ${ctx.actor}. Please use this url ${link}`
    );
  } catch (err) {
    emitError(err);
  }
}


// Possible results:
//   - will exit the action if not a virtru command
//   - will emit help if the command is help
//   - will emit an error if the command is invalid
//   - will emit a success message if the command is valid
function main() {
  // Ensure that the action is only run on issue comments
  ensureCorrectEvent();

  // Skip if base command is not present
  if (!new RegExp(`^${BASE_COMMAND}`).test(ctx.payload.comment.body)) return;

  // Extract command
  const [command, ...args] = ctx.payload.comment.body
    .substring(BASE_COMMAND.length)
    .trim()
    .split(' ');
  log.info('Command arguments', args);

  switch (command) {
    case 'help':
      emitHelp();
      break;
    case 'request':
      runCommandRequest(args);
      break;
    case 'send':
      emitError(new Error('send command is not implemented'));
      break;
    default:
      emitError(new Error('invalid command'));
  }
}

// Execute the main function
main();
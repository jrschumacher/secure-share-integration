import {RunOptions, RunTarget} from 'github-action-ts-run-api';
import { main } from './index';

// Will wait until returned promise fulfills. 
// Use RunTarget.syncFn() for regular functions
const target = RunTarget.asyncFn( main );
const options = RunOptions.create()
    .setInputs({in1: 'abc'})
    .setEnv({ENV2: 'def'})
    .setState({my_state: 'ghi'});

const result = await target.run(options);

assert(result.durationMs >= 1000);
assert(result.commands.outputs === {out1: 'abc', out2: 'def'});
assert(result.commands.exportedVars === {v3: 'ghi'});
assert(result.exitCode === 1);
// changes were isolated inside a function run
assert(process.exitCode !== 1);
assert(result.commands.errors === ['err1']);
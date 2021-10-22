const core = require('@actions/core');
const github = require('@actions/github');

try {
    const payload = JSON.stringify(github.context.payload, undefined, 2)

    const pull_request = github.context.payload.pull_request;
    const merge_commit_sha = pull_request.merge_commit_sha;

    console.log(`The event payload: ${payload}`);
    console.log(`Merge Commit SHA: ${merge_commit_sha}`);
} catch (error) {
    core.setFailed(error.message);
}
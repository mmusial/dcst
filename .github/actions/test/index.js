const core = require('@actions/core');
const github = require('@actions/github');

try {
    const payload = github.context.payload;
    const payload_json = JSON.stringify(payload, undefined, 2)

    
    if ('pull_request' in payload) {
        core.setFailed("No 'pull_request' in context payload");
    }

    const pull_request = payload.pull_request;
    const merge_commit_sha = pull_request.merge_commit_sha;

    console.log(`The event payload: ${payload_json}`);
    console.log(`Merge Commit SHA: ${merge_commit_sha}`);
} catch (error) {
    core.setFailed(error.message);
}
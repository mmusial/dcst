const core = require('@actions/core');
const github = require('@actions/github');





async function main(payload) {
    try {
        const payload_json = JSON.stringify(payload, undefined, 2)    
        
        if (!('pull_request' in payload)) {
            core.setFailed("No 'pull_request' in context payload");
            return;
        }
    
        const pull_request = payload.pull_request;
        if (!('merge_commit_sha' in pull_request)) {
            core.setFailed("No 'merge_commit_sha' in pull_request payload");
            return;
        }

        const merge_commit_sha = pull_request.merge_commit_sha;
    
        //console.log(`The event payload: ${payload_json}`);
        console.log(`Merge Commit SHA: ${merge_commit_sha}`);
        
        const repo_token = core.getInput('repo-token');
        console.log(`Token: ${repo_token}`);
        const octokit = github.getOctokit(repo_token);

        const commit_info = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
            owner: "mmusial",
            repo: "dcst",
            ref: merge_commit_sha
          });
        const commit_info_json = JSON.stringify(commit_info, undefined, 2);
        console.log(`${commit_info_json}`);
        
    } catch (error) {
        core.setFailed(error.message);
    }
}


main(github.context.payload);
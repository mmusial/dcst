const core = require('@actions/core');
const github = require('@actions/github');




async function getCommit(octokit, commit_ref) {
    const result = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner: "mmusial",
        repo: "dcst",
        ref: commit_ref
      });
    
    if (!('data' in result)) {
        return null;
    }

    return result.data;
}




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

        const commit_info = await getCommit(octokit, merge_commit_sha);
        const commit_info_json = JSON.stringify(commit_info, undefined, 2);
        console.log(`${commit_info_json}`);
        
    } catch (error) {
        core.setFailed(error.message);
    }
}


main(github.context.payload);
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




async function getPathAuthor(octokit, path)
{
    const result = await octokit.request('GET /repos/{owner}/{repo}/commits?path={path}', {
        owner: "mmusial",
        repo: "dcst",
        path: path
      });
    
    const json = JSON.stringify(result, undefined, 2)
    console.log(json);
    
    if (!('data' in result)) {
        return null;
    }

    const commit_info = result.data;
    if (!('commit' in commit_info)) {
        return null;
    }
    const commit = commit_info.commit;
    if (!('author' in commit)) {
        core.setFailed("No 'author' in commit!");
        return false;
    }

    return commit.author;
}




async function validateCommitFilesAuthor(octokit, commit_info) {
    if (!('commit' in commit_info)) {
        core.setFailed("No 'commit' in commit_info!");
        return false;
    }
    if (!('files' in commit_info)) {
        core.setFailed("No 'files' in commit_info!");
        return false;
    }

    const commit = commit_info.commit;
    const files = commit_info.files;

    
    if (!('author' in commit)) {
        core.setFailed("No 'author' in commit!");
        return false;
    }

    const author = commit.author;

    if (!('email' in author)) {
        core.setFailed("No 'email' in author!");
        return false;
    }
    
    const author_email = author.email;

    console.log(`author_email: ${author_email}`);

    const regex = /Scenarios\/.+\//;

    for (i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = file.filename;
        const status = file.status;
        
        const scenario_folder = filename.match(regex);
        if (scenario_folder === null) {
            // TODO: Proper validation error about trying to merge into invalid path
            return false;
        }

        const original_scenario_folder_author = await getPathAuthor(octokit, scenario_folder);


        console.log(`filename: ${filename}, path_author: ${original_scenario_folder_author}`);
    }

    return true;
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
        
        const commit_files_validation_result = await validateCommitFilesAuthor(octokit, commit_info);
        console.log(`commit_files_validation_result: ${commit_files_validation_result}`);
    } catch (error) {
        core.setFailed(error.message);
    }
}


main(github.context.payload);
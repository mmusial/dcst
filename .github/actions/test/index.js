const core = require('@actions/core');
const github = require('@actions/github');



// TODO: Read that from parameters
const OWNER = "mmusial";
const REPO = "dcst";



async function getCommit(octokit, commit_ref) {
    const result = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner: OWNER,
        repo: REPO,
        ref: commit_ref
      });
    
    if (!('data' in result)) {
        return null;
    }

    return result.data;
}




async function getPathAuthorEmail(octokit, path)
{
    const result = await octokit.request('GET /repos/{owner}/{repo}/commits?per_page=1&path={path}', {
        owner: OWNER,
        repo: REPO,
        path: path
      });
    
    if (!('data' in result)) {
        return null;
    }
    if (result.data.length == 0) {
        return null;
    }

    const commit_info = result.data[0];
    if (!('commit' in commit_info)) {
        return null;
    }
    const commit = commit_info.commit;
    if (!('author' in commit)) {
        return null;
    }

    return commit.author.email;
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

        const original_scenario_folder_author_email = await getPathAuthorEmail(octokit, scenario_folder);
        //console.log(`filename: ${filename}, authors_match: ${original_scenario_folder_author_email === author_email}`);
        if (original_scenario_folder_author_email !== author_email) {
            // TODO: Proper validation error about original author doesn't match PR one
            return false;
        }
    }

    return true;
}




async function main(payload) {
    try {
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
    
        console.log(`Merge Commit SHA: ${merge_commit_sha}`);
        
        const repo_token = core.getInput('repo-token');
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
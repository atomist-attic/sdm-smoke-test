import { editOne } from "@atomist/automation-client/operations/edit/editAll";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { BranchCommit, EditMode } from "@atomist/automation-client/operations/edit/editModes";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

export function edit(credentials: PositionErrorCallback,
                     editMode: EditMode,
                     id: GitHubRepoRef,
                     editor: (p: GitProject) => Promise<any>) {
    return editOne(null, credentials,
        editor,
        editMode,
        id);
}
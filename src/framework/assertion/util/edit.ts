import { editOne } from "@atomist/automation-client/operations/edit/editAll";
import { EditMode } from "@atomist/automation-client/operations/edit/editModes";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { Project } from "@atomist/automation-client/project/Project";
import { EditResult } from "@atomist/automation-client/operations/edit/projectEditor";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

export function edit(credentials: ProjectOperationCredentials,
                     id: GitHubRepoRef,
                     editMode: EditMode,
                     editor: (p: Project) => Promise<any>): Promise<EditResult> {
    return editOne(null, credentials,
        (p => editor(p).then(() => p)) as SimpleProjectEditor,
        editMode,
        id);
}

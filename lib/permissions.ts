type Actor = { id: string; role: string };
type OwnedProject = { mentorId: string };

export function canManageProject(actor: Actor, project: OwnedProject) {
  return actor.role === "ADMIN" || actor.id === project.mentorId;
}

export function canUpdateApplication(
  actor: Actor,
  application: { userId: string; project: OwnedProject },
  status: string,
) {
  return status === "WITHDRAWN"
    ? actor.id === application.userId
    : canManageProject(actor, application.project);
}

/** Peer and mentor reviews open only once the project reaches its final review. */
export function canReviewIn(projectStatus: string) {
  return projectStatus === "REVIEWING" || projectStatus === "COMPLETED";
}

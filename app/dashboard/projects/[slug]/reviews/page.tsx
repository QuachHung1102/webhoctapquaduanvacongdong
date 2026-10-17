import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { getProjectBySlug } from "@/lib/queries/project";
import { prisma } from "@/lib/db";
import ReviewPanel from "@/components/dashboard/ReviewPanel";

export const metadata: Metadata = { title: "Đánh giá dự án — ProjectHub" };

export default async function ReviewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const authUser = await requireAuth();
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const isMentor = project.mentorId === authUser.id;
  const membership = project.members.find((m) => m.user.id === authUser.id);
  if (!isMentor && !membership) notFound();

  // Peers to review = all members (excluding self). The mentor is listed once, as "mentor",
  // and is reviewed through the mentor-review form, never as a peer.
  const allParticipants = [
    ...project.members.filter((m) => m.user.id !== project.mentorId).map((m) => ({ id: m.user.id, name: m.user.name, avatarUrl: m.user.avatarUrl ?? null, username: m.user.username ?? null, role: "member" as const })),
    { id: project.mentor.id, name: project.mentor.name, avatarUrl: project.mentor.avatarUrl ?? null, username: null, role: "mentor" as const },
  ].filter((p) => p.id !== authUser.id);

  // Reviews already given by current user in this project
  const existingReviews = await prisma.review.findMany({
    where: { projectId: project.id, reviewerId: authUser.id },
    select: { revieweeId: true, rating: true, comment: true },
  });

  // Mentor reviews given by current user
  const existingMentorReview = await prisma.mentorReview.findFirst({
    where: { projectId: project.id, reviewerId: authUser.id },
    select: { mentorId: true, rating: true, comment: true },
  });

  // Reviews received by current user: peer reviews, plus mentor reviews when they mentor this project
  const reviewer = { select: { id: true, name: true, avatarUrl: true } } as const;
  const [peerReviews, mentorReviews] = await Promise.all([
    prisma.review.findMany({
      where: { projectId: project.id, revieweeId: authUser.id },
      include: { reviewer },
    }),
    isMentor
      ? prisma.mentorReview.findMany({
          where: { projectId: project.id, mentorId: authUser.id },
          include: { reviewer },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);
  const receivedReviews = [...mentorReviews, ...peerReviews];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-1">
          <a href={`/dashboard/projects/${slug}`} className="hover:text-slate-600">{project.title}</a>
          {" / "}Đánh giá
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Đánh giá thành viên</h1>
        <p className="text-slate-500 text-sm mt-1">Đánh giá đồng đội và mentor sau khi tham gia dự án.</p>
      </div>

      <ReviewPanel
        projectId={project.id}
        isMentor={isMentor}
        mentorId={project.mentor.id}
        participants={allParticipants}
        existingReviews={existingReviews}
        existingMentorReview={existingMentorReview ?? undefined}
        receivedReviews={receivedReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment ?? "",
          reviewer: r.reviewer,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

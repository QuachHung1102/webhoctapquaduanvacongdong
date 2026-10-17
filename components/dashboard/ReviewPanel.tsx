"use client";

import { useState, useTransition } from "react";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";

interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
  username: string | null;
  role: "member" | "mentor";
}

interface ExistingReview {
  revieweeId: string;
  rating: number;
  comment: string | null;
}

interface ReceivedReview {
  id: string;
  rating: number;
  comment: string;
  reviewer: { id: string; name: string; avatarUrl: string | null };
  createdAt: string;
}

interface Props {
  projectId: string;
  isMentor: boolean;
  mentorId: string;
  participants: Participant[];
  existingReviews: ExistingReview[];
  existingMentorReview?: { mentorId: string; rating: number; comment: string | null };
  receivedReviews: ReceivedReview[];
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange?.(star)}
          className={`text-2xl transition-transform ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"} ${star <= display ? "text-amber-400" : "text-slate-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewForm({
  target,
  isMentorReview,
  projectId,
  initial,
  onSaved,
}: {
  target: Participant;
  isMentorReview: boolean;
  projectId: string;
  initial?: { rating: number; comment: string | null };
  onSaved: (revieweeId: string, rating: number, comment: string) => void;
}) {
  const [rating, setRating]   = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [isPending, start]    = useTransition();
  const [error, setError]     = useState("");
  const [saved, setSaved]     = useState(false);

  async function handleSubmit() {
    if (!rating) { setError("Vui lòng chọn số sao."); return; }
    setError("");
    start(async () => {
      const url = isMentorReview ? "/api/mentor-reviews" : "/api/reviews";
      const body = isMentorReview
        ? { mentorId: target.id, projectId, rating, comment }
        : { projectId, revieweeId: target.id, rating, comment };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lỗi"); return; }
      setSaved(true);
      onSaved(target.id, rating, comment);
    });
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm py-2">
        <span>✓</span> Đã lưu đánh giá của bạn
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Nhận xét của bạn về người này (tùy chọn)..."
        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <button type="button" onClick={handleSubmit} disabled={isPending || !rating}
        className="text-sm font-semibold bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors">
        {isPending ? "Đang lưu..." : initial ? "Cập nhật đánh giá" : "Gửi đánh giá"}
      </button>
    </div>
  );
}

const RATING_LABEL: Record<number, string> = {
  1: "Kém", 2: "Trung bình", 3: "Khá", 4: "Tốt", 5: "Xuất sắc",
};

export default function ReviewPanel({
  projectId, isMentor, mentorId,
  participants, existingReviews, existingMentorReview, receivedReviews,
}: Props) {
  const [reviews, setReviews] = useState<Record<string, { rating: number; comment: string }>>(
    Object.fromEntries(existingReviews.map((r) => [r.revieweeId, { rating: r.rating, comment: r.comment ?? "" }]))
  );
  const [mentorReview, setMentorReview] = useState(existingMentorReview);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleSaved(revieweeId: string, rating: number, comment: string) {
    setReviews((prev) => ({ ...prev, [revieweeId]: { rating, comment } }));
  }

  function handleMentorSaved(_id: string, rating: number, comment: string) {
    setMentorReview({ mentorId, rating, comment });
  }

  const peerParticipants = participants.filter((p) => p.role === "member");
  const mentorParticipant = participants.find((p) => p.role === "mentor");

  return (
    <div className="space-y-6">
      {/* Peer reviews */}
      {peerParticipants.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Đánh giá đồng đội</h2>
          <div className="space-y-4">
            {peerParticipants.map((p) => {
              const existing = reviews[p.id];
              const isExpanded = expandedId === p.id;
              return (
                <div key={p.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} src={p.avatarUrl} size="md" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.name}</p>
                        {existing && <StarRating value={existing.rating} />}
                      </div>
                    </div>
                    <button onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="text-xs text-indigo-600 font-medium hover:underline">
                      {existing ? "Chỉnh sửa" : "Đánh giá"}
                    </button>
                  </div>
                  {existing && !isExpanded && existing.comment && (
                    <p className="text-sm text-slate-500 mt-2 pl-12 italic">“{existing.comment}”</p>
                  )}
                  {isExpanded && (
                    <div className="mt-3 pl-12">
                      <ReviewForm
                        target={p}
                        isMentorReview={false}
                        projectId={projectId}
                        initial={existing}
                        onSaved={handleSaved}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mentor review (only for learners) */}
      {!isMentor && mentorParticipant && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Đánh giá Mentor</h2>
          <div className="border border-amber-100 bg-amber-50/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={mentorParticipant.name} src={mentorParticipant.avatarUrl} size="md" />
              <div>
                <p className="text-sm font-medium text-slate-800">{mentorParticipant.name}</p>
                <p className="text-xs text-amber-600 font-medium">Mentor</p>
              </div>
            </div>
            {mentorReview && <StarRating value={mentorReview.rating} />}
            <ReviewForm
              target={mentorParticipant}
              isMentorReview={true}
              projectId={projectId}
              initial={mentorReview ? { rating: mentorReview.rating, comment: mentorReview.comment ?? null } : undefined}
              onSaved={handleMentorSaved}
            />
          </div>
        </div>
      )}

      {/* Reviews received */}
      {receivedReviews.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Đánh giá bạn nhận được</h2>
          <div className="space-y-3">
            {receivedReviews.map((r) => (
              <div key={r.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.reviewer.name} src={r.reviewer.avatarUrl} size="sm" />
                    <p className="text-sm font-medium text-slate-700">{r.reviewer.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={r.rating} />
                    <span className="text-xs text-slate-400">{RATING_LABEL[r.rating]}</span>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-slate-600 italic pl-10">“{r.comment}”</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {receivedReviews.length === 0 && (
        <p className="text-sm text-slate-400 text-center">Bạn chưa nhận được đánh giá nào trong dự án này.</p>
      )}

      {peerParticipants.length === 0 && !mentorParticipant && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="star" className="w-6 h-6" /></span>
          <p className="text-slate-500">Chưa có thành viên nào để đánh giá.</p>
        </div>
      )}
    </div>
  );
}

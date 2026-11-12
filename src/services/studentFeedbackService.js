const API = '/api/student-feedback';

export async function getStudentFeedback(signal) {
  const response = await fetch(API, { signal });
  if (!response.ok) throw new Error('Could not load student feedback.');
  const data = await response.json();
  return data.feedback || [];
}

export async function submitStudentFeedback({ user, category, message, location, anonymous }) {
  const response = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category,
      message,
      location,
      anonymous,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Could not submit your report.');
  return data.feedback;
}

export async function setStudentFeedbackStatus(feedbackId, status) {
  const params = new URLSearchParams({ status });
  const response = await fetch(`${API}/${encodeURIComponent(feedbackId)}?${params}`, { method: 'PATCH' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Could not update feedback status.');
  return data.feedback;
}

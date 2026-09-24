import { PresentationSlide, UserProfile, StudentActivitySession } from '../types';

/**
 * Automatically adjusts presentation slide titles, subtitles, content, and speaking notes
 * to match the logged-in student's account profile (Name, School, Class).
 */
export function adaptSlidesToUser(
  slides: PresentationSlide[],
  user?: UserProfile | null
): PresentationSlide[] {
  if (!user || !user.name || !Array.isArray(slides)) return slides;

  // Clean name without role markers
  const fullName = user.name
    .replace(/\s*(\[|\()(student|guru|teacher|admin|kelompok|central_admin|school_admin)[^\]\)]*(\]|\))/gi, '')
    .trim();
  const firstName = fullName.split(' ')[0] || fullName;
  const school = user.schoolName || 'SDN 01 Nusantara';
  const className = user.className || 'Kelas V';

  let hasChanged = false;

  const adapted = slides.map((slide) => {
    let title = slide.title || '';
    let subtitle = slide.subtitle || '';
    let content = slide.content || '';
    let speakingNotes = slide.speakingNotes || '';

    // Transform title
    const newTitle = title
      .replace(/Petualangan Adit/gi, `Petualangan ${firstName}`)
      .replace(/Adit Pratama/gi, fullName)
      .replace(/\bAdit\b/g, firstName);

    // Transform subtitle
    const newSubtitle = subtitle
      .replace(/Adit Pratama/gi, fullName)
      .replace(/\bAdit\b/g, firstName)
      .replace(/Kelas V SDN 01 Nusantara/gi, `${className} ${school}`)
      .replace(/SDN 01 Nusantara/gi, school);

    // Transform content
    const newContent = content
      .replace(/Nama saya Adit Pratama/gi, `Nama saya ${fullName}`)
      .replace(/Saya Adit Pratama/gi, `Saya ${fullName}`)
      .replace(/Nama saya Adit/gi, `Nama saya ${fullName}`)
      .replace(/Saya Adit/gi, `Saya ${firstName}`)
      .replace(/Adit Pratama/gi, fullName)
      .replace(/— Adit Pratama/gi, `— ${fullName}`)
      .replace(/— Adit/gi, `— ${fullName}`)
      .replace(/\bAdit\b/g, firstName)
      .replace(/SDN 01 Nusantara/gi, school);

    // Transform speaking notes
    const newNotes = speakingNotes
      .replace(/Adit Pratama/gi, fullName)
      .replace(/\bAdit\b/g, firstName)
      .replace(/SDN 01 Nusantara/gi, school);

    if (
      newTitle !== title ||
      newSubtitle !== subtitle ||
      newContent !== content ||
      newNotes !== speakingNotes
    ) {
      hasChanged = true;
    }

    return {
      ...slide,
      title: newTitle,
      subtitle: newSubtitle,
      content: newContent,
      speakingNotes: newNotes
    };
  });

  return hasChanged ? adapted : slides;
}

/**
 * Synchronize a student activity session with the logged-in user profile
 */
export function adaptSessionToUser(
  session: StudentActivitySession,
  user?: UserProfile | null
): StudentActivitySession {
  if (!user || !user.name) return session;

  const fullName = user.name
    .replace(/\s*(\[|\()(student|guru|teacher|admin|kelompok|central_admin|school_admin)[^\]\)]*(\]|\))/gi, '')
    .trim();
  const firstName = fullName.split(' ')[0] || fullName;

  return {
    ...session,
    studentId: user.id,
    studentName: fullName,
    presentation: adaptSlidesToUser(session.presentation || [], user),
    peerQuestions: (session.peerQuestions || []).map((pq) => ({
      ...pq,
      question: pq.question ? pq.question.replace(/\bAdit\b/g, firstName) : pq.question,
      presenterAnswer: pq.presenterAnswer ? pq.presenterAnswer.replace(/\bAdit\b/g, firstName) : pq.presenterAnswer,
      aiCoachHint: pq.aiCoachHint ? pq.aiCoachHint.replace(/\bAdit\b/g, firstName) : pq.aiCoachHint
    }))
  };
}

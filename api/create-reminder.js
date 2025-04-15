export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { title, start, end, description, location } = req.body;

  if (!title || !start || !end || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DTSTART;TZID=America/Chicago:${start.replace(/[-:]/g, '').slice(0, 15)}
DTEND;TZID=America/Chicago:${end.replace(/[-:]/g, '').slice(0, 15)}
DESCRIPTION:${description}
LOCATION:${location || '—'}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`.trim();

  const githubUsername = 'erikfriend23';
  const repo = 'calendar-events-api';
  const path = 'reminder.ics';
  const githubToken = process.env.GITHUB_TOKEN;

  const githubApiUrl = `https://api.github.com/repos/${githubUsername}/${repo}/contents/${path}`;

  try {
    const fileRes = await fetch(githubApiUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const fileData = fileRes.ok ? await fileRes.json() : {};
    const sha = fileData.sha;

    const payload = {
      message: 'Update reminder.ics',
      content: Buffer.from(icsContent).toString('base64'),
      sha
    };

    const updateRes = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!updateRes.ok) {
      const errorDetails = await updateRes.text();
      return res.status(500).json({
        message: 'Failed to update reminder.ics',
        error: errorDetails
      });
    }

    return res.status(200).json({
      message: 'reminder.ics updated',
      github_url: `https://erikfriend23.github.io/calendar-events/reminder.ics`
    });

  } catch (err) {
    return res.status(500).json({
      message: 'Unexpected error',
      error: err.message
    });
  }
}

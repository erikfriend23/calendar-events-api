import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  const { title, start, end, description, location } = req.body;

  if (!title || !start || !end || !description) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const githubUsername = 'erikfriend23';
  const repo = 'calendar-events';
  const path = 'reminder.ics';

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY=${title}
DTSTART;TZID=America/Chicago:${start.replace(/[-:]/g, '').slice(0, 15)}
DTEND;TZID=America/Chicago:${end.replace(/[-:]/g, '').slice(0, 15)}
DESCRIPTION=${description}
LOCATION=${location || '—'}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`.trim();

  const githubApiUrl = \`https://api.github.com/repos/\${githubUsername}/\${repo}/contents/\${path}\`;

  try {
    const { data: currentFile } = await axios.get(githubApiUrl, {
      headers: {
        Authorization: \`token \${githubToken}\`,
        Accept: 'application/vnd.github.v3+json',
      }
    });

    await axios.put(githubApiUrl, {
      message: 'Update reminder.ics',
      content: Buffer.from(icsContent).toString('base64'),
      sha: currentFile.sha,
    }, {
      headers: {
        Authorization: \`token \${githubToken}\`,
        Accept: 'application/vnd.github.v3+json',
      }
    });

    return res.status(200).json({
      message: 'reminder.ics updated',
      github_url: \`https://erikfriend23.github.io/calendar-events/reminder.ics\`
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update reminder.ics',
      error: error.response?.data || error.message
    });
  }
}
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  // Initialize Resend inside the request handler so it doesn't crash Vercel's build phase
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await request.json();
    const { fullName, email, practiceType, scannerType, message } = body;

    // Validate the incoming data
    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName and email' },
        { status: 400 }
      );
    }

    // Send the email using Resend
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'appointmentselite@gmail.com',
      subject: `New Demo Request: ${fullName}`,
      html: `
        <h2>New Demo Request from DCOS Landing Page</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Practice Type:</strong> ${practiceType}</p>
        <p><strong>Scanner Ecosystem:</strong> ${scannerType}</p>
        <p><strong>Message / Special Requests:</strong></p>
        <p>${message || '<em>No message provided</em>'}</p>
      `,
    });

    if (data.error) {
      console.error('Resend Error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";

interface SessionReminderProps {
  recipientName: string;
  otherPartyName: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: string;
  videoLink?: string;
  sessionUrl: string;
}

export default function SessionReminder({
  recipientName = "Ahmad",
  otherPartyName = "Imam Abdullah",
  date = "2025-06-20",
  startTime = "14:00",
  endTime = "14:30",
  mode = "In Person",
  videoLink,
  sessionUrl = "https://mosqueconnect.app/dashboard/user/sessions/123",
}: SessionReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Reminder: Council session tomorrow at {startTime}</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: "#fffbeb", borderRadius: "12px", padding: "32px", border: "1px solid #fde68a" }}>
            <Heading style={{ color: "#92400e", fontSize: "22px" }}>⏰ Session Tomorrow</Heading>
            <Text style={{ color: "#374151" }}>Dear {recipientName},</Text>
            <Text style={{ color: "#374151" }}>
              This is a reminder about your council session with {otherPartyName} tomorrow.
            </Text>
            <Hr style={{ borderColor: "#fde68a", margin: "20px 0" }} />
            <Text style={{ margin: 0 }}><strong>Date:</strong> {date}</Text>
            <Text style={{ margin: 0 }}><strong>Time:</strong> {startTime} – {endTime}</Text>
            <Text style={{ margin: 0 }}><strong>Mode:</strong> {mode}</Text>
            {mode === "Video Call" && videoLink && (
              <Text style={{ margin: "8px 0 0" }}>
                <strong>Video link:</strong>{" "}
                <Link href={videoLink} style={{ color: "#2563eb" }}>{videoLink}</Link>
              </Text>
            )}
            <Hr style={{ borderColor: "#fde68a", margin: "20px 0" }} />
            <Link
              href={sessionUrl}
              style={{ backgroundColor: "#d97706", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}
            >
              View Session
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Fix missing import
import { Section } from "@react-email/components";

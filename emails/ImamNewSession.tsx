import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

interface ImamNewSessionProps {
  imamName: string;
  userName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  mode: string;
  urgency: string;
  topic: string;
  sessionUrl: string;
}

export default function ImamNewSession({
  imamName = "Imam Abdullah",
  userName = "Ahmad",
  date = "2025-06-20",
  startTime = "14:00",
  durationMinutes = 30,
  mode = "In Person",
  urgency = "Regular",
  topic = "Marriage guidance",
  sessionUrl = "https://mosqueconnect.app/dashboard/imam/sessions/123",
}: ImamNewSessionProps) {
  return (
    <Html>
      <Head />
      <Preview>New session booking from {userName} — {date} at {startTime}</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #e5e7eb" }}>
            <Heading style={{ color: "#15803d", fontSize: "22px" }}>New Session Booking</Heading>
            <Text>Dear {imamName},</Text>
            <Text>A community member has booked a council session with you.</Text>
            <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />
            {[
              ["Community Member", userName],
              ["Date", date],
              ["Time", `${startTime} (${durationMinutes} min)`],
              ["Mode", mode],
              ["Urgency", urgency],
              ["Topic", topic],
            ].map(([label, value]) => (
              <Text key={label} style={{ margin: "4px 0" }}>
                <strong style={{ color: "#6b7280" }}>{label}:</strong> {value}
              </Text>
            ))}
            <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />
            <Link
              href={sessionUrl}
              style={{ backgroundColor: "#15803d", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}
            >
              View Session Details
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface BookingConfirmationProps {
  userName: string;
  imamName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  mode: string;
  topic: string;
  sessionUrl: string;
}

export default function BookingConfirmation({
  userName = "Ahmad",
  imamName = "Imam Abdullah",
  date = "2025-06-20",
  startTime = "14:00",
  endTime = "14:30",
  durationMinutes = 30,
  mode = "In Person",
  topic = "Marriage guidance",
  sessionUrl = "https://mosqueconnect.app/dashboard/user/sessions/123",
}: BookingConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Your council session is confirmed — {date} at {startTime}</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "32px", border: "1px solid #e5e7eb" }}>
            <Heading style={{ color: "#15803d", fontSize: "22px", marginBottom: "8px" }}>
              Session Confirmed
            </Heading>
            <Text style={{ color: "#374151" }}>Dear {userName},</Text>
            <Text style={{ color: "#374151" }}>
              Your council session with {imamName} has been booked.
            </Text>
            <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />
            <Section>
              {[
                ["Date", date],
                ["Time", `${startTime} – ${endTime}`],
                ["Duration", `${durationMinutes} minutes`],
                ["Mode", mode],
                ["Topic", topic],
              ].map(([label, value]) => (
                <Row key={label} style={{ marginBottom: "8px" }}>
                  <Text style={{ margin: 0 }}>
                    <strong style={{ color: "#6b7280" }}>{label}:</strong>{" "}
                    <span style={{ color: "#111827" }}>{value}</span>
                  </Text>
                </Row>
              ))}
            </Section>
            <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />
            <Link
              href={sessionUrl}
              style={{
                backgroundColor: "#15803d",
                color: "#ffffff",
                borderRadius: "8px",
                padding: "10px 20px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              View Session
            </Link>
          </Section>
          <Text style={{ color: "#9ca3af", fontSize: "12px", textAlign: "center", marginTop: "16px" }}>
            MosqueConnect · Serving your community
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

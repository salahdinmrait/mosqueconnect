import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

interface SessionCancellationProps {
  recipientName: string;
  cancelledByName: string;
  date: string;
  startTime: string;
  reason: string;
  rebookUrl?: string;
}

export default function SessionCancellation({
  recipientName = "Ahmad",
  cancelledByName = "Imam Abdullah",
  date = "2025-06-20",
  startTime = "14:00",
  reason = "Unavoidable commitment",
  rebookUrl,
}: SessionCancellationProps) {
  return (
    <Html>
      <Head />
      <Preview>Your session on {date} has been cancelled</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #fecaca" }}>
            <Heading style={{ color: "#dc2626", fontSize: "22px" }}>Session Cancelled</Heading>
            <Text style={{ color: "#374151" }}>Dear {recipientName},</Text>
            <Text style={{ color: "#374151" }}>
              Your council session on <strong>{date}</strong> at <strong>{startTime}</strong> has been
              cancelled by {cancelledByName}.
            </Text>
            <Text style={{ color: "#374151" }}><strong>Reason:</strong> {reason}</Text>
            {rebookUrl && (
              <>
                <Hr style={{ borderColor: "#fecaca", margin: "20px 0" }} />
                <Text style={{ color: "#374151" }}>You can rebook at a time that works for you:</Text>
                <Link
                  href={rebookUrl}
                  style={{ backgroundColor: "#dc2626", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}
                >
                  Rebook Session
                </Link>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

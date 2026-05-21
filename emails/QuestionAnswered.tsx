import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

interface QuestionAnsweredProps {
  userName: string;
  questionContent: string;
  questionUrl: string;
}

export default function QuestionAnswered({
  userName = "Ahmad",
  questionContent = "What are the conditions for a valid nikah?",
  questionUrl = "https://mosqueconnect.app/dashboard/user/questions/123",
}: QuestionAnsweredProps) {
  return (
    <Html>
      <Head />
      <Preview>Your question has been answered by the mosque team</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "32px", border: "1px solid #e5e7eb" }}>
            <Heading style={{ color: "#15803d", fontSize: "22px" }}>Your Question Has Been Answered</Heading>
            <Text>Dear {userName},</Text>
            <Text>The mosque team has replied to your question:</Text>
            <Section style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "16px", margin: "16px 0" }}>
              <Text style={{ color: "#374151", margin: 0, fontStyle: "italic" }}>
                &ldquo;{questionContent}&rdquo;
              </Text>
            </Section>
            <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />
            <Link
              href={questionUrl}
              style={{ backgroundColor: "#15803d", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}
            >
              Read the Reply
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

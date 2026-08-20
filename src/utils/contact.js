export const CONTACTS = {
  email: "tatchouarthur@gmail.com",
  portfolio: "https://arthurtatchou-portfolio.vercel.app",
  linkedin: "https://www.linkedin.com/in/arthur-tatchou-587ba92a9",
  github: "https://github.com/Arthurtat33",
  whatsapp: "+237652949715",
};

export function contactFooter(commentStyle = "js") {
  const lines = [
    "Created by Artdev",
    `Email: ${CONTACTS.email}`,
    `Portfolio: ${CONTACTS.portfolio}`,
    `LinkedIn: ${CONTACTS.linkedin}`,
    `GitHub: ${CONTACTS.github}`,
    `WhatsApp: ${CONTACTS.whatsapp}`,
  ];
  if (commentStyle === "python") {
    return lines.map((l) => `# ${l}`).join("\n");
  }
  return `/*\n${lines.map((l) => `\ud83d\udc64 ${l}`).join("\n")}\n*/`;
}

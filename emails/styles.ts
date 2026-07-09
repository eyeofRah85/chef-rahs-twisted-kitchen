export const brandEmail = {
  name: "Chef Rah's Twisted Kitchen",
  logoPath: "/business%20logo/chef-rah-logo-transparent-240w.png",
  supportText:
    "Questions? Reply to this email and Chef Rah's Twisted Kitchen will help.",
};

export const emailStyles = {
  body: {
    backgroundColor: "#f8efe4",
    fontFamily: "Arial, Helvetica, sans-serif",
    margin: "0",
    padding: "32px 0",
    color: "#2b1813",
  },

  container: {
    backgroundColor: "#fffaf4",
    border: "1px solid #ead8c1",
    borderRadius: "16px",
    maxWidth: "640px",
    overflow: "hidden",
  },

  header: {
    backgroundColor: "#3a1712",
    backgroundImage: "linear-gradient(135deg, #3a1712 0%, #7b1f42 100%)",
    padding: "28px 32px",
    color: "#ffffff",
  },

  headerLogoRow: {
    display: "table",
    width: "100%",
  },

  logoCell: {
    display: "table-cell",
    width: "76px",
    verticalAlign: "middle",
  },

  logo: {
    display: "block",
    width: "64px",
    height: "64px",
    borderRadius: "999px",
    backgroundColor: "#fffaf4",
  },

  brandCell: {
    display: "table-cell",
    verticalAlign: "middle",
  },

  brandName: {
    margin: "0",
    fontFamily:
      "'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive",
    fontSize: "28px",
    lineHeight: "32px",
    color: "#ffffff",
  },

  brandTagline: {
    margin: "4px 0 0",
    fontSize: "12px",
    lineHeight: "18px",
    color: "#f4c46f",
    fontWeight: "700",
    letterSpacing: "0.3px",
    textTransform: "uppercase" as const,
  },

  headerEyebrow: {
    margin: "24px 0 8px",
    fontSize: "12px",
    lineHeight: "18px",
    color: "#f4c46f",
    fontWeight: "700",
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  },

  headerTitle: {
    margin: "0",
    color: "#ffffff",
    fontSize: "30px",
    lineHeight: "36px",
    fontWeight: "800",
  },

  content: {
    padding: "30px 32px",
  },

  section: {
    margin: "0 0 22px",
  },

  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #ead8c1",
    borderRadius: "12px",
    padding: "18px",
    margin: "0 0 18px",
  },

  accentCard: {
    backgroundColor: "#fff3cf",
    border: "1px solid #e7b95c",
    borderRadius: "12px",
    padding: "16px 18px",
    margin: "0 0 18px",
  },

  cardTitle: {
    margin: "0 0 12px",
    color: "#6f1f12",
    fontSize: "17px",
    lineHeight: "22px",
    fontWeight: "800",
  },

  heading: {
    margin: "0 0 12px",
    color: "#24130f",
    fontSize: "22px",
    lineHeight: "28px",
    fontWeight: "800",
  },

  text: {
    margin: "0 0 14px",
    color: "#3b241b",
    fontSize: "15px",
    lineHeight: "24px",
  },

  mutedText: {
    margin: "0 0 12px",
    color: "#6b5a50",
    fontSize: "14px",
    lineHeight: "22px",
  },

  row: {
    margin: "0 0 8px",
    color: "#3b241b",
    fontSize: "14px",
    lineHeight: "22px",
  },

  label: {
    color: "#6f1f12",
    fontWeight: "800",
  },

  totalText: {
    margin: "8px 0 0",
    color: "#24130f",
    fontSize: "24px",
    lineHeight: "30px",
    fontWeight: "800",
  },

  button: {
    display: "inline-block",
    backgroundColor: "#6f1f12",
    color: "#ffffff",
    padding: "13px 22px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "800",
    marginTop: "8px",
  },

  divider: {
    borderColor: "#ead8c1",
    margin: "24px 0",
  },

  statusPill: {
    display: "inline-block",
    backgroundColor: "#f4c46f",
    color: "#3b1712",
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: "800",
  },

  footer: {
    backgroundColor: "#f4eadb",
    borderTop: "1px solid #ead8c1",
    padding: "20px 32px",
  },

  footerText: {
    margin: "0",
    color: "#6b5a50",
    fontSize: "12px",
    lineHeight: "19px",
  },

  footerBrand: {
    margin: "0 0 6px",
    color: "#6f1f12",
    fontSize: "13px",
    lineHeight: "20px",
    fontWeight: "800",
  },

  alertBox: {
    backgroundColor: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "10px",
    padding: "14px",
    margin: "0 0 18px",
  },
} as const;

from pypdf import PdfReader

reader = PdfReader("d:\\WEB-DEV\\ten-days-of-voice-agents-2025\\Knowledge Base - Hosla.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

with open("hosla_info.txt", "w", encoding="utf-8") as f:
    f.write(text)

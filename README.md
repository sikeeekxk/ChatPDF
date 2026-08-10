# Chat with PDF

A responsive web application where users can upload a PDF and ask conversational questions about its contents. 

## Privacy Disclosure
- The original PDF is processed locally in the browser.
- The application does not permanently store the original PDF.
- Selected extracted text is sent through the Azure backend to Gemini.
- Gemini processes text needed for embeddings and answers.
- Free-tier provider data-use rules may differ from paid API rules.


## Development Setup
```bash
npm install
npm run dev
```
